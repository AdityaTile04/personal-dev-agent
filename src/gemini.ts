import type {
  AskGeminiOptions,
  GeminiRequestBody,
  GeminiResponse,
} from "./types";
import { GEMINI_API_KEY, GEMINI_API_URL } from "./config";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 15000;

export async function askGemini(
  prompt: string,
  options: AskGeminiOptions = {},
): Promise<string> {
  const { system, history = [], temperature = 0.7, maxTokens = 8192 } = options;

  const body: GeminiRequestBody = {
    contents: [...history, { role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (system) {
    body.system_instruction = { parts: [{ text: system }] };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text)
        throw new Error("Gemini returned an empty response. Try again.");
      return text;
    }

    if (res.status === 429) {
      if (attempt < MAX_RETRIES) {
        const wait = RETRY_DELAY_MS * attempt;
        process.stdout.write(
          `\r⏳ Rate limited. Retrying in ${wait / 1000}s... (attempt ${attempt}/${MAX_RETRIES})`,
        );
        await Bun.sleep(wait);
        process.stdout.write("\r" + " ".repeat(60) + "\r");
        continue;
      }
      throw new Error("Rate limit hit. Wait a minute and try again.");
    }

    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const msg =
      (err?.error as Record<string, unknown>)?.message ?? res.statusText;

    if (res.status === 401)
      throw new Error("Invalid API key. Check your GEMINI_API_KEY.");
    if (res.status === 404)
      throw new Error(`Model not found. Check config.ts. (${msg})`);
    throw new Error(`Gemini API error (${res.status}): ${msg}`);
  }

  throw new Error("Max retries reached. Try again later.");
}
