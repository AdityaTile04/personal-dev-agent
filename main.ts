import { Command } from "commander";
import { validateConfig, CONFIG } from "./src/config";
import { chatCommand } from "./src/chat";
import { codegenCommand } from "./src/codegen";
import { morningCommand, eveningCommand } from "./src/planner";
import { pomodoroCommand } from "./src/pomodoro";

validateConfig();

const program = new Command();

program
  .name("dev")
  .description("🤖 dev-agent — personal coding assistant + day planner")
  .version("1.0.0");

program
  .command("chat [question]")
  .description("💬 Chat with your coding assistant")
  .action(async (question?: string) => {
    await chatCommand(question);
  });

program
  .command("gen <description>")
  .description("⚡ Generate boilerplate code")
  .action(async (description: string) => {
    await codegenCommand(description);
  });

program
  .command("morning")
  .description("🌅 Morning briefing + task prioritisation")
  .action(async () => {
    await morningCommand();
  });

program
  .command("evening")
  .description("🌙 Evening recap + mark tasks done")
  .action(async () => {
    await eveningCommand();
  });

program
  .command("pomodoro <task>")
  .description("🍅 Start a Pomodoro focus timer")
  .option(
    "-m, --minutes <number>",
    "Work duration in minutes",
    String(CONFIG.defaultWorkMinutes),
  )
  .option(
    "-b, --break <number>",
    "Break duration in minutes",
    String(CONFIG.defaultBreakMinutes),
  )
  .action(async (task: string, options: { minutes: string; break: string }) => {
    await pomodoroCommand({
      task,
      workMinutes: parseInt(options.minutes),
      breakMinutes: parseInt(options.break),
    });
  });

program.parse();
