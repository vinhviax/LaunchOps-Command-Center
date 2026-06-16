# LaunchOps Command Center

> Updated: 2026-06-16 — production runs on VNG AgentBase, image `v33`, runtime version 46, UI cache `fix-20260616f`, storage backend `cloud`, mode `remote_agents`.

LaunchOps Command Center is a **launch-risk Super Agent**. A user pastes a launch brief, and the system scores readiness as Green/Yellow/Red, runs a 5-persona Red Team review, generates an owner/deadline/priority checklist, drafts post-mortem questions, and stores lessons for future launches.

**Live demo:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

> ⚠️ **This is the author's own hackathon instance.** The endpoint, MaaS key, Memory stores, vDB, and child runtimes above are the author's **private resources and credentials — not shared and not multi-tenant**. Outsiders who want the full mode must **provision their own resources** (see [Two ways to run](#two-ways-to-run-local-demo-vs-full-agentbase)). To try it instantly without cloud, use **Local demo mode**.

## Current Status

| Component | Status |
|---|---|
| Agent runtime | `runtime-8fe6be1b-efff-4be6-8f1c-1779daabdbbf`, version 46, ACTIVE |
| Docker image | `vcr.vngcloud.vn/111480-abp111734/launchops-command-center:v33` |
| UI cache | `fix-20260616f` |
| Web/API/MCP endpoint | Public HTTPS endpoint above |
| Storage | VNG vDB/PostgreSQL via `LAUNCHOPS_STORAGE_BACKEND=cloud` |
| Runtime mode | `remote_agents`: the orchestrator calls 4 separate analysis child runtimes |
| Memory | AgentBase Memory `launchops-memory` + separate knowledge stores per analysis agent |
| RAG | Production uses Memory semantic search; Platform RAG Engine `launchops-rag` is prepared |
| Governance | App guardrail ON, app rate limit ON, platform Guardrail/Rate Limit created |
| MCP | Gateway `launchops-server`, target `launchops_server_mcp`, tools `lcc`, `lcc_docs` + workspace CRUD |

## Architecture

The app runs in **one Python Docker image**. The backend uses `ThreadingHTTPServer` with no web framework. The UI is HTML/CSS/vanilla JS with no build step.

```text
User Browser / Reviewer
        |
        v
AgentBase Runtime HTTPS endpoint
        |
        +-- GET  /                  -> Pro/Friendly Web UI
        +-- POST /api/analyze       -> full LaunchOps analysis
        +-- POST /api/assistant     -> chatbot
        +-- POST /api/launches/...  -> launch CRUD + saved analysis
        +-- POST /mcp               -> MCP JSON-RPC
        +-- GET/DELETE /mcp         -> 405 by spec
        |
        +-- VNG MaaS LLM models
        +-- VNG vDB/PostgreSQL
        +-- 4 child AgentBase runtimes
        +-- AgentBase Memory stores
        +-- AgentBase MCP Gateway
```

Production currently runs as a **remote multi-agent system**: the orchestrator runtime receives Web/API requests, calls 4 independent child runtimes through `POST /invocations` (`readiness`, `redteam`, `checklist`, `postmortem`), then adds Memory insight and an executive summary. Each analysis child has its own runtime, model, knowledge memory store, and semantic self-recall step. If a remote child fails, the orchestrator falls back per agent instead of failing the whole flow.

## Multi-Agent Pipeline

The full `/api/analyze` path runs real LLM agents with separate roles and trace entries:

| Agent | Role | Current model |
|---|---|---|
| Readiness | Green/Yellow/Red readiness explanation | `deepseek/deepseek-v4-pro` |
| Red Team | 5-persona critique | `minimax/minimax-m2.5` |
| Checklist | Owner/deadline action plan | `qwen/qwen3.7-plus` |
| Post-mortem | Post-launch questions/report blocks | `google/gemma-4-31b-it` |
| Memory | Distills recalled lessons into an insight | `qwen/qwen3.7-plus` |
| Orchestrator | Executive go/no-go summary | `qwen/qwen3.7-plus` |

The assistant chatbot is a separate LLM path using `deepseek/deepseek-v4-flash`.

The final readiness score is recomputed by a deterministic rubric so the model cannot freestyle the score. LLMs explain, challenge, and summarize. If a model fails, times out, or returns an invalid schema, that agent falls back to local rules and records the reason in `agentsTrace`.

The production trace now shows `orchestration.mode=remote_agents`, 4 `remote_runtime` entries, and `ragSources.storeId` on each child trace to prove that each analysis agent recalls from its own store.

## RAG, Memory, and Cloud DB

- Per-agent knowledge stores: each analysis agent has its own RAG/self-recall store, so readiness, red team, checklist, and post-mortem context do not get mixed.
- `launchops-memory`: memory store for lessons, post-result context, and actor/session memory.
- `launchops-rag`: Platform RAG Engine is prepared, but production currently uses Memory semantic search because the RAG module's Knowledge base/Tool attachment is not ready for this flow.
- VNG vDB/PostgreSQL stores launches, products, templates, analysis history, and postmortems. Local JSON/SQLite remains as fallback/dev mode.

Fast DB rollback: set `LAUNCHOPS_STORAGE_BACKEND=local`. Fast Memory rollback: set `LAUNCHOPS_MEMORY_ENABLED=false`.

## Guardrail and Rate Limit

LaunchOps has two protection layers:

- **App-level guardrail:** rejects private keys, credentials, and payment secrets; masks email/phone before calling LLMs or writing memory.
- **App-level rate limit:** protects the expensive analysis path; production is set to 50 requests/minute and 1000 requests/day. MCP fast path is exempt.
- **Platform Guardrail/Rate Limit:** created in Protect & Govern to protect MaaS/model access.

**The Platform Policy Gateway is optional hardening, NOT a missing required item.** The two layers of guardrail + rate limit above are enforced in the app and are sufficient for demo security. The Policy Gateway only adds an allow/deny tier at the MCP Gateway; it is intentionally not enabled yet because an overly strict policy can block MCP/OpenClaw, so if enabled it should start with broad allow rules and then be tightened.

## MCP and OpenClaw

`/mcp` supports streamable HTTP JSON-RPC:

- `initialize`
- `notifications/initialized`
- `ping`
- `tools/list`
- `tools/call`

`GET /mcp` and `DELETE /mcp` return `405` by spec and should not be changed.

Main tools:

- `lcc`: deterministic fast analysis for MCP/OpenClaw to avoid gateway timeout.
- `lcc_docs`: usage guide for LaunchOps and tool-selection help for bot/chat clients.
- `analyze_launch_brief`: legacy analysis tool kept for compatibility.
- `lcc_list_launches`, `lcc_get_launch`, `lcc_create_launch`, `lcc_update_launch`, `lcc_analyze_launch`, `lcc_delete_launch`.
- `lcc_list_types`, `lcc_get_type`, `lcc_create_type`, `lcc_set_launch_template`.

OpenClaw can connect through `npx mcp-remote <endpoint>/mcp`.

### Channel skill for self-hosted OpenClaw/Zalo/Telegram

If you run LaunchOps on your own server, you do not need AgentBase Gateway just to test the tools. The backend exposes a channel skill for OpenClaw/Zalo/Telegram/Discord:

- `GET /api/channel-skill` or `GET /openclaw/skill`: JSON manifest with the system prompt, MCP endpoint, direct tool-call endpoint, tool catalog, and operating rules.
- `GET /openclaw/system-prompt.txt`: system prompt you can paste into OpenClaw or a channel bot.
- `GET /openclaw/mcp-remote.json`: `npx mcp-remote <base>/mcp` config for OpenClaw.
- `GET /discord/skill`, `GET /discord/system-prompt.txt`, `GET /discord/mcp-remote.json`: Discord-specific aliases for self-hosted Discord bots, returning the same channel skill package.
- `POST /tools/call`: simple HTTP adapter for bots that cannot speak MCP, with body `{ "name": "lcc_docs", "arguments": {} }`.

Local example:

```bash
curl http://127.0.0.1:8788/openclaw/skill
curl http://127.0.0.1:8788/openclaw/system-prompt.txt
```

The production AgentBase/OpenClaw setup can still use MCP Gateway/IAM. Self-host mode only needs your bot to point at `/mcp` or `/tools/call`.

## Web UI

- **Friendly mode:** default reviewer experience with guided flow and step visualization.
- **Pro mode:** full operations dashboard with readiness, Red Team, checklist, post-mortem, RAG insight, and trace.
- **Admin log:** open with `?role=admin` to inspect client events and server trace per launch.
- **VI/EN:** UI is bilingual; LLM output follows the brief language.
- **Responsive:** mobile overflow is fixed while desktop UI/UX remains unchanged.

## Two ways to run: Local demo vs Full AgentBase

LaunchOps runs in two modes. **Neither** needs the author's account or keys.

### 1. Local demo mode (runs instantly, no cloud)

No MaaS key, no cloud, no `.env`. Uses local SQLite/JSON + the bundled Golden Spin sample data, with scoring from the local deterministic rubric. Ideal for judges/outsiders to try the full flow right away.

```bash
LAUNCHOPS_LLM_ENABLED=false PORT=8788 python server/app.py
# open http://127.0.0.1:8788/
```

In this mode, readiness/Red Team/checklist/post-mortem are produced by local rules (no LLM calls); MCP `lcc` stays deterministic. Enough to walk through the Golden Spin demo below.

### 2. Full AgentBase mode (real multi-agent + LLM)

To get the 6 real LLM agents, RAG, Cloud DB, and remote multi-agent, an outsider **must provision their own resources** and put them in their own `.env` (the author's resources cannot be used):

- **Your own VNG MaaS API key** (`LAUNCHOPS_AGENTBASE_BASE_URL` + key) — required to call models.
- **Your own AgentBase Memory store(s)** for lessons + knowledge/RAG (`LAUNCHOPS_MEMORY_ID`, `LAUNCHOPS_KNOWLEDGE_MEMORY_ID`); seed with `server/seed_knowledge.py`.
- **Your own VNG vDB/PostgreSQL** for launch/template/history (`LAUNCHOPS_DB_URL`, `LAUNCHOPS_STORAGE_BACKEND=cloud`); migrate with `server/migrate_to_cloud_db.py`.
- **Your own 4 child AgentBase runtimes** (readiness/redteam/checklist/postmortem) if you want remote multi-agent (`LAUNCHOPS_USE_REMOTE_AGENTS=true` + 4 URLs + `LAUNCHOPS_AGENT_INVOCATION_TOKEN`). Skip this and the app runs monolithic in one runtime, still with all 6 agents.
- **Your own AgentBase MCP Gateway/IAM** if you want to expose MCP through an authenticated gateway.
- **Your own `.env`** with all of the above (see [Important Env Vars](#important-env-vars)). The author's `.env` is not in the repo.

```bash
# Full mode: needs your own provisioned .env as above
PORT=8788 python server/app.py
```

If you have not provisioned everything, the app **falls back safely**: no DB → `LAUNCHOPS_STORAGE_BACKEND=local`; no Memory → `LAUNCHOPS_MEMORY_ENABLED=false`; no child runtimes → the orchestrator runs monolithic; no MaaS key → each agent uses local rules. So a clone still runs without any cloud infrastructure.

## Demo flow for judges (Golden Spin)

The sample data tells the **Golden Spin** spin-reward event story to walk the full launch lifecycle:

1. **Risky brief** — pick `Golden Spin Weekend Risk` (or a Risk draft) → readiness **Yellow/Red**, low score, with a 5-persona Red Team + a fix-it checklist.
2. **Learn from retro** — `Golden Spin ... Retro` holds lessons saved after a prior launch; those lessons are recalled to ground the next analysis.
3. **Ready brief** — `Golden Spin Weekend v2 Ready` applied the lessons → readiness **Green 12/12**; at full score there are no open risks/Red Team, and new risks are only recorded under post-launch results to become the next lesson.
4. **Multi-agent evidence** — open the trace tab / runtime console to see `orchestration.mode=remote_agents`, 4 `remote_runtime` children, and readiness/redteam/checklist/postmortem running independently.

Click **Load Sample Brief** or **Demo mode** to load this scenario quickly.

## Important Env Vars

```text
LAUNCHOPS_AGENTBASE_BASE_URL=https://...
LAUNCHOPS_AGENTBASE_API_KEY=...
LAUNCHOPS_MODEL_READINESS=deepseek/deepseek-v4-pro
LAUNCHOPS_MODEL_REDTEAM=minimax/minimax-m2.5
LAUNCHOPS_MODEL_CHECKLIST=qwen/qwen3.7-plus
LAUNCHOPS_MODEL_POSTMORTEM=google/gemma-4-31b-it
LAUNCHOPS_MODEL_ASSISTANT=deepseek/deepseek-v4-flash

LAUNCHOPS_STORAGE_BACKEND=cloud
LAUNCHOPS_DB_URL=postgresql://USER:PASSWORD@RW_ENDPOINT:5432/DBNAME?sslmode=disable

LAUNCHOPS_MEMORY_ENABLED=true
LAUNCHOPS_MEMORY_ID=...
LAUNCHOPS_MEMORY_STRATEGY_ID=...
LAUNCHOPS_KNOWLEDGE_MEMORY_ID=...
LAUNCHOPS_RAG_ENABLED=true

LAUNCHOPS_USE_REMOTE_AGENTS=true
LAUNCHOPS_READINESS_URL=https://...
LAUNCHOPS_REDTEAM_URL=https://...
LAUNCHOPS_CHECKLIST_URL=https://...
LAUNCHOPS_POSTMORTEM_URL=https://...
LAUNCHOPS_AGENT_INVOCATION_TOKEN=...

LAUNCHOPS_GUARDRAIL_ENABLED=true
LAUNCHOPS_RATELIMIT_ENABLED=true
LAUNCHOPS_RATELIMIT_ANALYZE_PER_MIN=50
LAUNCHOPS_RATELIMIT_ANALYZE_PER_DAY=1000
```

Never commit real credentials.

## Repo Layout

```text
index.html                 # Web UI markup
app.js                     # Pro UI, launch CRUD, analyze, run log
friendly-ui.js             # Friendly mode
i18n-clean.js              # VI/EN translations
styles.css                 # Main UI styles
friendly.css               # Friendly-specific styles
config.js                  # Same-origin API config
server/app.py              # Web server + API + MCP + agent pipeline
server/db.py               # Local/cloud storage layer
server/test_app.py         # stdlib unit tests
server/migrate_to_cloud_db.py
server/seed_knowledge.py
data/                      # sample/rubric data
prompts/                   # prompt assets
Dockerfile
README.md
```

## Security

- Do not commit `.env`, `.greennode.json`, API keys, real DB URLs, logs, or database files.
- Production resources + credentials (endpoint, MaaS key, Memory, vDB, child runtimes) are the author's own and are **not shared**; anyone cloning provisions their own.
- The public endpoint is intentionally open for the hackathon demo.
- The official MCP path goes through AgentBase MCP Gateway/IAM.
- Guardrail checks secrets/PII before LLM calls or memory writes.
