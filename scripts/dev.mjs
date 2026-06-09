import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const venvPython =
  process.platform === "win32"
    ? path.resolve(".venv/Scripts/python.exe")
    : path.resolve(".venv/bin/python");

const processes = [
  {
    name: "api",
    command: npmCommand,
    args: ["run", "dev"],
    cwd: "backend",
  },
  {
    name: "ai",
    command: venvPython,
    args: ["-m", "uvicorn", "app.orchestration.main:app", "--port", "8000", "--reload"],
    cwd: "ai-service",
  },
  {
    name: "web",
    command: npmCommand,
    args: ["run", "dev:frontend"],
    cwd: process.cwd(),
  },
];

const running = new Set();
let shuttingDown = false;

function stopAll(signal = "SIGTERM") {
  shuttingDown = true;
  for (const child of running) {
    child.kill(signal);
  }
}

for (const proc of processes) {
  const child = spawn(proc.command, proc.args, {
    cwd: proc.cwd,
    env: { ...process.env, FORCE_COLOR: "1" },
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  running.add(child);

  child.on("exit", (code, signal) => {
    running.delete(child);
    if (!shuttingDown) {
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      console.error(`[${proc.name}] exited with ${reason}; stopping dev servers.`);
      stopAll();
      process.exit(code ?? 1);
    }
  });
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
