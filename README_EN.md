# LaunchOps Command Center

> Updated: 2026-06-14 — production build: image `v15`, runtime version 18 on VNG AgentBase.

LaunchOps Command Center is a **launch-risk Super Agent**: it reads a launch brief (game event, marketing campaign, feature release, hotfix...), scores readiness as Green/Yellow/Red, challenges the plan with a 5-persona Red Team, generates an owner/deadline/priority checklist, and prepares a post-mortem so the team learns from every launch.

**Live demo:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

## Architecture

Everything runs in **one Docker image** (`python:3.11-slim`, Python stdlib only — no framework, no heavy dependencies), deployed to a VNG AgentBase Agent Runtime:

- `GET /` — Web UI (Pro / Friendly modes, VI/EN)
- `GET /health` — healthcheck (AgentBase Service Contract)
- `POST /api/analyze` — full 5-agent LLM pipeline (~90–120s)
- `POST /api/assistant` — single-call LLM chatbot (~3s)
- `POST /api/launches/...` — launch CRUD + per-launch analyze
- `POST /mcp` — MCP streamable-http (JSON-RPC: initialize / tools/list / tools/call)
- `GET/DELETE /mcp` — **405 by spec (do not change)**
- `POST /webhooks/telegram`, `/webhooks/zalo`

OpenClaw (stdio-only MCP client) connects through the `npx mcp-remote <endpoint>/mcp` bridge, optionally via the IAM-protected MCP Gateway `launchops-server`.

## Multi-model agent pipeline

Each agent calls its own model through the **OpenAI-compatible** `/v1/chat/completions` API on VNG MaaS — switching models is an env change, not a code change:

| Agent | Env | Current model |
|---|---|---|
| Readiness | `LAUNCHOPS_MODEL_READINESS` | `deepseek/deepseek-v4-pro` |
| Red Team | `LAUNCHOPS_MODEL_REDTEAM` | `minimax/minimax-m2.5` |
| Checklist | `LAUNCHOPS_MODEL_CHECKLIST` | `qwen/qwen3.7-plus` |
| Post-mortem | `LAUNCHOPS_MODEL_POSTMORTEM` | `google/gemma-4-31b-it` |
| Assistant | `LAUNCHOPS_MODEL_ASSISTANT` | `deepseek/deepseek-v4-flash` |

- API responses carry `trace` + `agentsTrace` proving which agent ran on which model.
- The final readiness score is always recomputed by a **deterministic rule** — the LLM explains risks, it does not freestyle the score.
- Every agent falls back to local rules on LLM error/timeout — the pipeline never dies midway.
- `POST /mcp tools/call` uses a **deterministic fast path (<1s)** to stay under the MCP Gateway's 15s timeout; `/api/analyze` is the full LLM path.
- MCP exposes two tool names on the same handler: `analyze_launch_brief` for backward compatibility and the short alias `lcc`.

## Memory

The backend can use **AgentBase Memory** behind feature flags:

- `LAUNCHOPS_MEMORY_ENABLED=true`
- `LAUNCHOPS_MEMORY_ID=<memory-id>`
- `LAUNCHOPS_MEMORY_STRATEGY_ID=<strategy-id>`
- `LAUNCHOPS_MEMORY_NAMESPACE_MODE=actor|session|product|global`

When enabled, the backend recalls long-term memory records before analysis and returns `memoryTrace` in the response. If Memory is misconfigured, unavailable, or missing the `X-GreenNode-AgentBase-User-Id` / `X-GreenNode-AgentBase-Session-Id` headers, the app falls back to local SQLite lessons and keeps `/api/analyze` alive. For headerless demos, `LAUNCHOPS_MEMORY_DEMO_FALLBACK_ENABLED=true` provides an explicit demo actor/session; production should keep it `false` to avoid mixing users.

Fast rollback: set `LAUNCHOPS_MEMORY_ENABLED=false` to return to local lessons.

## Chatbot commands

Primary commands use the `lcc` namespace:

```text
lcc help
lcc status
lcc list
lcc config
lcc analyze <brief>
lcc report <brief>
lcc guardrail <brief>
lcc infra <brief>
```

Legacy commands such as `status`, `analyze <brief>`, and `report <brief>` still work for one version and suggest the `lcc ...` form. If a user pastes a long brief without a command, the bot analyzes it by default. Natural prompts such as "check this brief", "review this launch", "red team this", "create checklist", and "what risks" also route to LaunchOps analysis.

## Web UI

- **Two modes:** Pro (full dashboard) and Friendly (guided NPC + step visualizer reading the real Pro DOM). Friendly is the default.
- **Admin-only Log tab:** open the URL with `?role=admin` to reveal a per-launch Log tab — client events (save → API call → result/timeout) plus server traces (which agent ran on which model, where fallbacks happened). Turn off with `?role=human`.
- A web analysis takes **~90–120s** (4 sequential LLM calls); the client timeout is 240s.
- Cache-busting via the `?v=` query in `index.html` — bump it whenever JS/CSS change.

## Run locally

```bash
# Rule mode (fast, no LLM) — best for UI work
LAUNCHOPS_LLM_ENABLED=false PORT=8788 python server/app.py

# Full LLM — requires .env with LAUNCHOPS_AGENTBASE_API_KEY + BASE_URL
PORT=8788 python server/app.py
```

Open `http://127.0.0.1:8788/` — UI and API share one origin. Env template: `.env.example`.

## Deploy

1. Build & push: `docker build -t vcr.vngcloud.vn/111480-abp111734/launchops-command-center:vNN .` → `docker push ...`
2. PATCH the runtime via the management API (mint an IAM token, mirror the latest version config, change only `imageUrl`). **Model/env changes are the same PATCH — no rebuild.**
3. The DEFAULT endpoint auto-rolls to the new version (~15–40s). Verify by content (grep the `?v=` version in the served index), not by the `status` field right after PATCH.

## Repo layout

See `README.md` (Vietnamese) for the annotated file map, `CODEX_BRIEF.md` for contributor/agent ground rules, and `OPENCLAW_BUILD_CHECKLIST.md` for the OpenClaw/MCP integration details.

## Security

- Never commit `.env`, tokens, keys, logs, or DB files (`.gitignore` already covers them).
- The public endpoint is intentionally unauthenticated for the hackathon demo; the MCP Gateway provides the IAM-protected path.
