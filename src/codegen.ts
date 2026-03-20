import { askGemini } from "./gemini";
import {
  printPanel,
  printMarkdown,
  printMuted,
  printError,
  createSpinner,
  prompt,
} from "./renderer";

const SYSTEM_PROMPT = `You are an expert code generator.
When given a description, you output:
1. Clean, production-ready boilerplate code
2. Proper error handling from the start
3. Inline comments on non-obvious parts
4. A brief "Next steps" comment at the bottom

Rules:
- Match the tech stack if mentioned (e.g. "FastAPI" → use FastAPI)
- Default to TypeScript unless specified
- Use modern idioms and best practices
- Keep it minimal — no over-engineering
- Always wrap code in fenced code blocks with the correct language tag`;

export async function codegenCommand(description: string): Promise<void> {
  printPanel("⚡ Code Generator", description);

  async function generate(input: string): Promise<void> {
    const spinner = createSpinner("Generating...");
    try {
      const response = await askGemini(input, {
        system: SYSTEM_PROMPT,
        temperature: 0.3,
      });
      spinner.stop();
      console.log();
      printMarkdown(response);
    } catch (err) {
      spinner.stop();
      printError(err instanceof Error ? err.message : String(err));
    }
  }

  await generate(`Generate boilerplate for: ${description}`);

  while (true) {
    const input = await prompt(
      "\nRefine → (e.g. 'add error handling', 'use async/await') or Enter to exit:",
    );
    if (!input.trim()) {
      printMuted("Done! Copy the code above into your project.");
      break;
    }
    await generate(
      `Modify the code above to: ${input}\nShow only the updated code.`,
    );
  }
}
