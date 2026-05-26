const path = require("path");

module.exports = {
  apps: [
    {
      name: "one-cafe-pos",
      script: path.join(__dirname, "node_modules", "vinxi", "bin", "cli.mjs"),
      args: "start",
      cwd: __dirname,
      interpreter: "bun",
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0"
      }
    },
    {
      name: "one-cafe-print-server",
      script: path.join(__dirname, "print-server", "src", "index.ts"),
      cwd: path.join(__dirname, "print-server"),
      interpreter: "bun",
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
