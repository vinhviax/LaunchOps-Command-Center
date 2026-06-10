# LaunchOps Command Center

LaunchOps Command Center is a Super Agent that helps teams detect launch risks before shipping an event, campaign, feature, or internal tool.

It is not a generic chatbot. The system reads a launch brief, scores readiness, runs a Red Team review, generates an owner-based checklist, and prepares a post-mortem plan so the team can learn from every launch.

## Demo flow

1. Paste a risky launch brief, for example `Lucky Wheel Weekend`.
2. The system scores readiness as Green / Yellow / Red.
3. The Red Team Agent creates five critique cards:
   - Angry user
   - Exploit hunter
   - CS lead
   - Tech on-call
   - Business owner
4. The Checklist Agent turns risks into tasks with owner, deadline, status, and priority.
5. The Post-mortem Agent drafts questions and action items for the next launch.

## Multi-agent pipeline

The project is deployed as one Custom Agent container on AgentBase. Inside that container, the backend runs five logical agent modes:

- Mission Control: receives the brief and orchestrates the pipeline.
- Launch Readiness: scores readiness using a launch risk rubric.
- Red Team: challenges the launch from multiple personas.
- Checklist: turns risks into concrete tasks.
- Post-mortem: prepares review questions and lessons learned.

The API response includes `agentsTrace` to show the executed agent steps.

## Multi-model routing

The backend supports multi-model routing on GreenNode MaaS:

- Readiness: `deepseek/deepseek-v4-pro`
- Red Team: `minimax/minimax-m2.5`
- Checklist: `qwen/qwen3.7-plus`
- Post-mortem: `google/gemma-4-31b-it`
- Assistant: `deepseek/deepseek-v4-flash`

If an LLM call fails or times out, the system falls back to the deterministic rule-based flow so the demo remains usable.

## Main API

- `GET /health`: checks that the runtime is alive.
- `POST /analyze`: analyzes a launch brief.
- `POST /api/analyze`: legacy frontend alias.
- `POST /invocations`: runtime invocation-style alias.

Sample payload:

```json
{
  "brief": "Launch name: Lucky Wheel Weekend...",
  "launch": {
    "type": "game_event_h5",
    "gameId": "demo_game"
  }
}
```

## Run locally

Run backend:

```powershell
python server/app.py
```

Run frontend:

```powershell
python -m http.server 8787 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8787/index.html
```

## Environment config

Create a local `.env` file in the project root. Do not commit it.

```env
LAUNCHOPS_AGENTBASE_API_KEY=your_key_here
LAUNCHOPS_AGENTBASE_BASE_URL=https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1

LAUNCHOPS_MODEL_READINESS=deepseek/deepseek-v4-pro
LAUNCHOPS_MODEL_REDTEAM=minimax/minimax-m2.5
LAUNCHOPS_MODEL_CHECKLIST=qwen/qwen3.7-plus
LAUNCHOPS_MODEL_POSTMORTEM=google/gemma-4-31b-it
LAUNCHOPS_MODEL_ASSISTANT=deepseek/deepseek-v4-flash
LAUNCHOPS_MODEL_DEFAULT=qwen/qwen3.7-plus

LAUNCHOPS_LLM_TIMEOUT_SECONDS=60
LAUNCHOPS_LLM_ENABLED=true
LAUNCHOPS_MULTI_MODEL_ENABLED=true
```

## AgentBase deployment

The image has been built and pushed to VNG Cloud Container Registry.

Current public runtime endpoint:

```text
https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn
```

Health check:

```text
GET /health
```

Analyze:

```text
POST /analyze
```

## Security notes

The public repository must not include:

- `.env`
- `.greennode.json`
- `.agentbase/`
- API keys
- IAM client secrets
- runtime logs

If a secret was committed by mistake, rotate it immediately.
