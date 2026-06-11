# OpenClaw Build Checklist - LaunchOps Command Center

Má»¥c tiÃªu hiá»‡n táº¡i: **build/test trÆ°á»›c trÃªn OpenClaw**, sau Ä‘Ã³ khi cÃ³ AgentBase thÃ¬ Ä‘á»“ng bá»™ flow Ä‘Ã£ á»•n lÃªn AgentBase.

KhÃ´ng báº¯t Ä‘áº§u báº±ng viá»‡c sá»­a UI. KhÃ´ng build láº¡i agent demo Ä‘Æ¡n giáº£n tá»« sá»‘ 0. TrÆ°á»›c tiÃªn pháº£i Ä‘Ã³ng gÃ³i lÃµi LaunchOps hiá»‡n cÃ³ thÃ nh agent/API cháº¡y Ä‘Æ°á»£c:

`bad launch brief -> readiness score -> Red Team cards -> checklist -> post-mortem draft`

## 0a. KhÃ¡c biá»‡t so vá»›i demo GreenNode

Checklist demo GreenNode Ä‘i tá»« `login -> táº¡o repo -> build agent Ä‘Æ¡n giáº£n -> import skill -> deploy -> public endpoint -> push GitHub`.

Project hiá»‡n táº¡i Ä‘Ã£ cÃ³ sáºµn sáº£n pháº©m, nÃªn hÆ°á»›ng Ä‘Ãºng lÃ :

- [ ] Chá»n folder agent sáº¡ch tá»« project hiá»‡n cÃ³, Æ°u tiÃªn copy `launchops-command-center-public` sang `C:\Users\LAP13667\Documents\launchops-agent`.
- [ ] KhÃ´ng deploy trá»±c tiáº¿p tá»« Google Drive path náº¿u Docker/skill lá»—i.
- [ ] KhÃ´ng build láº¡i chatbot demo. Chá»‰ Ä‘Ã³ng gÃ³i flow LaunchOps: analyze brief, readiness, Red Team, checklist, post-mortem.
- [ ] Agent/API cáº§n cÃ³ `GET /health` vÃ  `POST /analyze` Ä‘á»ƒ BTC test Ä‘Æ°á»£c.
- [ ] Cloudflare Pages chá»‰ lÃ  visual backup, khÃ´ng pháº£i báº±ng chá»©ng PASS chÃ­nh.

## 0b. Tá»‘i 10/06 trÃªn PC

- [ ] Náº¿u dÃ¹ng láº¡i gá»£i Ã½ tá»« agent khÃ¡c, chá»‰ dÃ¹ng pháº§n Ä‘Ã£ Ä‘Æ°á»£c tÃ³m táº¯t trong `MEMORY.md`/`RISK_ANALYSIS.md`; verify lá»‡nh/flag trong AgentBase skills trÆ°á»›c khi cháº¡y.
- [ ] LÃ m song song:
  - OpenClaw backup Ä‘á»ƒ cÃ³ agent sá»‘ng nhanh.
  - Custom Agent API Ä‘á»ƒ táº­n dá»¥ng sáº£n pháº©m Ä‘Ã£ build.
- [ ] KhÃ´ng cháº¡y deploy náº¿u local `/analyze` chÆ°a tráº£ Ä‘Ãºng flow LaunchOps.

## 0. Tráº¡ng thÃ¡i chuáº©n bá»‹

- [x] **0.0** Codex AgentBase skills Ä‘Ã£ import vÃ o `G:\My Drive\AI\Clawathon\.agents\skills` tá»« repo `vngcloud/greennode-agentbase-skills`. Cáº§n restart Codex hoáº·c má»Ÿ session má»›i Ä‘á»ƒ nháº­n skill.
- [x] **0.1** OpenClaw Ä‘Ã£ cÃ³ trÃªn PC.
- [x] **0.2** API key Ä‘Ã£ cÃ³.
- [x] **0.3** Cáº¥u hÃ¬nh API key trong OpenClaw hoáº·c biáº¿n mÃ´i trÆ°á»ng local.
- [ ] **0.4** KhÃ´ng ghi API key vÃ o repo, README, prompt, screenshot hoáº·c video.
- [x] **0.5** Sau khi nháº­n account BTC cáº¥p, Ä‘Äƒng nháº­p GreenNode AI Platform vÃ  Ä‘á»•i máº­t kháº©u ngay.
- [x] **0.6** Náº¿u dÃ¹ng AgentBase skills, khÃ´ng cháº¡y háº¿t 9 bÆ°á»›c deploy khi use case chÆ°a build xong; trÃ¡nh deploy agent rá»—ng.
- [ ] **0.7** Náº¿u cáº§n Office 365 tháº­t, gá»­i `helpdesk@vng.com.vn` sá»›m vÃ¬ SLA pháº£n há»“i khoáº£ng 8 tiáº¿ng. Náº¿u chá»‰ demo mail/calendar, Æ°u tiÃªn giáº£ láº­p báº±ng Gmail/Google Calendar.

## 1. Chuáº©n bá»‹ input trong folder project

PIC chÃ­nh: **Back-end / OpenClaw**

- [ ] **1.1** Má»Ÿ `prompts/openclaw_backup_prompt.md`.
  - DÃ¹ng Ä‘á»ƒ paste vÃ o OpenClaw lÃ m system prompt/instruction chÃ­nh.
- [ ] **1.2** Má»Ÿ `data/risk_rubric.md`.
  - DÃ¹ng Ä‘á»ƒ agent cháº¥m Green / Yellow / Red theo 6 nhÃ³m rá»§i ro.
- [ ] **1.3** Má»Ÿ `data/agent_roles.md`.
  - DÃ¹ng Ä‘á»ƒ agent hiá»ƒu Ä‘Ã¢y lÃ  nhiá»u agent mode, khÃ´ng pháº£i chatbot chung chung.
- [ ] **1.4** Má»Ÿ `data/bad_launch_brief.md`.
  - DÃ¹ng lÃ m case test chÃ­nh, output nÃªn ra Yellow hoáº·c Red.
- [ ] **1.5** Má»Ÿ `data/good_launch_brief.md`.
  - DÃ¹ng lÃ m case Ä‘á»‘i chiáº¿u, output nÃªn tá»‘t hÆ¡n bad brief.

## 2. Táº¡o agent trong OpenClaw

PIC chÃ­nh: **Back-end / OpenClaw**

- [x] **2.1** Má»Ÿ OpenClaw trÃªn PC.
- [x] **2.2** Táº¡o agent/chat má»›i tÃªn `LaunchOps Command Center`.
- [x] **2.3** Paste ná»™i dung `prompts/openclaw_backup_prompt.md` lÃ m instruction chÃ­nh.
- [ ] **2.4** ThÃªm ná»™i dung `data/risk_rubric.md` vÃ o knowledge/context hoáº·c instruction.
- [ ] **2.5** ThÃªm ná»™i dung `data/agent_roles.md` vÃ o knowledge/context hoáº·c instruction.
- [ ] **2.6** Cáº¥u hÃ¬nh API key trong OpenClaw hoáº·c biáº¿n mÃ´i trÆ°á»ng local, khÃ´ng paste key vÃ o file trong repo.
- [ ] **2.7** Náº¿u OpenClaw cÃ³ pháº§n tool/API, ghi láº¡i:
  - TÃªn tool.
  - Endpoint.
  - Input cáº§n truyá»n.
  - Output tráº£ vá».
  - Lá»—i gáº·p pháº£i náº¿u cÃ³.
  - KhÃ´ng ghi secret/API key.

## 3. Test bad brief láº§n 1

PIC chÃ­nh: **Back-end / OpenClaw**

- [ ] **3.1** Paste toÃ n bá»™ `data/bad_launch_brief.md` vÃ o OpenClaw.
- [ ] **3.2** GÃµ yÃªu cáº§u:

```text
HÃ£y cháº¡y full LaunchOps flow cho brief nÃ y theo format báº¯t buá»™c.
```

- [ ] **3.3** Kiá»ƒm tra output cÃ³ Ä‘á»§ 5 pháº§n:
  - Mission Control Summary.
  - Readiness Score.
  - Red Team Cards.
  - Launch Checklist.
  - Post-mortem Draft.
- [ ] **3.4** Readiness nÃªn ra `Yellow` hoáº·c `Red`.
- [ ] **3.5** Checklist pháº£i cÃ³ cá»™t:
  - Task.
  - Owner.
  - Deadline.
  - Status.
  - Priority.
- [ ] **3.6** Red Team pháº£i cÃ³ 5 persona:
  - Angry user.
  - Exploit hunter.
  - CS lead.
  - Tech on-call.
  - Business owner.

## 4. Sá»­a prompt náº¿u output chÆ°a Ä‘áº¡t

PIC chÃ­nh: **Back-end / OpenClaw**

Náº¿u output lan man:

- [ ] **4.1** ThÃªm vÃ o prompt:

```text
KhÃ´ng giáº£i thÃ­ch ngoÃ i format. LuÃ´n tráº£ theo 5 section báº¯t buá»™c.
```

Náº¿u thiáº¿u Red Team:

- [ ] **4.2** ThÃªm vÃ o prompt:

```text
Red Team Cards báº¯t buá»™c cÃ³ Ä‘Ãºng 5 persona: Angry user, Exploit hunter, CS lead, Tech on-call, Business owner.
```

Náº¿u checklist chung chung:

- [ ] **4.3** ThÃªm vÃ o prompt:

```text
Má»—i task trong checklist pháº£i cÃ³ owner cá»¥ thá»ƒ vÃ  deadline dáº¡ng T-2 ngÃ y, T-1 ngÃ y, Launch day hoáº·c T+48 giá».
```

Náº¿u score sai:

- [ ] **4.4** Paste láº¡i `data/risk_rubric.md`.
- [ ] **4.5** YÃªu cáº§u agent cháº¥m tá»«ng nhÃ³m 0-2 Ä‘iá»ƒm trÆ°á»›c khi káº¿t luáº­n mÃ u.

Náº¿u output tá»‘t:

- [ ] **4.6** LÆ°u prompt phiÃªn báº£n tá»‘t nháº¥t.
- [ ] **4.7** LÆ°u output tá»‘t nháº¥t.
- [ ] **4.8** KhÃ´ng Ä‘á»•i prompt tiáº¿p náº¿u khÃ´ng cÃ³ lÃ½ do rÃµ.

## 5. Test good brief Ä‘á»ƒ Ä‘á»‘i chiáº¿u

PIC chÃ­nh: **Back-end / OpenClaw**

- [ ] **5.1** Paste `data/good_launch_brief.md` vÃ o OpenClaw.
- [ ] **5.2** YÃªu cáº§u cháº¡y cÃ¹ng flow.
- [ ] **5.3** Kiá»ƒm tra score pháº£i tá»‘t hÆ¡n bad brief.
- [ ] **5.4** Náº¿u good brief váº«n bá»‹ Red, rubric/prompt Ä‘ang quÃ¡ gáº¯t.
- [ ] **5.5** Náº¿u bad brief bá»‹ Green, rubric/prompt Ä‘ang quÃ¡ dá»….
- [ ] **5.6** Ghi láº¡i khÃ¡c biá»‡t giá»¯a bad brief vÃ  good brief Ä‘á»ƒ dÃ¹ng trong video/README.

## 6. Chá»‘t output dÃ¹ng cho demo

PIC chÃ­nh: **Back-end / OpenClaw** cho output, **Front-end** cho screenshot/video/local visual.

- [ ] **6.1 Back-end:** Copy output tá»‘t nháº¥t cá»§a bad brief vÃ o ghi chÃº táº¡m.
- [ ] **6.2 Back-end:** Náº¿u cáº§n táº¡o file sau nÃ y: `openclaw_demo_output.md`.
- [ ] **6.3 Front-end:** Chá»¥p screenshot OpenClaw náº¿u output Ä‘áº¹p.
- [ ] **6.4 Back-end:** ÄÃ¡nh dáº¥u 3 Ä‘iá»ƒm quan trá»ng Ä‘á»ƒ nÃ³i trong video:
  - VÃ¬ sao score lÃ  Yellow/Red.
  - Top 3 risk.
  - 3 task checklist quan trá»ng nháº¥t.
- [ ] **6.5 Front-end:** Sau khi OpenClaw flow á»•n, má»›i quay láº¡i polish `index.html`.

## 7. File nÃ o dÃ¹ng Ä‘á»ƒ lÃ m gÃ¬?

| File | PIC chÃ­nh | DÃ¹ng Ä‘á»ƒ lÃ m gÃ¬ | Khi nÃ o má»Ÿ |
|---|---|---|---|
| `prompts/openclaw_backup_prompt.md` | Back-end | Prompt ná»n cho OpenClaw | Má»Ÿ Ä‘áº§u tiÃªn khi táº¡o agent |
| `data/risk_rubric.md` | Back-end | Luáº­t cháº¥m Green / Yellow / Red | DÃ¡n vÃ o OpenClaw knowledge/instruction |
| `data/agent_roles.md` | Back-end | Vai trÃ² cÃ¡c agent mode | DÃ¹ng Ä‘á»ƒ trÃ¡nh chatbot chung chung |
| `data/bad_launch_brief.md` | Back-end | Case test chÃ­nh cÃ³ nhiá»u rá»§i ro | Test Ä‘áº§u tiÃªn |
| `data/good_launch_brief.md` | Back-end | Case Ä‘á»‘i chiáº¿u tá»‘t hÆ¡n | Test sau bad brief |
| `data/launch_checklist.md` | Back-end | Checklist máº«u | DÃ¹ng khi checklist OpenClaw quÃ¡ chung |
| `data/postmortem_questions.md` | Back-end | CÃ¢u há»i post-mortem | DÃ¹ng khi post-mortem output yáº¿u |
| `index.html` | Front-end | Demo UI local | Visual backup/quay video |
| `app.js` | Back-end | Logic rule-based local | Chá»‰ sá»­a sau khi OpenClaw flow á»•n |
| `styles.css` | Front-end | Giao diá»‡n local demo | Sá»­a á»Ÿ bÆ°á»›c polish UI |
| `README.md` | Cáº£ hai | Giáº£i thÃ­ch sáº£n pháº©m/cÃ¡ch cháº¡y | Cáº­p nháº­t sau khi cÃ³ output OpenClaw tá»‘t |
| `roadmap.html` | Front-end | Roadmap + checklist HTML | Má»Ÿ khi cáº§n biáº¿t bÆ°á»›c tiáº¿p theo |
| OpenClaw | Back-end | NÆ¡i test agent flow chÃ­nh trÆ°á»›c AgentBase | ÄÃ£ cÃ³ trÃªn PC |
| API key | Back-end | Cho OpenClaw/API tool gá»i service cáº§n thiáº¿t | Cáº¥u hÃ¬nh local, khÃ´ng commit vÃ o repo |

## 8. Káº¿t quáº£ cáº§n cÃ³ trÆ°á»›c khi chuyá»ƒn sang polish UI

- [ ] OpenClaw nháº­n bad brief vÃ  tráº£ Ä‘Ãºng format.
- [ ] Bad brief ra Yellow hoáº·c Red.
- [ ] CÃ³ 5 Red Team cards.
- [ ] CÃ³ checklist owner/deadline/status.
- [ ] CÃ³ post-mortem draft.
- [ ] CÃ³ má»™t output tá»‘t Ä‘Ã£ lÆ°u láº¡i.
- [ ] Agent cháº¡y Ä‘Æ°á»£c trÃªn AgentBase vÃ  BTC cÃ³ thá»ƒ gá»i thÃ nh cÃ´ng Ã­t nháº¥t 1 request.

Khi Ä‘á»§ cÃ¡c má»¥c trÃªn, má»›i chuyá»ƒn sang polish local demo vÃ  viáº¿t `demo_script.md`.

## Cáº­p nháº­t 2026-06-10 - Custom Agent API baseline vÃ  khoáº£ng trá»‘ng Multi-Agent

- [x] Repo sáº¡ch Ä‘Ã£ cÃ³ trÃªn GitHub: `https://github.com/vinhviax/LaunchOps-Command-Center`
- [x] Custom Agent API baseline Ä‘Ã£ cÃ³ route tá»‘i thiá»ƒu: `GET /health`, `POST /analyze`, `POST /invocations`.
- [x] Server config Ä‘Ã£ há»£p hÆ¡n cho container: bind `0.0.0.0`, port tá»« env `PORT`, default `8080`.
- [ ] Cáº§n thiáº¿t káº¿ plan ngáº¯n Ä‘á»ƒ biáº¿n backend tá»« single-call prompt thÃ nh Multi-Agent tá»‘i giáº£n.
- [ ] NÃªn giá»¯ `/analyze` lÃ  endpoint duy nháº¥t cho UI/BTC, nhÆ°ng bÃªn trong cháº¡y orchestrator gá»“m Readiness, Red Team, Checklist, Postmortem.
- [ ] NÃªn thÃªm `agentsTrace` vÃ o response Ä‘á»ƒ chá»©ng minh tá»«ng agent mode Ä‘Ã£ cháº¡y.
- [ ] KhÃ´ng deploy AgentBase náº¿u local `/analyze` chÆ°a tráº£ Ä‘á»§ 5 pháº§n LaunchOps vá»›i `data/bad_launch_brief.md`.

## C?p nh?t 2026-06-10 - Plan end-to-end ch?t

ÃÃ£ ch?t plan chi ti?t. Chi ti?t xem MEMORY.md m?c 8, PLAN_20260610.md, PRODUCTION_DESIGN.md.

Ãi?m thay d?i cho OpenClaw/AgentBase:
- LÃ m song song: OpenClaw backup + Custom Agent API multi-agent t?i gi?n
- P1: core multi-agent (10-11/06)
- P1+: DB + context + profiles + product agent (11-12/06)
- P2: Docker + deploy AgentBase (13/06)
- Cut-line 12/06: local core chua pass -> deploy b?n brief-only
- OpenClaw backup lÃ  lu?i an toÃ n, khÃ´ng thay th? agent custom


## Cập nhật tạm dừng 2026-06-10 19:40
- [x] Core multi-agent tối giản local đã xong.
- [x] DB/context/profiles SQLite local đã có khung.
- [x] Subset test local đã pass.
- [ ] Chưa xong full test matrix.
- [ ] Chưa làm Dockerfile/.dockerignore.
- [ ] Chưa deploy AgentBase/OpenClaw thật trong phiên này.


## C?p nh?t ho?n t?t 2026-06-11 08:10 - OpenClaw Active & T?ch h?p RAG/Memory
- [x] T?o th?nh c?ng OpenClaw instance m?i (vinhvnn-viax) ? tr?ng th?i ACTIVE.
- [x] C?u h?nh ??y ?? k?nh Zalo/Telegram tr?n UI c?a OpenClaw.
- [x] T?ch h?p s?n prompt bridge ?? bot t? ??ng ??ng vai tr? LaunchOps Command Center khi ???c h?i, ho?t ??ng nh? backup chatbot c?c k? an to?n.
- [x] Custom Agent LCC ?? c? RAG Insights ho?n ch?nh tr?n UI, t? ??ng l?i b?i h?c qu? kh? t? SQLite DB d?a tr?n t? kh?a trong brief.
