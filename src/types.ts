export interface GeminiPart {
  text: string;
}

export interface GeminiMessage {
  role: "user" | "model";
  parts: [GeminiPart];
}

export interface GeminiRequestBody {
  contents: GeminiMessage[];
  systemInstruction?: { parts: [GeminiPart] };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
  };
}

export interface AskGeminiOptions {
  system?: string;
  history?: GeminiMessage[];
  temperature?: number;
  maxTokens?: number;
}

export type Priority = "high" | "medium" | "low";

export interface Task {
  id: number;
  title: string;
  priority: Priority;
  tags: string[];
  done: boolean;
  created: string;
  completedAt: string | null;
}

export interface DayLog {
  type: "morning" | "evening";
  date: string;
  content: string;
}

export interface ChatSession {
  history: GeminiMessage[];
  createdAt: string;
}

export interface PomodoroOptions {
  task: string;
  workMinutes: number;
  breakMinutes: number;
}

export interface PomodoroSession {
  task: string;
  startedAt: string;
  completedSessions: number;
  totalFocusMinutes: number;
}

export interface StorageData {
  tasks: Task[];
  logs: DayLog[];
}

export interface AgentConfig {
  geminiModel: string;
  dataDir: string;
  maxHistoryTurns: number;
  defaultWorkMinutes: number;
  defaultBreakMinutes: number;
}
