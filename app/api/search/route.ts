import { NextRequest, NextResponse } from "next/server";

const ANAKIN_API_BASE = "https://api.anakin.io/v1/holocron";
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60_000;

interface Platform {
  name: string;
  action_id: string;
  extraParams?: Record<string, unknown>;
  customParams?: (query: string) => Record<string, unknown>;
}

const ALL_PLATFORMS: Record<string, Platform> = {
  "Amazon (converted)": {
    name: "Amazon (converted)",
    action_id: "am_search_products",
    extraParams: { domain: "amazon.in" },
  },
  "Flipkart":         { name: "Flipkart",         action_id: "fk_search_products" },
  "BigBasket":        { name: "BigBasket",         action_id: "bb_search_products" },
  "Blinkit": {
    name: "Blinkit",
    action_id: "act_blinkit_post_layout_search",
    extraParams: { search_page: "initial", search_type: "keyword" },
  },
  "JioMart":          { name: "JioMart",           action_id: "jm_search_products" },
  "Croma":            { name: "Croma",             action_id: "cr_search_products" },
  "Vijay Sales":      { name: "Vijay Sales",       action_id: "vs_search_products" },
  "Reliance Digital": { name: "Reliance Digital",  action_id: "rd_search_products" },
  "Apollo Pharmacy": {
    name: "Apollo Pharmacy",
    action_id: "aph_search",
    customParams: (q) => ({ query: q, page: 1, per_page: 24, sort: "relevance" }),
  },
  "Tata 1mg": {
    name: "Tata 1mg",
    action_id: "tmg_search",
    customParams: (q) => ({
      query: q,
      city: "New Delhi",
      page: 0,
      per_page: 20,
      sort: "relevance",
      types: "sku,allopathy",
      fetch_eta: true,
    }),
  },
  "Nike": {
    name: "Nike",
    action_id: "nike_search_products",
    customParams: (q) => ({ query: q }),
  },
};

const PLATFORM_CONFIG: Record<string, string[]> = {
  "All":         ["Flipkart", "BigBasket", "JioMart", "Croma", "Reliance Digital"],
  "Electronics": ["Flipkart", "Croma", "Vijay Sales", "Reliance Digital"],
  "Grocery":     ["BigBasket", "Blinkit", "JioMart"],
  "Pharmacy":    ["Apollo Pharmacy", "Tata 1mg"],
  "Fashion":     ["Nike", "Flipkart"],
};

export const EXCLUDED_FROM_BEST_DEAL = new Set(["Vijay Sales", "Amazon (converted)"]);

interface ProductResult {
  title: string;
  price: string;
  mrp: string;
  image: string | null;
  url: string;
}

interface PlatformResult {
  platform: string;
  results: ProductResult[];
  error?: string;
}

async function fetchUsdToInr(): Promise<number> {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!res.ok) return 84;
    const data = await res.json();
    return (data?.rates?.INR as number) ?? 84;
  } catch {
    return 84;
  }
}

function authHeaders() {
  return {
    "X-API-Key": process.env.ANAKIN_API_KEY!,
    "Content-Type": "application/json",
  };
}

async function submitTask(platform: Platform, query: string): Promise<string> {
  const params = platform.customParams
    ? platform.customParams(query)
    : { query, q: query, ...(platform.extraParams ?? {}) };

  const res = await fetch(`${ANAKIN_API_BASE}/task`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action_id: platform.action_id, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Task submission failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const jobId = data?.job_id ?? data?.id ?? data?.data?.job_id ?? data?.data?.id;
  if (!jobId) {
    throw new Error(`No job_id in response: ${JSON.stringify(data)}`);
  }
  return jobId as string;
}

async function pollJob(jobId: string, platform: Platform): Promise<ProductResult[]> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${ANAKIN_API_BASE}/jobs/${jobId}`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Poll failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const status: string = data?.status ?? data?.data?.status;

    if (status === "failed") {
      throw new Error(`Job ${jobId} failed: ${JSON.stringify(data?.error ?? data)}`);
    }

    if (status === "completed") {
      console.log("RAW RESULT:", JSON.stringify(data, null, 2));
      return await normalizeResults(data, platform);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`Job ${jobId} timed out after ${POLL_TIMEOUT_MS}ms`);
}

async function normalizeResults(jobData: unknown, platform: Platform): Promise<ProductResult[]> {
  const d = jobData as Record<string, unknown>;
  const inner = d?.data as Record<string, unknown>;
  const catalogSlug = (inner?.meta as Record<string, unknown>)?.catalog_slug as string | undefined;
  const rawData = inner?.data as Record<string, unknown>;

  type Item = Record<string, unknown>;

  switch (catalogSlug) {
    case "vijaysales": {
      const items = ((rawData?.items as Item[]) ?? []).slice(0, 5);
      return items.map((i) => ({
        title: String(i.name ?? ""),
        price: String(i.vsp ?? ""),
        mrp:   String(i.mrp ?? ""),
        image: i.image_url ? String(i.image_url) : null,
        url:   `https://www.vijaysales.com/${i.url_key ?? ""}`,
      }));
    }
    case "bigbasket": {
      const items = ((rawData?.products as Item[]) ?? []).slice(0, 5);
      return items.map((i) => {
        const images = i.images as unknown[] | undefined;
        return {
          title: String(i.name ?? ""),
          price: String(i.price ?? ""),
          mrp:   String(i.list_price ?? ""),
          image: images?.[0] ? String(images[0]) : null,
          url:   String(i.url ?? ""),
        };
      });
    }
    case "croma": {
      const items = ((rawData?.products as Item[]) ?? []).slice(0, 5);
      return items.map((i) => ({
        title: String(i.name ?? ""),
        price: String(i.selling_price ?? ""),
        mrp:   String(i.mrp ?? ""),
        image: i.image_url ? String(i.image_url) : null,
        url:   String(i.url ?? ""),
      }));
    }
    case "flipkart": {
      const items = ((rawData?.products as Item[]) ?? []).slice(0, 5);
      return items.map((i) => ({
        title: String(i.title ?? ""),
        price: String(i.price ?? ""),
        mrp:   String(i.mrp ?? ""),
        image: null,
        url:   String(i.url ?? ""),
      }));
    }
    case "jiomart": {
      const items = ((rawData?.products as Item[]) ?? []).slice(0, 5);
      return items.map((i) => {
        const images = i.images as unknown[] | undefined;
        return {
          title: String(i.name ?? ""),
          price: String(i.price ?? ""),
          mrp:   String(i.list_price ?? ""),
          image: images?.[0] ? String(images[0]) : null,
          url:   String(i.url ?? ""),
        };
      });
    }
    case "amazon": {
      const rate = await fetchUsdToInr();
      const convertUsd = (raw: unknown): string => {
        const n = parseFloat(String(raw ?? "").replace(/[^0-9.]/g, ""));
        return isNaN(n) || n === 0 ? "" : String(Math.round(n * rate));
      };
      const items = ((rawData?.products as Item[]) ?? [])
        .filter((i) => i.sponsored !== true)
        .slice(0, 5);
      return items.map((i) => ({
        title: String(i.title ?? ""),
        price: convertUsd(i.price),
        mrp:   convertUsd(i.list_price),
        image: i.image_url ? String(i.image_url) : null,
        url:   String(i.url ?? ""),
      }));
    }
    default: {
      // New platforms — normalize by action_id
      switch (platform.action_id) {
        case "aph_search": {
          const items = ((rawData?.products as Item[]) ?? []).slice(0, 5);
          return items.map((i) => ({
            title: String(i.name ?? ""),
            price: String(i.price ?? i.selling_price ?? ""),
            mrp:   String(i.mrp ?? ""),
            image: i.image_url ? String(i.image_url) : i.thumbnail ? String(i.thumbnail) : null,
            url:   "https://www.apollopharmacy.in" + String(i.url_slug ?? i.url ?? ""),
          }));
        }
        case "tmg_search": {
          const items = (
            (rawData?.data as Item[]) ?? (rawData?.products as Item[]) ?? []
          ).slice(0, 5);
          return items.map((i) => ({
            title: String(i.name ?? i.title ?? ""),
            price: String(i.price ?? i.selling_price ?? ""),
            mrp:   String(i.mrp ?? ""),
            image: i.image_url ? String(i.image_url) : i.thumbnail ? String(i.thumbnail) : null,
            url:   String(i.url ?? ""),
          }));
        }
        case "nike_search_products": {
          const items = (
            (rawData?.products as Item[]) ?? (rawData?.items as Item[]) ?? []
          ).slice(0, 5);
          return items.map((i) => ({
            title: String(i.name ?? i.title ?? ""),
            price: String(i.price ?? ""),
            mrp:   String(i.compare_at_price ?? i.original_price ?? ""),
            image: i.image_url ? String(i.image_url) : i.thumbnail ? String(i.thumbnail) : null,
            url:   String(i.url ?? i.product_url ?? ""),
          }));
        }
        case "rd_search_products": {
          const items = ((rawData?.products as Item[]) ?? []).slice(0, 5);
          return items.map((i) => ({
            title: String(i.name ?? i.title ?? ""),
            price: String(i.selling_price ?? i.price ?? ""),
            mrp:   String(i.mrp ?? ""),
            image: i.image_url ? String(i.image_url) : null,
            url:   String(i.url ?? ""),
          }));
        }
        default:
          return [];
      }
    }
  }
}

function filterRelevantResults(products: ProductResult[], query: string): ProductResult[] {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = products.filter((p) =>
    keywords.some((kw) => p.title.toLowerCase().includes(kw))
  );
  return filtered.length > 0 ? filtered : products;
}

async function searchPlatform(platform: Platform, query: string): Promise<PlatformResult> {
  try {
    const jobId = await submitTask(platform, query);
    const raw = await pollJob(jobId, platform);
    const results = filterRelevantResults(raw, query);
    return { platform: platform.name, results };
  } catch (err) {
    return {
      platform: platform.name,
      results: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const category = request.nextUrl.searchParams.get("category")?.trim() ?? "All";

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required query parameter "q"' },
      { status: 400 }
    );
  }

  if (!process.env.ANAKIN_API_KEY) {
    return NextResponse.json(
      { error: "ANAKIN_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  const platformNames = PLATFORM_CONFIG[category] ?? PLATFORM_CONFIG["All"];
  const platforms = platformNames
    .map((name) => ALL_PLATFORMS[name])
    .filter((p): p is Platform => p !== undefined);

  const results = await Promise.all(
    platforms.map((platform) => searchPlatform(platform, query))
  );

  return NextResponse.json(results);
}
