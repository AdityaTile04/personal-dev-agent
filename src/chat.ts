import type { GeminiMessage } from "./types";
import { askGemini } from "./gemini";
import { CONFIG } from "./config";
import {
  printPanel,
  printMarkdown,
  printMuted,
  printError,
  createSpinner,
  prompt,
} from "./renderer";

const SYSTEM_PROMPT = `You are an expert coding assistant embedded in a developer's terminal.
You help with:
- Debugging errors and explaining stack traces clearly
- Code review: spot bugs, suggest improvements, flag anti-patterns
- Generating clean, well-commented code snippets
- Explaining technical concepts with concrete examples

Style rules:
- Be concise and direct. No fluff.
- Always use fenced code blocks with language tags.
- When debugging, explain WHY the error happens, not just the fix.
- Suggest the simplest solution first, then mention alternatives.
- Use markdown — it renders in this terminal.`;

export async function chatCommand(initialMessage?: string): Promise<void> {
  const history: GeminiMessage[] = [];

  printPanel(
    "💬 Coding Assistant",
    "Type your question. Commands: /review  /explain  /clear  /exit",
  );

  async function send(userInput: string): Promise<void> {
    const spinner = createSpinner("Thinking...");

    try {
      const response = await askGemini(userInput, {
        system: SYSTEM_PROMPT,
        history,
      });

      history.push({ role: "user", parts: [{ text: userInput }] });
      history.push({ role: "model", parts: [{ text: response }] });

      const max = CONFIG.maxHistoryTurns * 2;
      if (history.length > max) history.splice(0, history.length - max);

      spinner.stop();
      console.log();
      printMarkdown(response);
    } catch (err) {
      spinner.stop();
      printError(err instanceof Error ? err.message : String(err));
    }
  }

  if (initialMessage) {
    await send(initialMessage);
    return;
  }

  while (true) {
    const input = await prompt("\nYou →");
    const trimmed = input.trim();

    if (!trimmed) continue;

    if (["/exit", "exit", "quit", "q"].includes(trimmed.toLowerCase())) {
      printMuted("Bye! 👋");
      break;
    }

    if (trimmed === "/clear") {
      history.length = 0;
      printMuted("✓ Conversation cleared.");
      continue;
    }

    if (trimmed.startsWith("/review")) {
      const code = trimmed.slice(7).trim();
      if (!code) {
        printMuted("Usage: /review <your code>");
        continue;
      }
      await send(
        `Review this code and suggest improvements:\n\`\`\`\n${code}\n\`\`\``,
      );
      continue;
    }
    if (trimmed.startsWith("/explain")) {
      const concept = trimmed.slice(8).trim();
      if (!concept) {
        printMuted("Usage: /explain <concept>");
        continue;
      }
      await send(`Explain this clearly with a simple example: ${concept}`);
      continue;
    }

    await send(trimmed);
  }
}
