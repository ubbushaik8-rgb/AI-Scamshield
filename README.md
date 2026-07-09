# AI ScamShield — Intelligent Scam & Phishing Detection Agent
*IBM Build on IBM (BOB) Hackathon 2025*

A 4-agent agentic AI system that analyses suspicious messages (email, SMS,
WhatsApp, UPI requests, job offers, URLs, QR codes) and classifies them as
**SCAM**, **SUSPICIOUS**, or **GENUINE**, powered by **IBM Granite via
watsonx.ai**.

## Architecture — the 4 agents

| Agent | Role | File |
|---|---|---|
| Agent 1 | Scam Type Classifier | `scam_engine.py` → `classify_scam_type()` |
| Agent 2 | Threat Indicator Analyzer | `scam_engine.py` → `analyze_indicators()` |
| Agent 3 | RAG Knowledge Retrieval (RBI, CERT-In, OWASP, NIST, NPCI) | `knowledge_base.py` |
| Agent 4 | Safety Advice Generator | `scam_engine.py` → `safety_tips_for()` / `report_to_for()` |

`app.py` orchestrates all four agents for every `/api/analyze` request, then
(optionally) hands the structured findings to **IBM Granite** to write the
natural-language explanation, chat replies, and formal threat reports.

## Running it

```bash
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000**.

The app is **fully functional out of the box** with zero configuration —
detection, the dashboard, awareness tips, and chat all work using the local
rule-based reasoning engine.

## Enabling real IBM Granite / watsonx.ai generation

To have Granite (instead of the local template engine) generate the
explanations, chat replies, and threat-intelligence reports, set these
environment variables before starting the app:

```bash
export WATSONX_API_KEY="your-ibm-cloud-api-key"
export WATSONX_PROJECT_ID="your-watsonx-project-id"
export WATSONX_URL="https://us-south.ml.cloud.ibm.com"   # your region
export WATSONX_MODEL_ID="ibm/granite-3-8b-instruct"       # optional, this is the default
```

Get an API key and project ID from the [IBM watsonx.ai console](https://dataplatform.cloud.ibm.com/wx/home).
With these set, `watsonx_client.is_configured()` returns `True` and every
analysis/chat/report call routes through Granite automatically — the
response JSON's `agent_source` field will read `"IBM Granite (watsonx.ai)"`
instead of `"Local Reasoning Engine"` so you can verify which path is active.
If a live watsonx call ever fails (network, quota, auth), the app logs a
warning and transparently falls back to the local engine rather than
breaking the request.

## Project structure

```
scamshield/
├── app.py                 # Flask app + all /api/* routes
├── scam_engine.py          # Agents 1, 2, 4 — classification, indicators, advice
├── knowledge_base.py       # Agent 3 — RAG knowledge base + retriever
├── watsonx_client.py       # IBM watsonx.ai / Granite REST client
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    └── js/app.js
```

## API endpoints

- `GET  /api/examples` — sample messages for the demo picker
- `POST /api/analyze` — `{ message, type }` → full 4-agent analysis
- `POST /api/chat` — `{ message, session_id }` → AI cyber-assistant reply
- `POST /api/security-report` — `{ analysis_result }` → formal report text
- `GET  /api/threat-dashboard` — KPI/chart data for the dashboard
- `GET  /api/awareness-tips?count=6` — random cyber-safety tips

## Notes

- Dashboard stats combine illustrative baseline numbers with real counts from
  analyses run in the current server session (in-memory; swap in a database
  for persistence across restarts).
- The knowledge base in `knowledge_base.py` is a lightweight keyword-scored
  retriever standing in for a vector database (e.g. ChromaDB) — swap in real
  embeddings + a vector store there if you want true semantic RAG.
