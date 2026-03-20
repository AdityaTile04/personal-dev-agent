import type { AgentConfig } from "./types";
import { homedir } from "os";
import { join } from "path";

export const CONFIG: AgentConfig = {
  geminiModel: Bun.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  dataDir: Bun.env.DEV_AGENT_DATA_DIR ?? join(homedir(), ".dev-agent"),
  maxHistoryTurns: 20,
  defaultWorkMinutes: 25,
  defaultBreakMinutes: 5,
};

export const GEMINI_API_KEY = Bun.env.GEMINI_API_KEY ?? "";

export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent`;

export function validateConfig(): void {
  if (!GEMINI_API_KEY) {
    console.error(
      "\n GEMINI_API_KEY is not set.\n" +
        "   1. Get a free key → https://aistudio.google.com/app/apikey\n" +
        "   2. Add to .env:  GEMINI_API_KEY=your_key_here\n",
    );
    process.exit(1);
  }
}
