# ☕ ONE Cafe & Restaurant — Point of Sale (POS)

<div align="center">
  <p align="center">
    <img src="https://img.shields.io/badge/React-19.2.0-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/TanStack%20Start-Beta-ff3e00?style=for-the-badge&logo=react&logoColor=white" alt="TanStack Start" />
    <img src="https://img.shields.io/badge/Bun-Runtime-f9f1e7?style=for-the-badge&logo=bun&logoColor=black" alt="Bun Runtime" />
    <img src="https://img.shields.io/badge/Cloudflare-Pages-f38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Pages" />
  </p>
</div>

An ultra-modern, high-performance, and responsive cashier Point-of-Sale (POS) application designed specifically for **ONE Cafe & Restaurant** located inside **Ranya Mall** (ڕانیە - ناو ڕانیە مۆڵ) in Ranya, Kurdistan, Iraq.

Built using **React 19**, **Tailwind CSS v4**, and **TanStack Start**, this system provides real-time sales metrics, dynamic menu customization, and print-ready thermal receipts configured for 80mm POS receipt printers.

---

## ✨ Features

* 🖥️ **Interactive Cashier Terminal**: Fast item selection, real-time quantity modifiers, custom tax input, and dynamic totals (formatted in Iraqi Dinar - **IQD**).
* 🏷️ **Categorized POS Grid**: Quick-access filters for *Fast Food*, *Hot Drinks*, *Cold Drinks*, and *Shisha* items, detailed with personalized icons and background colors.
* ⏸️ **Hold & Resume Queue**: Park incomplete orders temporarily to serve next-in-line customers, and resume them instantly with zero data loss.
* 🖨️ **Automated Thermal Printing**: Custom CSS print styles designed for 80mm POS receipt printers, formatting Kurdish location info, order numbers, tables, and itemized summaries automatically.
* 📊 **Reactive Sales Dashboard**: Live calculations of daily revenue, total order volume, and average ticket sizes powered by synchronized reactive local storage.
* ⚙️ **Dynamic Menu CRUD**: Live menu editing interface allowing administrators to add new items, modify existing ones (icons, colors, and prices in IQD), or delete items.

---

## 🛠️ Tech Stack & Architecture

* **Framework**: [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) — Full-stack React framework with SSR and file-based routing.
* **Styling**: [Tailwind CSS v4.0](https://tailwindcss.com/) — Next-generation engine utilizing utility classes and modern OKLCH CSS variables.
* **State Management**: Reactive custom LocalStorage Hook system with cross-component reactivity events.
* **Icons**: [Lucide React](https://lucide.dev/) for clean vector interfaces.
* **Runtime & Bundler**: [Bun](https://bun.sh/) & [Vite](https://vite.dev/).
* **Deployment Platform**: [Cloudflare Pages](https://pages.cloudflare.com/) via `@cloudflare/vite-plugin`.

---

## 📂 Directory Structure

```text
one-cafe-pos/
├── src/
│   ├── components/
│   │   ├── ui/             # Radix UI styled primitives
│   │   ├── AppNav.tsx      # Main application navigation header
│   │   └── Receipt.tsx     # Custom 80mm thermal receipt component
│   ├── hooks/              # Reusable React hooks
│   ├── lib/
│   │   ├── pos-store.ts    # Custom LocalStorage reactive hook and store logic
│   │   └── utils.ts        # Helper utility functions (cn)
│   ├── routes/             # TanStack Router file-based routes
│   │   ├── __root.tsx      # Root application layout and metadata config
│   │   ├── index.tsx       # Main POS cashier workspace page
│   │   ├── menu.tsx        # Menu management page (CRUD)
│   │   └── dashboard.tsx   # Sales statistics dashboard
│   ├── server.ts           # Cloudflare Pages / Wrangler entrypoint
│   ├── start.ts            # TanStack Start instance configuration
│   └── styles.css          # Tailwind CSS styles and custom print media queries
├── package.json            # Dependencies and scripts config
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Lovable & TanStack configuration
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

# Install dependencies
bun install
```

### Running Locally
To launch the development server with hot-module reloading:

```bash
bun run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Production Build
To build the application for production deployment:

```bash
bun run build
```

---

## 🧾 Thermal Printer Setup (80mm)

This application includes a tailored print stylesheet designed for **80mm thermal receipt printers** (like Epson, Xprinter, etc.). 

When the cashier clicks **Pay & Print**:
1. The POS creates a transaction record and increments the order count.
2. The print dialogue is triggered via `window.print()`.
3. The custom CSS automatically hides the main application layout (`print:hidden`) and prints only the receipt layout inside `Receipt.tsx` styled in monospaced Courier typography with correct margins.

---

## 🔒 Security & Best Practices

1. **Environment Variables**: Sensitive production variables are excluded from GitHub tracking using `.gitignore` (which blocks all `.env` files and `.dev.vars`).
2. **Client-Side Cache Isolation**: Store operations use prefix keys `one_cafe_*` to prevent collisions with other localStorage data.
3. **Robust Error Handling**: Customized error-capturing middlewares prevent exposure of system stack traces in production.

---

## 📄 License
This project is private and proprietary to **ONE Cafe & Restaurant**.
