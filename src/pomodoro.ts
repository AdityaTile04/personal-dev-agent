import type { PomodoroOptions } from "./types";
import { printPanel, printSuccess, confirm } from "./renderer";
import chalk from "chalk";
import { spawnSync } from "child_process";

export async function pomodoroCommand(options: PomodoroOptions): Promise<void> {
  const { task, workMinutes, breakMinutes } = options;

  printPanel(
    "🍅 Pomodoro",
    `${task}  ·  ${workMinutes}min work / ${breakMinutes}min break`,
  );

  let session = 0;

  while (true) {
    session++;
    console.log(`\n${chalk.bold(`Session #${session}`)} — ${chalk.cyan(task)}`);
    console.log(chalk.dim("Press Ctrl+C to stop\n"));

    await runTimer("🍅 Focus ", workMinutes, "red");
    notify("✅ Work session done! Take a break.");
    printSuccess(`Work session #${session} complete!`);

    console.log(`\n${chalk.green.bold(`Break time! (${breakMinutes} min)`)}\n`);
    await runTimer("☕ Break ", breakMinutes, "green");
    notify("⏰ Break over. Ready for the next session?");

    const next = await confirm("\nStart another Pomodoro?");
    if (!next) break;
  }

  printPanel(
    "🍅 Session complete!",
    `${session} Pomodoro(s)  ·  ~${session * workMinutes} minutes of focus  ·  ${task}`,
  );
}

function runTimer(
  label: string,
  minutes: number,
  color: "red" | "green",
): Promise<void> {
  return new Promise((resolve) => {
    const total = minutes * 60;
    let elapsed = 0;
    const barWidth = 35;

    const tick = setInterval(() => {
      elapsed++;
      const pct = elapsed / total;
      const filled = Math.round(pct * barWidth);
      const empty = barWidth - filled;
      const bar = "█".repeat(filled) + chalk.dim("░".repeat(empty));
      const colorFn = color === "red" ? chalk.red : chalk.green;
      const timeLeft = formatTime(total - elapsed);

      process.stdout.write(
        `\r${colorFn(label)} ${bar} ${chalk.bold(Math.round(pct * 100))}% ${chalk.dim(timeLeft)}   `,
      );

      if (elapsed >= total) {
        clearInterval(tick);
        process.stdout.write("\n");
        resolve();
      }
    }, 1000);
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function notify(message: string): void {
  try {
    // Linux
    spawnSync("notify-send", ["dev-agent", message], { timeout: 2000 });
  } catch {
    try {
      // macOS
      spawnSync(
        "osascript",
        ["-e", `display notification "${message}" with title "dev-agent"`],
        { timeout: 2000 },
      );
    } catch {}
  }
}
