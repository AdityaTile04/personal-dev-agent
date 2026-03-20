import { askGemini } from "./gemini";
import {
  printPanel,
  printMarkdown,
  printMuted,
  printSuccess,
  printError,
  createSpinner,
  prompt,
  confirm,
} from "./renderer";
import {
  getPendingTasks,
  addTask,
  completeTask,
  getTodaysCompleted,
  logDayEntry,
  getRecentLogs,
} from "./storage";
import type { Task } from "./types";

const SYSTEM_PROMPT = `You are a focused, no-BS productivity coach in a developer's terminal.
Be direct, energetic, and specific. Use markdown. Keep it scannable.`;

export async function morningCommand(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? "🌅 Good morning"
      : hour < 17
        ? "☀️  Good afternoon"
        : "🌆 Good evening";

  printPanel(
    greeting,
    now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  );

  // Show pending tasks
  const pending = await getPendingTasks();
  if (pending.length > 0) {
    console.log("\n📋 Pending tasks:\n");
    pending.forEach((t) => {
      const badge =
        t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢";
      console.log(`  ${badge} [${t.id}] ${t.title}`);
    });
  }

  console.log("\nAdd today's tasks (press Enter with no input when done):");
  while (true) {
    const title = await prompt("+ Task:");
    if (!title.trim()) break;
    await addTask(title.trim());
    printSuccess(`Added: ${title.trim()}`);
  }

  const allPending = await getPendingTasks();
  const recentLogs = await getRecentLogs(3);

  const taskList =
    allPending.length > 0
      ? allPending.map((t) => `- [${t.priority}] ${t.title}`).join("\n")
      : "No tasks yet.";

  const logContext =
    recentLogs.length > 0
      ? "\nRecent activity:\n" +
        recentLogs
          .map(
            (l) =>
              `- ${l.type} (${l.date.slice(0, 10)}): ${l.content.slice(0, 100)}...`,
          )
          .join("\n")
      : "";

  const spinner = createSpinner("Generating your briefing...");
  try {
    const briefing = await askGemini(
      `It's ${now.toDateString()} at ${now.toLocaleTimeString()}.

Task list:
${taskList}
${logContext}

Generate a sharp morning briefing:
1. One-sentence motivational opener (not cheesy)
2. Suggested priority order with brief reasoning
3. ONE anchor task to focus on first
4. Any potential blockers or dependencies
5. One tip for deep work today

Under 250 words. Be direct.`,
      { system: SYSTEM_PROMPT },
    );
    spinner.stop();
    console.log("\n🌅 Your Morning Briefing\n");
    printMarkdown(briefing);
    await logDayEntry("morning", briefing);
  } catch (err) {
    spinner.stop();
    printError(err instanceof Error ? err.message : String(err));
  }

  if (allPending.length > 0) {
    const shouldComplete = await confirm("\nMark any tasks as done?");
    if (shouldComplete) await interactiveComplete();
  }
}

export async function eveningCommand(): Promise<void> {
  printPanel("🌙 Evening Recap");

  const completed = await getTodaysCompleted();
  const pending = await getPendingTasks();

  if (completed.length > 0) {
    console.log(`\n✅ Completed today (${completed.length}):\n`);
    completed.forEach((t) => console.log(`  ✓ ${t.title}`));
  }

  if (pending.length > 0) {
    console.log(`\n⏳ Still pending (${pending.length}):\n`);
    pending.forEach((t) => console.log(`  • [${t.id}] ${t.title}`));

    const shouldComplete = await confirm("\nMark any tasks as done first?");
    if (shouldComplete) await interactiveComplete();
  }

  console.log("\n📝 Quick reflection (press Enter to skip):\n");
  const wins = await prompt("Biggest win today:");
  const blockers = await prompt("What slowed you down:");
  const tomorrow = await prompt("Top priority tomorrow:");

  const finalCompleted = await getTodaysCompleted();
  const finalPending = await getPendingTasks();

  const spinner = createSpinner("Generating your recap...");
  try {
    const recap = await askGemini(
      `Evening recap for a developer:

Completed: ${JSON.stringify(finalCompleted.map((t) => t.title))}
Still pending: ${JSON.stringify(finalPending.map((t) => t.title))}
Biggest win: ${wins || "not mentioned"}
Blockers: ${blockers || "not mentioned"}
Tomorrow's focus: ${tomorrow || "not mentioned"}

Generate a brief evening recap:
1. Acknowledge what was accomplished
2. Reframe any blockers as learnings
3. Suggest 3 prioritised tasks for tomorrow
4. One sentence to mentally close the day

Under 200 words. Warm but direct.`,
      { system: SYSTEM_PROMPT },
    );
    spinner.stop();
    console.log("\n🌙 Your Evening Recap\n");
    printMarkdown(recap);
    await logDayEntry("evening", recap);
  } catch (err) {
    spinner.stop();
    printError(err instanceof Error ? err.message : String(err));
  }
}

async function interactiveComplete(): Promise<void> {
  const pending = await getPendingTasks();
  if (pending.length === 0) {
    printMuted("No pending tasks.");
    return;
  }

  pending.forEach((t: Task) => {
    const badge =
      t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢";
    console.log(`  ${badge} [${t.id}] ${t.title}`);
  });

  const input = await prompt("Enter task IDs to mark done (comma-separated):");
  const ids = input
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));

  for (const id of ids) {
    const ok = await completeTask(id);
    ok
      ? printSuccess(`Task ${id} marked complete`)
      : printMuted(`Task ${id} not found`);
  }
}
