# ONE Cafe Companion Print Server

A standalone Node.js Express server that routes print jobs to network thermal printers. Runs locally on the POS machine. Works identically on **Linux** and **Windows**.

## Setup

```bash
cd print-server
bun install        # or: npm install
bun run dev        # development with hot reload
bun run build      # compile TypeScript
bun run start      # run compiled production build
```

## Configuration

Edit `config.json` to set your printer IPs:
```json
{
  "printers": {
    "kitchen":  { "type": "tcp", "host": "192.168.1.101", "port": 9100, "enabled": true },
    "barista":  { "type": "tcp", "host": "192.168.1.102", "port": 9100, "enabled": true },
    "shisha":   { "type": "tcp", "host": "192.168.1.103", "port": 9100, "enabled": true },
    "cashier":  { "type": "tcp", "host": "192.168.1.104", "port": 9100, "enabled": true }
  },
  "serverPort": 3001
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | Polled connectivity check for all 4 printers |
| POST | `/api/print` | Queued and routed print job endpoint |
| GET | `/api/config` | Retrieve current printer settings JSON |
| PUT | `/api/config` | Overwrite printer settings JSON |

## Print Routing Logic

- `Fast Food` (`خواردنی خێرا`) items → Kitchen Printer
- `Hot Drinks` (`خواردنەوەی گەرم`) / `Cold Drinks` (`خواردنەوەی سارد`) items → Barista Printer
- `Shisha` (`نێرگەلە`) items → Shisha Printer
- Full Combined Receipt (type: `cashier` or `full`) → Cashier Printer
