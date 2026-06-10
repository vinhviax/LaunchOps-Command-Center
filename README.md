# LaunchOps Command Center ? Super Agent & Dashboard

LaunchOps Command Center l? m?t **Super Agent (Command Center)** chuy?n bi?t gi?p c?c solo developer v? team ki?m so?t r?i ro tr??c khi ra m?t chi?n d?ch, s? ki?n ingame, ho?c c?p nh?t s?n ph?m. 

H? th?ng kh?ng ph?i l? m?t chatbot th?ng th??ng m? l? m?t **Multi-Agent Pipeline** t?i gi?n t? ??ng li?n k?t c?c chuy?n gia:
1.  **Mission Control Agent**: Ti?p nh?n brief, ph?n lo?i v? ph?n t?ch s? b?.
2.  **Launch Readiness Agent**: Ch?m ?i?m m?c ?? s?n s?ng (Green / Yellow / Red) theo Rubric 6 nh?m r?i ro (M?c ti?u, Owner, Tech, User, Business, Post-mortem).
3.  **Red Team Agent**: ??ng vai 5 persona (Angry user, Exploit hunter, CS lead, Tech on-call, Business owner) ph?n bi?n v? t?m l? h?ng c?a brief.
4.  **Checklist Agent**: Chuy?n ??i r?i ro th?nh vi?c l?m c? th? c? Owner, Deadline v? Priority.
5.  **Post-mortem Agent**: L?p s?n k?ch b?n v? c?u h?i r?t kinh nghi?m sau launch.

---

## C?c t?nh n?ng ch?nh

-   **Ph?n t?ch Multi-Agent c? Trace th?c t?**: Endpoint `/analyze` g?i tu?n t? qua c?c Agent logic v? tr? v? `agentsTrace` chi ti?t ph?c v? vi?c ??nh gi? t?nh minh b?ch c?a AI.
-   **??nh tuy?n Multi-Model t?i ?u tr?n GreenNode MaaS**:
    -   *Readiness Agent*: DeepSeek V4 Pro
    -   *Red Team Agent*: MiniMax M2.5
    -   *Checklist Agent*: Qwen 3.7 Plus
    -   *Post-mortem Agent*: Gemma 4 31B-IT
    -   *Assistant Agent*: DeepSeek V4 Flash
-   **H? th?ng fallback an to?n**: N?u g?i LLM l?i ho?c timeout, h? th?ng t? ??ng s? d?ng b? ch?m ?i?m deterministic rule-based ?? ??m b?o giao di?n dashboard kh?ng bao gi? b? treo.
-   **Giao di?n 2 ch? ?? (Pro / Friendly)**:
    -   *Pro Mode*: Hi?n th? ??y ?? tham s? k? thu?t, trace JSON v? log.
    -   *Friendly Mode*: Tr?c quan h?a ti?n tr?nh qua Mascot ??ng v? ??n t?n hi?u tr?ng th?i (Green/Yellow/Red).

---

## C?u tr?c m? ngu?n

-   `server/app.py`: Backend ch?nh, ch?y Multi-Agent orchestrator v? qu?n l? API.
-   `server/db.py` & `schema.sql`: Qu?n l? SQLite l?u tr? c?c launch profile m?u, product snapshot v? b?i h?c kinh nghi?m.
-   `index.html`, `app.js`, `friendly-ui.js`: Giao di?n Web Dashboard hai ch? ??.
-   `data/`: Ch?a c?c t?i li?u m?u (brief t?t, brief x?u, rubric r?i ro).

---

## C?ch ch?y local

1.  **C?u h?nh bi?n m?i tr??ng**: T?o file `.env` t?i th? m?c g?c c?a project:
    ```env
    LAUNCHOPS_AGENTBASE_API_KEY=your_key_here
    LAUNCHOPS_AGENTBASE_BASE_URL=https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1
    LAUNCHOPS_LLM_ENABLED=true
    LAUNCHOPS_MULTI_MODEL_ENABLED=true
    ```
2.  **Ch?y Backend local**:
    ```powershell
    python server/app.py
    ```
    M?c ??nh backend ch?y t?i `http://127.0.0.1:8080`.
3.  **Ch?y Frontend**:
    ```powershell
    python -m http.server 8787 --bind 127.0.0.1
    ```
    M? tr?nh duy?t: `http://127.0.0.1:8787/index.html`.

---

## Tri?n khai tr?n AgentBase (Custom Agent)

Project ?? ???c ??ng g?i s?n Docker.
1.  **Build v? Push Image**:
    ```bash
    docker build -t launchops-command-center:local .
    docker tag launchops-command-center:local vcr.vngcloud.vn/[repoName]/launchops-command-center:v1
    docker push vcr.vngcloud.vn/[repoName]/launchops-command-center:v1
    ```
2.  **Kh?i ch?y Custom Runtime**:
    ```bash
    bash .agents/skills/agentbase/scripts/runtime.sh create       --name launchops-command-center       --image vcr.vngcloud.vn/[repoName]/launchops-command-center:v1       --from-cr       --flavor runtime-s2-general-2x4       --min-replicas 1 --max-replicas 1       --env-file .env
    ```
