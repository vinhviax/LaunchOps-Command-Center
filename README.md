# LaunchOps Command Center

LaunchOps Command Center là một Super Agent giúp team kiểm tra rủi ro trước khi launch sự kiện, campaign, tính năng mới hoặc internal tool.

Sản phẩm không phải chatbot chung chung. Hệ thống đọc launch brief, chấm readiness, phản biện bằng Red Team, tạo checklist có owner/deadline/status và chuẩn bị post-mortem để team học lại sau mỗi lần launch.

## Demo flow

1. Dán một launch brief xấu, ví dụ `Lucky Wheel Weekend`.
2. Hệ thống chấm điểm readiness: Green / Yellow / Red.
3. Red Team Agent tạo 5 góc nhìn phản biện:
   - Angry user
   - Exploit hunter
   - CS lead
   - Tech on-call
   - Business owner
4. Checklist Agent tạo danh sách việc cần làm có owner, deadline, status và priority.
5. Post-mortem Agent tạo câu hỏi và action items cho lần launch sau.

## Multi-Agent pipeline

Dự án chạy dưới dạng 1 Custom Agent container trên AgentBase, bên trong có 5 agent mode logic:

- Mission Control: nhận brief và điều phối pipeline.
- Launch Readiness: chấm điểm readiness bằng rubric rủi ro.
- Red Team: phản biện launch từ nhiều persona.
- Checklist: biến rủi ro thành việc làm cụ thể.
- Post-mortem: tạo câu hỏi tổng kết và bài học.

Response API có trường `agentsTrace` để chứng minh các bước agent đã chạy.

## Multi-model routing

Backend hỗ trợ định tuyến nhiều model trên GreenNode MaaS:

- Readiness: `deepseek/deepseek-v4-pro`
- Red Team: `minimax/minimax-m2.5`
- Checklist: `qwen/qwen3.7-plus`
- Post-mortem: `google/gemma-4-31b-it`
- Assistant: `deepseek/deepseek-v4-flash`

Nếu LLM lỗi hoặc timeout, hệ thống fallback về rule-based flow để demo không bị treo.

## API chính

- `GET /health`: kiểm tra runtime sống.
- `POST /analyze`: phân tích launch brief.
- `POST /api/analyze`: alias cho frontend cũ.
- `POST /invocations`: alias dự phòng cho runtime invocation style.

Sample payload:

```json
{
  "brief": "Tên launch: Lucky Wheel Weekend...",
  "launch": {
    "type": "game_event_h5",
    "gameId": "demo_game"
  }
}
```

## Chạy local

Chạy backend:

```powershell
python server/app.py
```

Chạy frontend:

```powershell
python -m http.server 8787 --bind 127.0.0.1
```

Mở:

```text
http://127.0.0.1:8787/index.html
```

## Cấu hình môi trường

Tạo file `.env` ở thư mục gốc project. Không commit file này.

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

## Deploy lên AgentBase

Image đã được build và push lên VNG Cloud Container Registry.

Runtime public hiện tại:

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

## Ghi chú bảo mật

Repo public không được chứa:

- `.env`
- `.greennode.json`
- `.agentbase/`
- API key
- IAM client secret
- runtime logs

Nếu lỡ commit secret, cần rotate key ngay.
