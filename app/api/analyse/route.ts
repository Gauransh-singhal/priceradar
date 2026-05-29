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
}

function buildPrompt(query: string, results: PlatformResults[]): string {
  const lines = results
    .filter((r) => r.results[0])
    .map((r) => `- ${r.platform}: "${r.results[0].title}" — ₹${r.results[0].price}`)
    .join("\n");

  return `You are a price analysis expert for Indian e-commerce. \
Analyse these search results for '${query}' and return ONLY a JSON \
object with no markdown, no backticks, just raw JSON:
{
  "score": <number 1-10, how good is the best deal>,
  "verdict": <one sentence summary>,
  "recommendation": <"Buy Now" | "Wait" | "Compare More">,
  "bestPlatform": <platform name>,
  "reasoning": <2-3 sentences explaining the analysis>,
  "savings": <percentage saved vs average price as a number>
}

Results:
${lines}

Base the score on: how much below average the best price is, \
number of platforms with stock, price consistency across platforms.`;
}

export async function POST(request: NextRequest) {
  let query: string;
  let results: PlatformResults[];

  try {
    const body = await request.json();
    query   = body.query;
    results = body.results;
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

  const prompt = buildPrompt(query, results);

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
