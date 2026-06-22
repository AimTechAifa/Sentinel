# Sentinel — AI-Powered Release Command Center

Flagship demo prototype for stakeholder screen recordings. Static dummy data with real LLM-powered agent responses.

## Setup

1. Install dependencies (already done if cloned with node_modules):
   ```bash
   npm install
   ```

2. Copy environment file and add your API key:
   ```bash
   cp .env.local.example .env.local
   ```
   Add at least one key to `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   # optional fallback:
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) — sign in with any credentials to reach the dashboard.

## Pages

| Route | Description |
|---|---|
| `/login` | Fake login → dashboard |
| `/dashboard` | Executive overview + AI daily summary |
| `/executive` | C-level portfolio dashboard, risk heatmap, ML forecasts |
| `/releases` | Full release list |
| `/releases/[id]` | Release command center (core screen) |
| `/releases/[id]/dependencies` | React Flow dependency map |
| `/knowledge-graph` | Org-wide knowledge graph (releases, services, people, CRs) |
| `/calendar` | Release calendar |
| `/history` | Global audit trail |
| `/connectors` | 59 enterprise integrations (DevOps, ITSM, security, observability) |
| `/agents` | Agent control room — 13 AI agents, Magic UI-style fleet dashboard |
| `/insights` | Org-wide AI risk, trends, and predictive ML |
| `/settings` | Team/role settings |

## Demo anchors

- **v2.14.0** — overdue Security approval, high file-change count
- **v2.13.5** — failed build
- **v2.15.0** — large release, build running

## Tech stack

Next.js 14 · TypeScript · Tailwind CSS · recharts · reactflow · OpenAI / Anthropic
