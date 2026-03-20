import chalk from "chalk";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

marked.setOptions({ renderer: new TerminalRenderer() });

export function renderMarkdown(text: string): string {
  return marked(text) as string;
}

export function printMarkdown(text: string): void {
  process.stdout.write(renderMarkdown(text));
}

export function printPanel(title: string, body?: string): void {
  const width = 60;
  const border = chalk.dim("─".repeat(width));
  console.log();
  console.log(border);
  console.log(chalk.bold.white(` ${title}`));
  if (body) console.log(chalk.dim(` ${body}`));
  console.log(border);
}

export function printSuccess(msg: string): void {
  console.log(chalk.green("✓ ") + msg);
}

export function printError(msg: string): void {
  console.log(chalk.red("✗ ") + msg);
}

export function printWarning(msg: string): void {
  console.log(chalk.yellow("⚠ ") + msg);
}

export function printMuted(msg: string): void {
  console.log(chalk.dim(msg));
}

export function printInfo(msg: string): void {
  console.log(chalk.cyan("→ ") + msg);
}

export async function prompt(question: string): Promise<string> {
  process.stdout.write(chalk.cyan(question) + " ");
  for await (const line of console) return line;
  return "";
}

export async function confirm(question: string): Promise<boolean> {
  const answer = await prompt(`${question} ${chalk.dim("(y/n)")}`);
  return answer.toLowerCase().startsWith("y");
}

export function createSpinner(label: string) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const timer = setInterval(() => {
    process.stdout.write(
      `\r${chalk.cyan(frames[i++ % frames.length])} ${chalk.dim(label)}`,
    );
  }, 80);

  return {
    stop: (finalMsg?: string) => {
      clearInterval(timer);
      process.stdout.write("\r" + " ".repeat(label.length + 4) + "\r");
      if (finalMsg) console.log(finalMsg);
    },
  };
}

printPanel("dev-agent is alive 🤖", "Foundation layer ready");
printSuccess("types.ts loaded");
printSuccess("config.ts loaded");
printSuccess("gemini.ts loaded");
printSuccess("renderer.ts loaded");
