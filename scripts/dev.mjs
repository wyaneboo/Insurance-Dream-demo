import { spawn } from "node:child_process";
import process from "node:process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const processes = [
  {
    name: "api",
    command: npmCommand,
    args: ["run", "dev"],
    cwd: "backend",
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
    shell: false,
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
