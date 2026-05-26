const { spawn } = require("child_process");
const path = require("path");

function startProcess(name, command, args, cwd) {
  console.log(`[CLUSTER] Starting ${name}...`);
  
  const child = spawn(command, args, {
    cwd: cwd,
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    console.warn(`[CLUSTER] ${name} exited with code ${code}. Restarting in 3 seconds...`);
    setTimeout(() => {
      startProcess(name, command, args, cwd);
    }, 3000);
  });

  child.on("error", (err) => {
    console.error(`[CLUSTER] ${name} Failed to start:`, err);
  });

  return child;
}

console.log("[CLUSTER] ONE Cafe POS Auto-Recovery Orchestrator Starting...");

const webCwd = __dirname;
const printCwd = path.join(__dirname, "print-server");

const webServer = startProcess(
  "Web Server",
  "bun",
  ["run", path.join("node_modules", "vinxi", "bin", "cli.mjs"), "start"],
  webCwd
);

const printServer = startProcess(
  "Print Server",
  "bun",
  ["run", path.join("src", "index.ts")],
  printCwd
);

const shutdown = () => {
  console.log("[CLUSTER] Shutting down cluster...");
  if (webServer && !webServer.killed) webServer.kill("SIGTERM");
  if (printServer && !printServer.killed) printServer.kill("SIGTERM");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", (err) => {
  console.error("[CLUSTER] Uncaught Exception:", err);
});
