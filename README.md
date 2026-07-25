# Finlight — AI-Powered Fintech Dashboard

Built for the Banfico "AI-Powered Fintech Experience" hackathon. Aggregates accounts, balances,
and transactions from the Banfico mock bank sandbox (UK Open Banking / OBIE AISP v4.0), surfaces
spending insights, and includes a Claude-powered conversational assistant that can execute
transfers on the user's behalf.

## Architecture

```
client/   React 19 + Vite + Tailwind v4 + react-router-dom + recharts
server/   Express (ESM) proxying:
            - Banfico OIDC token endpoint (login/refresh)
            - Banfico mock bank OBIE AISP v4.0 API (accounts/balances/transactions)
            - Anthropic Claude API (insights narration + assistant tool-use)
```

The server never lets the browser talk to the bank sandbox or Anthropic directly — it holds the
bank client id/secret and the Anthropic API key, and the browser only ever calls `/api/*` on the
Express server (proxied by Vite in dev). The user's bearer token from login is stored client-side
and forwarded per-request; it is never persisted or logged server-side, and is stripped from any
error payload before it reaches the client or the LLM (see `scrubError` in
`server/src/lib/bankClient.js`).

Key modules:
- `server/src/lib/bankClient.js` — shared axios client for the bank API + error scrubbing.
- `server/src/lib/bankData.js` — fetch accounts + all their transactions in one call.
- `server/src/lib/insights.js` — pure functions: categorization, totals, category breakdown,
  monthly trend, anomaly detection, subscription detection, health heuristic.
- `server/src/routes/insights.js` — computes insights, then makes one Claude call to narrate them
  in plain English (Claude narrates precomputed numbers; it never computes them).
- `server/src/routes/assistant.js` — `/api/assistant/chat`, a Claude tool-use loop with read-only
  tools (`get_accounts`, `get_balances`, `get_transactions`, `get_insights`) and one write tool
  (`transfer_to_savings`). Any turn that calls `transfer_to_savings` pauses and returns a
  `pendingAction` to the client — nothing is executed until the user explicitly confirms in the
  chat UI.

## Setup

### 1. Server

```
cd server
npm install
cp .env.example .env   # already pre-filled with the sandbox client id/secret from Postman
```

Edit `.env` and set:
- `ANTHROPIC_API_KEY` — required for insights narration and the chat assistant.
- `ANTHROPIC_MODEL` — defaults to `claude-sonnet-4-6`.

Then:

```
npm run dev
```

Runs on `http://localhost:5050` (port 5000 is avoided — it's commonly taken by macOS AirPlay
Receiver).

### 2. Client

```
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173`, with `/api` proxied to the server (see `vite.config.js`).

### 3. Log in

Open `http://localhost:5173`, click **Log in**, and use your Banfico sandbox username/password.
Credentials are only ever sent to the server, which exchanges them for a token directly with the
bank sandbox — they are never stored.

## Features

- **Dashboard** — unified balance summary, per-account cards, recent transactions, and a proactive
  Claude-generated financial health banner that loads automatically (no user action required).
- **Insights** — category-wise spend (pie chart), income vs. expense by month (bar chart), unusual
  spending detection, recurring-subscription detection, and a health score with an AI narrative.
- **Assistant** — a floating chat widget that answers natural-language questions grounded in real
  tool calls, and can execute a savings transfer end-to-end after the user confirms in the UI.

## Deploying to a custom domain (free tier)

The server needs to run as a persistent process (the assistant's tool-use loop can take several
seconds across multiple Claude calls, which rules out short-timeout serverless functions), so the
two halves deploy separately, both on free tiers:

- **`server/`** → [Render](https://render.com) free Web Service. A `render.yaml` blueprint is
  already at the repo root — in Render, "New +" → "Blueprint" → point at this repo. It'll ask for
  the two secrets marked `sync: false` (`BANK_CLIENT_SECRET`, `ANTHROPIC_API_KEY`) — copy those
  from `server/.env`. Render assigns the service a URL like
  `https://finlight-server.onrender.com`.
- **`client/`** → [Cloudflare Pages](https://pages.cloudflare.com) free tier. Connect the repo,
  set root directory to `client`, build command `npm run build`, output directory `dist`. Then in
  the Pages project's environment variables, set `BACKEND_URL` to the Render URL from above —
  `client/functions/api/[[path]].js` uses it to reverse-proxy `/api/*` to the server, so the
  browser only ever talks to one origin and the client code needs zero changes between dev and
  production.
- **Domain (GoDaddy → your host):** in GoDaddy's DNS settings for `bankoninnovation.dev`, add the
  CNAME/A records Cloudflare Pages gives you when you attach the custom domain in its dashboard.
  Update `CORS_ORIGIN` in the Render service's env vars to match the final domain.

Render's free tier sleeps after ~15 minutes idle (first request afterward takes ~30–50s to wake);
Cloudflare Pages has no such limit.
