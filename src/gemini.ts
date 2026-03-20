import type {
  AskGeminiOptions,
  GeminiRequestBody,
  GeminiResponse,
} from "./types";
import { GEMINI_API_KEY, GEMINI_API_URL } from "./config";

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
    body.systemInstruction = { parts: [{ text: system }] };
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const msg =
      (err?.error as Record<string, unknown>)?.message ?? res.statusText;

    if (res.status === 401)
      throw new Error("Invalid API key. Check your GEMINI_API_KEY.");
    if (res.status === 429)
      throw new Error("Rate limit hit. Wait a moment and retry.");
    throw new Error(`Gemini API error (${res.status}): ${msg}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("Gemini returned an empty response. Try again.");

  return text;
}
