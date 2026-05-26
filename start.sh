#!/bin/bash
# ------------------------------------------------------------------------------
# ONE Cafe & Restaurant POS startup script for Linux/macOS
# ------------------------------------------------------------------------------

echo "=========================================================="
echo "      ONE Cafe & Restaurant - Starting POS Suite"
echo "=========================================================="

# Detect package manager
if command -v bun >/dev/null 2>&1; then
  PKG_MANAGER="bun"
  INSTALL_CMD="bun install"
  BUILD_CMD="bun run build"
  # Resolve absolute path of bun and export its bin directory to PATH
  BUN_PATH=$(command -v bun)
  export PATH="$(dirname "$BUN_PATH"):$PATH"
  START_CMD="bun run concurrently -k -n \"WEB,PRINT\" -c \"cyan,magenta\" \"bun run preview\" \"bun print-server/src/index.ts\""
  echo "✔ Bun detected as the package manager (PATH updated: $(dirname "$BUN_PATH"))."
elif command -v npm >/dev/null 2>&1; then
  PKG_MANAGER="npm"
  INSTALL_CMD="npm install"
  BUILD_CMD="npm run build"
  # Run concurrently using npx, running the production preview server (vite preview)
  START_CMD="npx concurrently -k -n \"WEB,PRINT\" -c \"cyan,magenta\" \"npm run preview\" \"npm run start --prefix print-server\""
  echo "✔ Node.js/NPM detected as the package manager."
else
  echo "❌ Error: Neither Bun nor Node.js/NPM was found on this system."
  echo "Please install Bun (https://bun.sh) or Node.js (https://nodejs.org) to run this application."
  exit 1
fi

# Check and install root dependencies if missing
if [ ! -d "node_modules" ]; then
  echo "Root node_modules not found. Installing dependencies..."
  $INSTALL_CMD
fi

# Check and install print-server dependencies if missing
if [ ! -d "print-server/node_modules" ]; then
  echo "Print server node_modules not found. Installing dependencies..."
  if [ "$PKG_MANAGER" = "bun" ]; then
    cd print-server && bun install && cd ..
  else
    cd print-server && npm install && cd ..
  fi
fi

# Build production bundle
echo "Building production frontend and server bundles..."
$BUILD_CMD

# Start concurrent servers
echo "Launching main POS Web app and Print Server..."
eval $START_CMD
