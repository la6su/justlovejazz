export class Logger {
  private static instance: Logger;
  private logs: Array<{ level: "info" | "warn" | "error"; message: string; timestamp: number; }> = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(message: string, level: "info" | "warn" | "error" = "info"): void {
    const timestamp = Date.now();
    this.logs.push({ level, message, timestamp });
    console[level === "error" ? "error" : "log"](`[${level.toUpperCase()}] ${message}`);
  }

  public getLogs(level?: "info" | "warn" | "error"): Array<{ level: "info" | "warn" | "error"; message: string; timestamp: number; }> {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }

  public clear(): void {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
