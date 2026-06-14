# LaunchOps Command Center

> Updated: 2026-06-14 — production runs on VNG AgentBase, image `v26`, runtime version 32, storage backend `cloud`.

LaunchOps Command Center is a **launch-risk Super Agent**. A user pastes a launch brief, and the system scores readiness as Green/Yellow/Red, runs a 5-persona Red Team review, generates an owner/deadline/priority checklist, drafts post-mortem questions, and stores lessons for future launches.

**Live demo:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

## Current Status

| Component | Status |
|---|---|
| Agent runtime | `runtime-8fe6be1b-efff-4be6-8f1c-1779daabdbbf`, version 32, ACTIVE |
| Docker image | `vcr.vngcloud.vn/111480-abp111734/launchops-command-center:v26` |
| Web/API/MCP endpoint | Public HTTPS endpoint above |
| Storage | VNG vDB/PostgreSQL via `LAUNCHOPS_STORAGE_BACKEND=cloud` |
| Memory | AgentBase Memory `launchops-memory` + knowledge store `launchops-knowledge` |
| RAG | Production uses Memory semantic search; Platform RAG Engine `launchops-rag` is prepared |
| Governance | App guardrail ON, app rate limit ON, platform Guardrail/Rate Limit created |
| MCP | Gateway `launchops-server`, target `launchops_server_mcp`, tools `lcc` + workspace CRUD |

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
        +-- AgentBase Memory
        +-- AgentBase MCP Gateway
```

Production currently uses a **monolith orchestrator** for demo stability. The code already supports `POST /invocations` and `LAUNCHOPS_AGENT_ROLE=orchestrator|readiness|redteam|checklist|postmortem|memory` so the same image can run as separate AgentBase runtimes later. Five child runtimes and one canary orchestrator have been created and verified, but the main production runtime stays single-runtime to reduce operational risk.

## Six-LLM-Agent Pipeline

The full `/api/analyze` path runs 6 real LLM agents with separate roles and trace entries:

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

## RAG, Memory, and Cloud DB

- `launchops-knowledge`: knowledge store for RAG, with playbooks and risk patterns by launch type and product namespace.
- `launchops-memory`: memory store for lessons, post-result context, and actor/session memory.
- `launchops-rag`: Platform RAG Engine is prepared, but production currently uses Memory semantic search because the RAG module's Knowledge base/Tool attachment is not ready for this flow.
- VNG vDB/PostgreSQL stores launches, products, templates, analysis history, and postmortems. Local JSON/SQLite remains as fallback/dev mode.

Fast DB rollback: set `LAUNCHOPS_STORAGE_BACKEND=local`. Fast Memory rollback: set `LAUNCHOPS_MEMORY_ENABLED=false`.

## Guardrail and Rate Limit

LaunchOps has two protection layers:

- **App-level guardrail:** rejects private keys, credentials, and payment secrets; masks email/phone before calling LLMs or writing memory.
- **App-level rate limit:** protects the expensive analysis path; production is set to 50 requests/minute and 1000 requests/day. MCP fast path is exempt.
- **Platform Guardrail/Rate Limit:** created in Protect & Govern to protect MaaS/model access.

Platform Policy Gateway is intentionally not enabled yet because an overly strict policy can block MCP/OpenClaw. It should be added last with broad allow rules first, then tightened.

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
- `analyze_launch_brief`: legacy analysis tool kept for compatibility.
- `lcc_list_launches`, `lcc_get_launch`, `lcc_create_launch`, `lcc_update_launch`, `lcc_analyze_launch`, `lcc_delete_launch`.
- `lcc_list_types`, `lcc_get_type`, `lcc_create_type`, `lcc_set_launch_template`.

OpenClaw can connect through `npx mcp-remote <endpoint>/mcp`.

## Web UI

- **Friendly mode:** default reviewer experience with guided flow and step visualization.
- **Pro mode:** full operations dashboard with readiness, Red Team, checklist, post-mortem, RAG insight, and trace.
- **Admin log:** open with `?role=admin` to inspect client events and server trace per launch.
- **VI/EN:** UI is bilingual; LLM output follows the brief language.
- **Responsive:** mobile overflow is fixed while desktop UI/UX remains unchanged.

## Run Locally

```bash
# Fast rule mode, no API key required
LAUNCHOPS_LLM_ENABLED=false PORT=8788 python server/app.py

# Full mode, requires MaaS/AgentBase config in .env
PORT=8788 python server/app.py
```

Open `http://127.0.0.1:8788/`.

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
- The public endpoint is intentionally open for the hackathon demo.
- The official MCP path goes through AgentBase MCP Gateway/IAM.
- Guardrail checks secrets/PII before LLM calls or memory writes.
