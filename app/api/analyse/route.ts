import { NextRequest, NextResponse } from "next/server";

interface ProductResult {
  title: string;
  price: string;
  mrp: string;
  image: string | null;
  url: string;
}

interface PlatformResults {
  platform: string;
  results: ProductResult[];
  error?: string;
}

interface AnalysisResult {
  score: number;
  verdict: string;
  recommendation: "Buy Now" | "Wait" | "Compare More";
  bestPlatform: string;
  reasoning: string;
  savings: number;
  timing_verdict: "BUY_NOW" | "WAIT" | "MONITOR";
  timing_reason: string;
}

function buildPrompt(query: string, results: PlatformResults[], category: string): string {
  const lines = results
    .filter((r) => r.results[0])
    .map((r) => {
      const top = r.results[0];
      const price = parseFloat(top.price.replace(/[^0-9.]/g, ""));
      const mrp = parseFloat(top.mrp.replace(/[^0-9.]/g, ""));
      const discountStr =
        !isNaN(price) && !isNaN(mrp) && mrp > price && mrp > 0
          ? ` (${Math.round(((mrp - price) / mrp) * 100)}% off MRP ₹${top.mrp})`
          : "";
      return `- ${r.platform}: ₹${top.price}${discountStr}`;
    })
    .join("\n");

  return `You are a price analysis expert for Indian e-commerce.
Current date: May 2026. Product category: ${category}.
Analyse these search results for '${query}' and return ONLY a JSON object with no markdown, no backticks, just raw JSON:
{
  "score": <number 1-10, how good is the best deal>,
  "verdict": <one sentence summary>,
  "recommendation": <"Buy Now" | "Wait" | "Compare More">,
  "bestPlatform": <platform name>,
  "reasoning": <2-3 sentences explaining the analysis>,
  "savings": <percentage saved vs average price as a number>,
  "timing_verdict": <"BUY_NOW" | "WAIT" | "MONITOR">,
  "timing_reason": <one sentence explaining timing based on Indian sale cycles and product refresh cycles>
}

Results:
${lines}

Scoring: how much below average the best price is, number of platforms with stock, price consistency.
Timing guidance — Indian e-commerce calendar: Flipkart Big Billion Days (Oct), Amazon Great Indian Festival (Oct), Republic Day sales (Jan), Independence Day sales (Aug), Diwali sales (Oct/Nov). Consider imminent product launches (iPhones launch Sep, flagship Android phones vary). BUY_NOW = unusually good deal or no better timing expected soon. WAIT = major sale event or product refresh within 1-3 months. MONITOR = prices actively fluctuating.`;
}

export async function POST(request: NextRequest) {
  let query: string;
  let results: PlatformResults[];
  let category = "All";

  try {
    const body = await request.json();
    query    = body.query;
    results  = body.results;
    category = typeof body.category === "string" ? body.category : "All";
    if (!query || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "Request body must include query (string) and results (array)" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  const prompt = buildPrompt(query, results, category);

  let claudeRes: Response;
  try {
    claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages:   [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach Anthropic API: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  if (!claudeRes.ok) {
    const text = await claudeRes.text();
    return NextResponse.json(
      { error: `Anthropic API error (${claudeRes.status}): ${text}` },
      { status: 500 }
    );
  }

  const claudeData = await claudeRes.json();
  const rawText: string = claudeData?.content?.[0]?.text ?? "";

  let analysis: AnalysisResult;
  try {
    analysis = JSON.parse(rawText.trim()) as AnalysisResult;
  } catch {
    return NextResponse.json(
      { error: `Claude returned non-JSON response: ${rawText.slice(0, 200)}` },
      { status: 500 }
    );
  }

  return NextResponse.json(analysis);
}
