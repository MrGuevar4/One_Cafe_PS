module.exports = {
  apps: [
    {
      name: "one-cafe-pos",
      script: "node_modules/vinxi/bin/cli.mjs",
      args: "start",
      cwd: __dirname,
      interpreter: "bun",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0"
      }
    },
    {
      name: "one-cafe-print-server",
      script: "src/index.ts",
      cwd: `${__dirname}/print-server`,
      interpreter: "bun",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
