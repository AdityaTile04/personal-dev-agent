import type { Task, DayLog, Priority } from "./types";
import { CONFIG } from "./config";
import { join } from "path";
import { mkdirSync } from "fs";

const TASKS_FILE = join(CONFIG.dataDir, "tasks.json");
const LOG_FILE = join(CONFIG.dataDir, "daily_log.json");

function ensureDataDir(): void {
  mkdirSync(CONFIG.dataDir, { recursive: true });
}

export async function loadTasks(): Promise<Task[]> {
  ensureDataDir();
  const file = Bun.file(TASKS_FILE);
  if (!(await file.exists())) return [];
  return file.json<Task[]>();
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  ensureDataDir();
  await Bun.write(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

export async function addTask(
  title: string,
  priority: Priority = "medium",
  tags: string[] = [],
): Promise<Task> {
  const tasks = await loadTasks();
  const task: Task = {
    id: tasks.length + 1,
    title,
    priority,
    tags,
    done: false,
    created: new Date().toISOString(),
    completedAt: null,
  };
  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

export async function completeTask(id: number): Promise<boolean> {
  const tasks = await loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;
  task.done = true;
  task.completedAt = new Date().toISOString();
  await saveTasks(tasks);
  return true;
}

export async function getPendingTasks(): Promise<Task[]> {
  return (await loadTasks()).filter((t) => !t.done);
}

export async function getTodaysCompleted(): Promise<Task[]> {
  const today = new Date().toISOString().slice(0, 10);
  return (await loadTasks()).filter(
    (t) => t.done && t.completedAt?.startsWith(today),
  );
}

export async function loadLogs(): Promise<DayLog[]> {
  ensureDataDir();
  const file = Bun.file(LOG_FILE);
  if (!(await file.exists())) return [];
  return file.json<DayLog[]>();
}

export async function logDayEntry(
  type: "morning" | "evening",
  content: string,
): Promise<void> {
  const logs = await loadLogs();
  logs.push({ type, date: new Date().toISOString(), content });
  ensureDataDir();
  await Bun.write(LOG_FILE, JSON.stringify(logs, null, 2));
}

export async function getRecentLogs(limit = 5): Promise<DayLog[]> {
  const logs = await loadLogs();
  return logs.slice(-limit);
}
