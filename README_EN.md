# LaunchOps Command Center

> Updated 2026-06-17 — production runs on VNG AgentBase: image `v35`, runtime version 48, UI cache `fix-20260617p`, storage `cloud`, mode `remote_agents`.

LaunchOps Command Center is a **multi-agent command center for launch risk**. You paste a launch brief; the system scores readiness as Green/Yellow/Red against a risk rubric, runs a 5-persona Red Team, generates an owner/deadline/priority checklist, drafts post-mortem questions, and stores lessons for the next launch.

It is not a chatbot. The goal is to turn launch gatekeeping — usually run on tribal knowledge and a few people's memory — into a system with a score, a challenger, a checklist, and institutional memory you can reuse.

**Live demo:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

> ⚠️ This is the author's own **ClawAThon VNG** instance. The endpoint, MaaS key, Memory stores, vDB, and child runtimes above are the author's **private resources and credentials — not shared, not multi-tenant**. To run the full mode, provision your own resources (see [How to run](#how-to-run)). To try it instantly with no cloud, use **Local demo mode** — Python only.

## What it's for (not tied to one domain)

LCC isn't hard-wired to games or any single event type. It fits any launch that carries risk and needs a Go/No-Go call:

- Feature/SaaS releases, technical rollouts, internal infrastructure.
- Marketing campaigns, events, promotions.
- Hardware, fintech, or any "prepare → run → review" lifecycle.

Changing domain means changing the **template** (classifications, risk groups, Red Team personas, checklist), **not the code**. The "Golden Spin" sample data is just a case study for walking the full lifecycle, not a scope limit.

## How it works — a 5-step pipeline

1. **Read the brief** → detect launch type, pull the matching template + related lessons into context.
2. **Score readiness** → Green / Yellow / Red with a score, from the template's risk rubric.
3. **Red Team** → 5 personas (user, technical, CS, business, LiveOps) challenge it, each with one risk + evidence + fix.
4. **Checklist** → tasks by phase (pre / launch day / live / post-launch) with owner/deadline/status.
5. **Post-mortem & lessons** → review questions, store the real result + lessons to ground the next launch.

The full `/api/analyze` path runs 6 real LLM agents, each with its own role, model, and trace:

| Agent | Role | Model |
|---|---|---|
| Readiness | Explains Green/Yellow/Red | `deepseek/deepseek-v4-pro` |
| Red Team | 5-persona critique | `minimax/minimax-m2.5` |
| Checklist | Tasks + owner/deadline | `qwen/qwen3.7-plus` |
| Post-mortem | Post-launch questions/report | `google/gemma-4-31b-it` |
| Memory | Distills recalled lessons into an insight | `qwen/qwen3.7-plus` |
| Orchestrator | Executive go/no-go summary | `qwen/qwen3.7-plus` |

The assistant chatbot is a separate LLM path (`deepseek/deepseek-v4-flash`). MCP/Bot calls use a deterministic fast path (`lcc`) returning in < 1s to avoid gateway timeouts.

## It learns (controlled self-learning — live)

Post-launch lessons don't sit dead in a log. LCC learns on two tiers:

- **Soft learning:** stored lessons are recalled and woven into every agent's prompt on the next analysis of the same launch type, so the next brief is read through what went wrong last time.
- **Hard learning (human-approved):** from a lesson, the AI **proposes** a delta to the rubric/personas (add a risk group, change maxScore, add a persona). The proposal sits as `proposed` and **does not change the template**. A reviewer Approves/Rejects; Approve creates a **new template version** applied to later scoring.

Everything is human-in-the-loop, versioned, and auditable. Proposals are masked for secrets/PII before storage, and configuration-changing tools are Admin-only. This is a shipped feature, not a future plan.

## Why you can trust the score

The readiness score is **not** assigned by an LLM. It is recomputed by a **deterministic rubric** from brief evidence against the template's risk groups — the same brief + template always yields the same score. The LLMs only explain, challenge, and summarize.

This is a deliberate trade-off: a Go/No-Go gate must be **reproducible and auditable**, not subject to a model's mood. If an LLM picked the number, the same brief could score differently across runs — unacceptable for a launch decision. So the model does what it's good at (language, critique) while a fixed rule owns the number. When a model fails, times out, or returns an invalid schema, that agent falls back to local rules and records the reason in `agentsTrace`.

Two protective layers:

- **Guardrail:** rejects briefs containing private keys/credentials/payment secrets; masks email/phone before any LLM call or memory write.
- **Rate limit:** caps the expensive analyze path (production 50 req/min, 1000 req/day); the MCP fast path is exempt.

## Architecture

The whole app lives in **one Python Docker image** — a `ThreadingHTTPServer` backend with no web framework, and HTML/CSS/vanilla-JS UI with no build step.

```text
User / Reviewer  ──▶  AgentBase Runtime (orchestrator, image v35)
                         ├── GET  /                 → Pro/Friendly Web UI
                         ├── POST /api/analyze      → full multi-agent analysis
                         ├── POST /api/assistant    → chatbot
                         ├── POST /api/launches/... → launch CRUD + saved analysis
                         ├── POST /mcp              → MCP JSON-RPC
                         └── GET/DELETE /mcp        → 405 (streamable-http spec)
                         │
                         ├── VNG MaaS LLM models
                         ├── VNG vDB / PostgreSQL (launch, template, history)
                         ├── 4 child runtimes: readiness · redteam · checklist · postmortem
                         ├── AgentBase Memory stores (one per analysis agent)
                         └── AgentBase MCP Gateway
```

Production runs **remote multi-agent**: the orchestrator receives a request and calls 4 independent child runtimes via `POST /invocations`. Each child has its own runtime, model, **own knowledge store**, and a semantic self-recall step before returning. Memory insight + executive summary are synthesized at the orchestrator. If a child fails, the orchestrator falls back per agent instead of failing the whole flow. The production trace shows `orchestration.mode=remote_agents` plus `ragSources.storeId` on each child to prove this.

MCP also ships a **self-host channel skill** for OpenClaw/Zalo/Telegram/Discord (`/api/channel-skill`, `/openclaw/skill`, `/discord/skill`, with system-prompt and `mcp-remote.json`), so a bot can drive LaunchOps without the AgentBase Gateway.

## Where it expands

Each direction is anchored to something that already exists, not a vague promise. Shipped vs. direction is kept explicit:

| Axis | Shipped ✅ / Direction 🔜 | Anchored to |
|---|---|---|
| **Domain** | ✅ change domain = change template, not code | Template + classification/risk-group/persona catalog |
| **Organization** | ✅ partial — product selector, per-product template (Demo live, Product XYZ locked) | `lcc_select_product` + per-product template |
| **Operational data** | 🔜 ground the score with real metrics (DAU, revenue, incidents) | MCP architecture exists; data sources not yet wired into scoring |
| **MCP architecture** | ✅ MCP server + channel skill across chat/agent platforms | `/mcp` + OpenClaw/Zalo/Telegram/Discord channel skill |
| **Compounding effect** | ✅ self-learning + memory: the more it's used, the richer the rubric/lessons | Controlled self-learning + per-agent memory store |

The seed here is a launch-governance platform that improves itself over time — and the architecture for that (versioned templates, per-agent memory, a human reviewer inside the learning loop) is already in the running build.

## How to run

### 1. Local demo — runs now, no cloud, no key

Uses local SQLite/JSON + the Golden Spin sample data; readiness/Red Team/checklist/post-mortem are generated by a local deterministic rubric (no LLM). Enough to see the full flow.

```bash
# instant rule-mode, no LLM even if the machine has credentials
LAUNCHOPS_LLM_ENABLED=false LAUNCHOPS_MULTI_MODEL_ENABLED=false \
LAUNCHOPS_ORCHESTRATOR_LLM_ENABLED=false LAUNCHOPS_MEMORY_LLM_ENABLED=false \
PORT=8788 python server/app.py
# open http://127.0.0.1:8788/
```

> Those four flags disable all 6 agents. With no LLM credentials on the machine, the app falls back to rules automatically — just `PORT=8788 python server/app.py`.

### 2. Real LLM — **one API key for all agents**

Many people only have a single key. LCC needs just **one** key + one base URL + one model; all 6 agents share it:

```bash
LLM_API_KEY=your_key_here
LLM_BASE_URL=https://your-openai-compatible-endpoint/v1
LLM_MODEL=your_model_name
PORT=8788 python server/app.py
```

Every agent calls an OpenAI-compatible `/v1/chat/completions`. To give each agent its **own model/key** (advanced), set `LAUNCHOPS_MODEL_<AGENT>` and `LAUNCHOPS_<AGENT>_API_KEY`; if unset, the agent falls back to the shared key/model above — so a single key always works.

### 3. Full AgentBase — distributed multi-agent + RAG + Cloud DB

For remote multi-agent, RAG, and Cloud DB like production, provision your own resources and fill your own `.env` (see [Env](#env)): VNG MaaS key, AgentBase Memory store(s), VNG vDB/PostgreSQL, 4 child runtimes, MCP Gateway. Missing any piece, the app falls back safely: no DB → local; no Memory → memory off; no child → monolith in one runtime; no key → local rules.

## Demo flow for reviewers (Golden Spin)

1. **Risky brief** — `Golden Spin Weekend Risk` → Yellow/Red readiness, low score, 5-persona Red Team + a checklist to fix.
2. **Learn from retro** — `Golden Spin ... Retro` holds a stored lesson; it is recalled to ground the next analysis.
3. **Ready brief** — `Golden Spin Weekend v2 Ready` applied lessons → Green 12/12; at full score there are no open risks/Red Team, and any new risk is recorded under Post-launch result to become the next lesson.
4. **Multi-agent proof** — open the trace tab to see `orchestration.mode=remote_agents`, 4 `remote_runtime` children, each recalling from its own store.

Click **Load Sample Brief** or **Demo mode** to load it quickly.

## Web UI

- **Friendly mode:** step-by-step guided experience for newcomers.
- **Pro mode:** full dashboard — readiness, Red Team, checklist, post-mortem, RAG insight, trace, and the controlled self-learning panel.
- **Admin log:** open with `?role=admin` to see client events + server trace per launch.
- **VI/EN:** bilingual UI; LLM output follows the brief's language.

## MCP and tools

`/mcp` supports streamable HTTP JSON-RPC (`initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`). `GET /mcp` and `DELETE /mcp` return `405` by spec.

- `lcc` — deterministic fast analysis for MCP/OpenClaw.
- `lcc_docs` — how to use LaunchOps + pick the right tool for a bot.
- `lcc_catalog` — read the immutable catalog (product/classification/template); bots read only.
- `lcc_list_launches` · `lcc_get_launch` · `lcc_create_launch` · `lcc_update_launch` · `lcc_analyze_launch` · `lcc_delete_launch`.
- `lcc_propose_template_update` · `lcc_approve_template_version` — controlled self-learning (Admin-only).
- `analyze_launch_brief` — legacy tool, kept backward-compatible.

OpenClaw connects via `npx mcp-remote <endpoint>/mcp`. Self-host: point your bot at `/mcp` or `POST /tools/call`.

## Env

```text
# Minimum (one key for all agents):
LLM_API_KEY=...
LLM_BASE_URL=https://.../v1
LLM_MODEL=...

# Advanced — per-agent model/key (optional):
LAUNCHOPS_MODEL_READINESS=deepseek/deepseek-v4-pro
LAUNCHOPS_MODEL_REDTEAM=minimax/minimax-m2.5
LAUNCHOPS_MODEL_CHECKLIST=qwen/qwen3.7-plus
LAUNCHOPS_MODEL_POSTMORTEM=google/gemma-4-31b-it
LAUNCHOPS_MODEL_ASSISTANT=deepseek/deepseek-v4-flash

# Cloud (optional):
LAUNCHOPS_STORAGE_BACKEND=cloud
LAUNCHOPS_DB_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=disable
LAUNCHOPS_MEMORY_ENABLED=true
LAUNCHOPS_MEMORY_ID=...
LAUNCHOPS_KNOWLEDGE_MEMORY_ID=...
LAUNCHOPS_RAG_ENABLED=true

# Remote multi-agent (optional):
LAUNCHOPS_USE_REMOTE_AGENTS=true
LAUNCHOPS_READINESS_URL=https://...
LAUNCHOPS_REDTEAM_URL=https://...
LAUNCHOPS_CHECKLIST_URL=https://...
LAUNCHOPS_POSTMORTEM_URL=https://...
LAUNCHOPS_AGENT_INVOCATION_TOKEN=...

# Governance:
LAUNCHOPS_GUARDRAIL_ENABLED=true
LAUNCHOPS_RATELIMIT_ENABLED=true
LAUNCHOPS_RATELIMIT_ANALYZE_PER_MIN=50
LAUNCHOPS_RATELIMIT_ANALYZE_PER_DAY=1000
```

Never commit `.env` or real credentials.

## Repo layout

```text
index.html              # Web UI markup
app.js                  # Pro UI: launch CRUD, analyze, run log, self-learning UI
friendly-ui.js          # Friendly mode
i18n-clean.js           # VI/EN translations
styles.css · friendly.css
config.js               # same-origin API config
server/app.py           # Web server + API + MCP + 6-agent pipeline
server/db.py            # local/cloud storage layer
server/test_app.py      # stdlib unit tests (152 tests)
server/seed_knowledge.py · server/migrate_to_cloud_db.py
data/ · prompts/ · Dockerfile · README.md
```

## Test

```bash
python -m unittest server.test_app    # 152 tests, stdlib, no .env needed
node --check app.js friendly-ui.js i18n-clean.js
```

## Security

- Never commit `.env`, `.greennode.json`, API keys, real DB URLs, logs, or database files.
- Production resources + credentials are the author's own and not shared; cloners provision their own.
- The guardrail handles secrets/PII before any LLM call or memory write; assistant context is redacted before it enters a prompt.
- The public endpoint is intentionally open for the ClawAThon VNG demo.
