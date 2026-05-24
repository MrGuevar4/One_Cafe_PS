# ☕ ONE Cafe & Restaurant — Point of Sale (POS) & Print Routing Server

<div align="center">
  <p align="center">
    <img src="https://img.shields.io/badge/React-19.2.0-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/TypeScript-5.8.3-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Bun-Runtime-f9f1e7?style=for-the-badge&logo=bun&logoColor=black" alt="Bun Runtime" />
    <img src="https://img.shields.io/badge/Node.js-Companion-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  </p>
</div>

An ultra-modern, high-performance, and responsive cashier Point-of-Sale (POS) application and companion Print Routing Server designed specifically for **ONE Cafe & Restaurant** located inside **Ranya Mall** (ناو ڕانیە مۆڵ) in Ranya, Kurdistan, Iraq.

The entire application is localized into **Kurdish Sorani (Central Kurdish)** as the primary and default language, with a native **Right-to-Left (RTL)** layout flow and an enterprise-grade print routing companion server.

---

## ✨ Features

* 🖥️ **Interactive Cashier Terminal**: Fast item selection, real-time quantity modifiers, custom tax input, and dynamic totals formatted in Iraqi Dinar (`دینار`).
* 🌍 **Global RTL & Kurdish Localization**: Fully localized into Kurdish Sorani (Central Kurdish). All layouts use logical utilities (`start-`, `end-`, `ms-`, `pe-`, etc.) to flow right-to-left.
* 🖨️ **Granular Print Routing Server**: Dedicated local companion server (`print-server/`) that automatically matches categories and routes orders:
  - **Kitchen Printer**: ONLY routes `Fast Food` (`خواردنی خێرا`) items.
  - **Barista Printer**: ONLY routes `Hot Drinks` (`خواردنەوەی گەرم`) & `Cold Drinks` (`خواردنەوەی سارد`).
  - **Shisha Printer**: ONLY routes `Shisha` (`نێرگەلە`) items.
  - **Cashier Printer**: Routes the full combined invoice/receipt.
* 🗂️ **Sequential Print Queue Management**: Localized sequential `AsyncQueue` per printer blocks concurrency socket conflicts on TCP port 9100. iPads can submit prints concurrently with zero dropped packets.
* 🛡️ **Fault Tolerance & Cashier UI Alerts**: Printer offline, timeout, or paper-out warnings are caught cleanly inside their queues. Warnings (e.g. `"چاپکەری چێشتخانە کار ناکات"`) propagate back to the Cashier UI as toast notifications without crashing the server.
* 🧾 **High-Visibility Thermal Typography**: Table labels (e.g., `مێز: 5`), order numbers, and quantities (`- 3x -`) are formatted in bold, double-height/width quad area font. Prep tickets trigger beeps (`beep()`) and auto-cuts (`cut()`).
* ⏸️ **Hold & Resume Queue**: Park incomplete orders temporarily to serve next-in-line customers, and resume them instantly with zero data loss.
* ⚙️ **Dynamic Menu CRUD**: Live menu editing interface allowing administrators to add new items, modify existing ones, or delete items.

---

## 🛠️ Tech Stack & Architecture

* **Frontend Framework**: [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) — Full-stack React framework with SSR and file-based routing.
* **Styling**: [Tailwind CSS v4.0](https://tailwindcss.com/) — Next-generation engine utilizing utility classes and modern OKLCH CSS variables.
* **State Management**: Reactive custom LocalStorage Hook system with cross-component reactivity events.
* **Companion Server**: Node.js/TypeScript Express server utilizing `node-thermal-printer` for ESC/POS hardware control.
* **Runtime & Bundler**: [Bun](https://bun.sh/) & [Vite](https://vite.dev/).

---

## 📂 Directory Structure

```text
one-cafe-pos/
├── print-server/           # Companion ESC/POS print server
│   ├── src/
│   │   ├── config.ts       # Typechecked configuration loader
│   │   ├── queue.ts        # FIFO sequential AsyncQueue service
│   │   ├── printer.ts      # ESC/POS layout formatting (Beep, Cut, Quad Typography)
│   │   ├── router.ts       # Category-to-printer station routing rules
│   │   └── index.ts        # Express REST API endpoints
│   ├── config.json         # Local printer TCP host/port settings
│   └── package.json        # Print server dependencies and compiler scripts
├── src/                    # POS UI frontend source
│   ├── components/
│   │   ├── ui/             # Radix UI and Sonner styled primitives
│   │   ├── AppNav.tsx      # Main application navigation header
│   │   └── Receipt.tsx     # Custom 80mm thermal receipt preview component
│   ├── hooks/
│   │   ├── use-keyboard-shortcuts.ts
│   │   └── use-print-server-status.ts # Communication hook with the print server
│   ├── lib/
│   │   ├── pos-store.ts    # Custom LocalStorage reactive hook and store logic
│   │   └── utils.ts
│   ├── routes/             # TanStack Router file-based routes
│   │   ├── __root.tsx      # Root application layout with mounted Toaster
│   │   ├── index.tsx       # Main POS cashier workspace page
│   │   ├── cashier.tsx     # Session settlement & receipt print management
│   │   ├── ledger.tsx      # Financial sheet & petty cash logs
│   │   ├── menu.tsx        # Menu management page (CRUD)
│   │   └── dashboard.tsx   # Sales statistics dashboard
│   ├── styles.css          # Tailwind CSS styles and custom print media queries
├── package.json            # Frontend dependencies and scripts config
├── tsconfig.json           # TypeScript configuration
└── wrangler.jsonc          # Cloudflare Pages wrangler setup
```

---

## ⚡ Quick Start

### Prerequisites
Make sure you have [Bun](https://bun.sh/) installed on your machine.

### Installation
Clone the repository and install the dependencies:

```bash
# Clone the repository
git clone https://github.com/MrGuevar4/One_Cafe_PS.git
cd One_Cafe_PS

# Install frontend dependencies
bun install

# Install print server dependencies
cd print-server
bun install
cd ..
```

### Running Locally

1. **Launch the POS Frontend**:
   ```bash
   bun run dev
   ```
   Open `http://localhost:3000` in your browser.

2. **Launch the Companion Print Server**:
   ```bash
   cd print-server
   bun run dev
   ```
   The print server runs on `http://127.0.0.1:3001`.

---

## 🔒 Security & Best Practices

1. **Local Address Binding**: The print server binds explicitly to localhost (`127.0.0.1`), ensuring it is not exposed to other machines in the public network unless configured.
2. **CORS Request Validation**: Express CORS middleware validates incoming requests and restricts them to local development/production origins (`localhost` and `127.0.0.1`), preventing cross-site scripting/execution attacks from malicious websites.
3. **Environment Isolation**: Sensitive configuration parameters are stored in `.env` files which are fully blocked from git tracking by the root `.gitignore`.
4. **Resiliency Protection**: Try-catch guards isolate socket write failures on TCP printers, protecting the server loop from crashes on timeout or connection refusals.

---

## 📄 License
This project is private and proprietary to **ONE Cafe & Restaurant**.
