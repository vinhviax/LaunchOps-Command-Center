# LaunchOps Command Center

> Updated 2026-06-22 - the sample set now has 9 fuller launches split across 3 completed / 3 running / 3 upcoming scenarios; analysis, checklist, and lesson output follows the brief language.

LaunchOps Command Center is a **multi-agent command center for launch risk**. You paste a launch brief; the system scores readiness as Green/Yellow/Red against a risk rubric, runs a 5-persona Red Team, generates an owner/deadline/priority checklist, drafts post-mortem questions, and stores lessons for the next launch.

It is not a chatbot. The goal is to turn launch gatekeeping — usually run on tribal knowledge and a few people's memory — into a system with a score, a challenger, a checklist, and institutional memory you can reuse.

**Live demo:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

> ⚠️ This is the author's own **ClawAThon VNG** instance. The endpoint, MaaS key, Cloud DB/PostgreSQL, Memory/knowledge stores, and child runtimes above are the author's **private resources and credentials — not shared, not multi-tenant**. To run the full mode, provision your own resources (see [How to run](#how-to-run)). To try it instantly with no cloud, use **Local demo mode** — Python only.

## A more practical example

Imagine the team is about to launch a **7-day login reward event** to bring old players back into the game.

If humans handle it manually, the usual pattern is familiar: the PM writes the brief in chat, LiveOps remembers half of it, CS remembers another half, and tech remembers the rest. Everyone is experienced, yet launches still break in the same predictable ways:

- KPI is not locked, so nobody can clearly say whether the event succeeded or failed
- there is no reward cap, so economy balance or budget can blow up
- CS has no FAQ, so players get inconsistent answers when complaints spike
- nobody is clearly assigned to pause the event or trigger a rollback if reward delivery fails
- anti-abuse rules are unclear, so the team only reacts after players start farming rewards

What makes LaunchOps Command Center stronger than a manual process is that it **does not depend on individual memory or gut feeling**.

It reads that brief and immediately does the work teams usually forget:

1. It recognizes this as a **retention / login event** and uses the right evaluation template instead of judging it generically.
2. It scores the launch with a fixed rubric and answers clearly: is it **Green, Yellow, or Red**, how many points are missing, and where?
3. It runs Red Team pressure from multiple angles to surface the launch failures that usually only show up in production: player complaints, CS breakdowns, technical gaps, and business blind spots.
4. It turns every gap into a checklist with a real owner: who locks KPI, who writes the FAQ, who watches the logs, who is on incident duty, and who has the authority to stop the event.

More importantly, when the launch is over, it does not let the lesson disappear into chat history.

If this event triggers complaints because rewards are delayed, or gets exploited because anti-abuse was weak, that lesson is stored. The next time the team creates a similar login event, the agent pulls that exact lesson back into the analysis and reminds the team: "this already failed here before." If the same lesson repeats often enough, the agent can even **propose** a rubric/template update so future launches are checked more strictly on that weak point — but a human still has to approve it before it becomes active.

In short: humans still make the launch decision, but the agent is stronger because it **does not forget, does not score by intuition, does not repeat old blind spots, and turns scattered team experience into a reusable operating system for every future launch**.

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
| Readiness | Explains Green/Yellow/Red | `google/gemma-4-31b-it` |
| Red Team | 5-persona critique | `minimax/minimax-m2.5` |
| Checklist | Tasks + owner/deadline | `google/gemma-4-31b-it` |
| Post-mortem | Post-launch questions/report | `google/gemma-4-31b-it` |
| Memory | Distills recalled lessons into an insight | `google/gemma-4-31b-it` |
| Orchestrator | Executive go/no-go summary | `google/gemma-4-31b-it` |

The assistant chatbot uses `google/gemma-4-31b-it`. All LLM paths now use only 2 allowed models: Gemma `google/gemma-4-31b-it` and Minimax `minimax/minimax-m2.5`; if env uses the short names `gemma-4-31b-it` or `minimax-m2.5`, the backend normalizes them to the MaaS IDs. MCP/Bot calls use a deterministic fast path (`lcc`) returning in < 1s to avoid gateway timeouts.

## It learns (controlled self-learning — live)

Post-launch lessons don't sit dead in a log. LCC learns on two tiers:

- **Soft learning:** stored lessons are recalled and woven into every agent's prompt on the next analysis of the same launch type, so the next brief is read through what went wrong last time.
- **Hard learning (human-approved):** from a lesson, the AI **proposes** a delta to the rubric/personas (add a risk group, change maxScore, add a persona). The proposal sits as `proposed` and **does not change the template**. A reviewer Approves/Rejects; Approve creates a **new template version** applied to later scoring.

Everything is human-in-the-loop, versioned, and auditable. Proposals are masked for secrets/PII before storage, and configuration-changing tools are Admin-only. This is a shipped feature, not a future plan.

## Why you can trust the score

The readiness score is **not** assigned by an LLM. It is recomputed by a **deterministic rubric** from brief evidence against the template's risk groups — the same brief + template always yields the same score. The LLMs only explain, challenge, and summarize.

This is a deliberate trade-off: a Go/No-Go gate must be **reproducible and auditable**, not subject to a model's mood. If an LLM picked the number, the same brief could score differently across runs — unacceptable for a launch decision. So the model does what it's good at (language, critique) while a fixed rule owns the number. When a model fails, times out, or returns an invalid schema, that agent falls back to local rules and records the reason in `agentsTrace`.

Two protective mechanisms, each at two tiers — app-level (enforced in code) and platform-level (a VNG Protect & Govern resource):

- **Guardrail** — app-level: rejects briefs with private keys/credentials/payment secrets, masks email/phone before any LLM call or memory write. Platform-level: the `launchops-guardrail` resource adds protection on MaaS/model access.
- **Rate limit** — app-level: caps the expensive analyze path (production 50 req/min, 1000 req/day; MCP fast path exempt). Platform-level: the `launchops-rate-limit` resource on Protect & Govern (1000 requests + 3M tokens per month).

## Architecture

The core app is **one Python + HTML/CSS/vanilla-JS codebase with no build step**. The same codebase can run in two modes: **monolith in one runtime** or **distributed remote-agents** (1 orchestrator + 4 analysis child runtimes).

```text
User / Reviewer  ──▶  AgentBase Runtime (orchestrator)
                         ├── GET  /                 → Pro/Friendly Web UI
                         ├── POST /api/analyze      → full multi-agent analysis
                         ├── POST /api/assistant    → chatbot
                         ├── POST /api/launches/... → launch CRUD + saved analysis
                         ├── POST /mcp              → MCP JSON-RPC
                         └── GET/DELETE /mcp        → 405 (streamable-http spec)
                         │
                         ├── VNG MaaS LLM models
                         ├── Cloud DB / PostgreSQL (launch, template, history, archive)
                         ├── 4 child runtimes: readiness · redteam · checklist · postmortem
                         ├── Memory stores / knowledge stores for recall and lesson grounding
                         └── Optional MCP path: AgentBase MCP Gateway or self-host channel/bot
```

Production currently runs **remote multi-agent**: the orchestrator receives a request and calls 4 independent child runtimes via `POST /invocations`. Each child has its own runtime, model, and can recall from its own memory/knowledge store before returning. Memory insight + executive summary are synthesized at the orchestrator. If a child fails, the orchestrator falls back per agent instead of failing the whole flow. The production trace shows `orchestration.mode=remote_agents` plus `ragSources.storeId` on each child to prove this.

MCP also ships a **self-host channel skill** so bots can connect straight to the LaunchOps backend without requiring the AgentBase Gateway. The package exposes a shared manifest at `/api/channel-skill`, dedicated aliases for OpenClaw/Discord at `/openclaw/skill` and `/discord/skill`, plus system-prompt and `mcp-remote.json`. Zalo/Telegram currently use the same skill package plus backend webhooks, not dedicated `/zalo/skill` or `/telegram/skill` aliases. OpenClaw still needs `npx mcp-remote` because that client only supports stdio MCP.

## Where it expands

Each direction is anchored to something that already exists, not a vague promise. Shipped vs. direction is kept explicit:

| Axis | Shipped ✅ / Direction 🔜 | Anchored to |
|---|---|---|
| **Domain** | ✅ change domain = change template, not code | Template + classification/risk-group/persona catalog |
| **Organization** | ✅ partial — product selector, per-product template (Demo live, Product XYZ locked) | `lcc_select_product` + per-product template |
| **Operational data** | 🔜 ground the score with real metrics (DAU, revenue, incidents) | MCP architecture exists; data sources not yet wired into scoring |
| **MCP architecture** | ✅ MCP server + channel skill/webhook across chat/agent platforms | `/mcp`, `/api/channel-skill`, OpenClaw/Discord skill aliases, Zalo/Telegram webhooks |
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
LLM_MODEL=google/gemma-4-31b-it
PORT=8788 python server/app.py
```

Every agent calls an OpenAI-compatible `/v1/chat/completions`. To give each agent its **own model/key** (advanced), set `LAUNCHOPS_MODEL_<AGENT>` and `LAUNCHOPS_<AGENT>_API_KEY`; if unset, the agent falls back to the shared key/model above — so a single key always works.

### 3. Full AgentBase — distributed multi-agent + RAG + Cloud DB

For remote multi-agent, RAG, and Cloud DB like production, provision your own resources and fill your own `.env` (see [Env](#env)): VNG MaaS key, Cloud DB/PostgreSQL, AgentBase Memory/knowledge store(s), and 4 child runtimes. MCP Gateway is an optional integration path; the self-host channel skill can connect straight to the backend. Missing any piece, the app falls back safely: no DB → local; no Memory → memory off; no child → monolith in one runtime; no key → local rules.

## Demo flow (sample launches)

1. **Completed with lessons** — the completed group has 1 Red (`Shop Đá Quý Bão Tố Đã Chạy`) and 2 Yellow launches; each has post-result + lessons for later recall.
2. **Running now** — the running group has `Xem Trước Kho Skin Đang Chạy` as Green and 2 Yellow launches to monitor (`Vòng Quay Golden Spin Đang Chạy`, `Đua Boss Bang Hội Đang Chạy`).
3. **Upcoming** — the upcoming group has 2 Green launches (`Vòng Quay Golden Spin Sắp Chạy`, `Festival Skin Phoenix Sắp Chạy`) and 1 Yellow (`Chuỗi Đăng Nhập Comeback Sắp Chạy`).
4. **Multi-agent proof** — open the trace tab to see rubric-based readiness, agent-generated Red Team/checklist/post-mortem output, and completed-launch lessons reused as context.

Click **Load Sample Brief** or **Demo mode** to load it quickly.

## Web UI

- **Friendly mode:** step-by-step guided experience for newcomers.
- **Pro mode:** full dashboard — readiness, Red Team, checklist, post-mortem, RAG insight, trace, and the controlled self-learning panel.
- **Launch list:** shared Pro/Friendly filters by name, classification, template, status, and running date range so reviewers can find launches in a specific window.
- **Archive:** deleted user launches move to the Archive tab inside Config, where Admins can review, restore, or purge them; the public review build keeps it view-only while locked.
- **Seed data:** sample launches, sample classifications, and sample templates are immutable for normal users; users can still create, edit, and delete their own custom data without damaging the demo set.
- **Log:** view client events + server trace per launch in Pro mode (read-only in the public review build).
- **VI/EN:** bilingual UI; analysis, checklist, and lesson output follows the brief language (Vietnamese brief returns Vietnamese, English brief returns English).

## MCP and tools

`/mcp` supports streamable HTTP JSON-RPC (`initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`). `GET /mcp` and `DELETE /mcp` return `405` by spec.

- `lcc` — deterministic fast analysis for MCP/OpenClaw.
- `lcc_docs` — how to use LaunchOps + pick the right tool for a bot.
- `lcc_catalog` — read the immutable catalog (product/classification/template); bots read only.
- `lcc_list_launches` · `lcc_get_launch` · `lcc_create_launch` · `lcc_update_launch` · `lcc_analyze_launch` · `lcc_delete_launch`.
- `lcc_propose_template_update` · `lcc_approve_template_version` — controlled self-learning (Admin-only).
- `analyze_launch_brief` — legacy tool, kept backward-compatible.

OpenClaw connects via `npx mcp-remote <endpoint>/mcp`. For self-hosted bots/webhooks, you can use `/mcp` directly (if the client speaks MCP streamable-http or has an equivalent bridge) or call `POST /tools/call` through your own wrapper.

## Env

```text
# Minimum (one key for all agents):
LLM_API_KEY=...
LLM_BASE_URL=https://.../v1
LLM_MODEL=google/gemma-4-31b-it

# Advanced — per-agent model/key (optional, only 2 models allowed):
LAUNCHOPS_MODEL_READINESS=google/gemma-4-31b-it
LAUNCHOPS_MODEL_REDTEAM=minimax/minimax-m2.5
LAUNCHOPS_MODEL_CHECKLIST=google/gemma-4-31b-it
LAUNCHOPS_MODEL_POSTMORTEM=google/gemma-4-31b-it
LAUNCHOPS_MODEL_MEMORY=google/gemma-4-31b-it
LAUNCHOPS_MODEL_ORCHESTRATOR=google/gemma-4-31b-it
LAUNCHOPS_MODEL_ASSISTANT=google/gemma-4-31b-it

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
LAUNCHOPS_RATELIMIT_ENABLED=false
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
server/test_app.py      # stdlib unit tests (182 tests)
server/requirements.txt · server/schema.sql
server/seed_knowledge.py · server/seed_demo_data.py · server/migrate_to_cloud_db.py
data/ · prompts/ · Dockerfile · .env.example · README.md
```

## Test

```bash
python -m unittest server.test_app    # 182 tests, stdlib, no .env needed
node --check app.js friendly-ui.js i18n-clean.js
```

## Security

- Never commit `.env`, `.greennode.json`, API keys, real DB URLs, logs, or database files.
- Production resources + credentials are the author's own and not shared; cloners provision their own.
- The guardrail handles secrets/PII before any LLM call or memory write; assistant context is redacted before it enters a prompt.
- The public endpoint is intentionally open for the ClawAThon VNG demo.
