# 🛡️ AI ScamShield — Intelligent Scam & Phishing Detection Agent

AI ScamShield is an intelligent cybersecurity assistant built using **Python Flask**, **Bootstrap**, and **IBM watsonx.ai (Granite Models)**. It helps users detect scams, phishing attempts, malicious URLs, UPI fraud, fake job offers, and other cyber threats using an agent-based detection pipeline.

The application works in **two modes**:

- 🤖 **IBM Granite Mode** – Uses IBM watsonx.ai for AI-powered explanations, chat assistance, and security reports.
- 🔒 **Local Reasoning Mode** – Automatically falls back to a built-in detection engine when IBM credentials are unavailable, ensuring the application always remains functional.

---

# ✨ Features

| Feature | Description |
|---------|-------------|
| 🛡️ Scam Detection | Detect phishing emails, UPI scams, QR scams, fake job offers, malicious URLs, lottery scams, OTP fraud, and more |
| 🤖 AI Cyber Assistant | Chatbot powered by IBM Granite (or local reasoning engine) to answer cybersecurity questions |
| 📊 Threat Dashboard | Interactive dashboard displaying scam statistics, threat trends, and risk distribution |
| 📄 Security Report | Generates professional cybersecurity reports for detected threats |
| 📚 Knowledge Base | Built-in RAG-style cybersecurity knowledge retrieval system |
| ⚠️ Threat Analysis | Detects scam indicators and calculates confidence score & risk level |
| 💡 Cyber Safety Tips | Provides personalized safety recommendations and reporting authorities |
| 📱 Responsive UI | Modern Bootstrap interface with mobile-friendly design |
| 🔄 Automatic Fallback | Works even without IBM API credentials using local reasoning |
| 🇮🇳 India-Focused | Designed around common scams affecting Indian users |

---

# 📁 Project Structure

```
AI-ScamShield/
│
├── app.py                    # Flask Backend & API Routes
├── requirements.txt          # Python Dependencies
├── knowledge_base.py         # Cybersecurity Knowledge Base
├── scam_engine.py            # Scam Detection Engine
├── watsonx_client.py         # IBM watsonx.ai Integration
├── README.md
├── .env.example
├── .gitignore
│
├── templates/
│   └── index.html            # Frontend
│
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

# 🚀 Quick Start

## Prerequisites

- Python 3.10+
- IBM Cloud Account (Optional)
- IBM watsonx.ai Project (Optional)

---

## 1. Clone Repository

```bash
git clone https://github.com/ubbushaik8-rgb/AI-ScamShield.git

cd AI-ScamShield
```

---

## 2. Create Virtual Environment

### Windows

```bash
python -m venv venv

venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv

source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure IBM watsonx.ai (Optional)

Create a **.env** file.

```env
WATSONX_API_KEY=your_api_key

WATSONX_PROJECT_ID=your_project_id

WATSONX_URL=https://us-south.ml.cloud.ibm.com

SECRET_KEY=your_secret_key
```

If these variables are omitted, the application automatically switches to **Local Reasoning Mode**.

---

## 5. Run the Application

```bash
python app.py
```

Open

```
http://localhost:5000
```

---

# 🤖 IBM Granite Integration

The application supports IBM Granite models via **watsonx.ai**.

When configured, IBM Granite is used for:

- AI Scam Explanations
- Cybersecurity Chat Assistant
- Threat Intelligence Reports

If IBM credentials are unavailable, AI ScamShield automatically uses its built-in deterministic reasoning engine.

---

# 🧠 Agentic Architecture

The application follows a **4-Agent Pipeline**.

### 🕵️ Agent 1 – Scam Type Classifier

Detects scam category.

Examples:

- Phishing Email
- UPI Fraud
- Fake Job Offer
- Lottery Scam
- QR Scam
- Banking Fraud
- Malicious URL

---

### 🔍 Agent 2 – Threat Indicator Analyzer

Analyzes:

- Suspicious URLs
- Urgent Language
- Payment Requests
- OTP Requests
- QR Code Requests
- Fake Domains

Calculates:

- Confidence Score
- Risk Level
- Threat Indicators

---

### 📚 Agent 3 – Knowledge Retrieval

Retrieves cybersecurity information from the built-in knowledge base to support explanations.

---

### 🛡️ Agent 4 – Safety Recommendation Generator

Generates:

- Personalized Safety Tips
- Reporting Authorities
- Cyber Guidance

---

# 📡 API Endpoints

## POST /api/analyze

Analyze suspicious messages.

### Request

```json
{
  "message":"Your bank account is blocked. Click this link immediately.",
  "type":"sms"
}
```

---

## POST /api/chat

Cybersecurity Assistant

---

## POST /api/security-report

Generate professional security report.

---

## GET /api/threat-dashboard

Returns

- Scam Statistics
- Weekly Trends
- Threat Distribution

---

## GET /api/awareness-tips

Returns cybersecurity awareness tips.

---

## GET /api/examples

Returns sample scam messages.

---

# 📊 Dashboard Features

- Total Scans
- Scams Detected
- UPI Fraud Statistics
- Phishing Statistics
- Weekly Threat Trends
- Scam Distribution Chart
- Risk Level Breakdown

---

# 🛠 Technologies Used

### Backend

- Python
- Flask

### Frontend

- HTML5
- CSS3
- Bootstrap 5
- JavaScript

### AI

- IBM watsonx.ai
- IBM Granite Models

### Knowledge

- Rule-Based Detection
- RAG-inspired Knowledge Retrieval

---

# 🌐 Deployment

## Local

```bash
python app.py
```

---

## Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn","-w","2","-b","0.0.0.0:5000","app:app"]
```

---

# 🔐 Supported Scam Types

- Phishing Emails
- UPI Fraud
- Banking Fraud
- Fake Job Offers
- Lottery Scams
- QR Code Scams
- OTP Scams
- WhatsApp Scams
- Malicious URLs

---

# 🛠 Troubleshooting

| Issue | Solution |
|---------|----------|
| Flask not found | `pip install -r requirements.txt` |
| IBM credentials missing | App automatically switches to Local Mode |
| Module import error | Verify Python version and install dependencies |
| Port 5000 already in use | Change PORT environment variable |

---

# 📜 License

MIT License

---

# 👨‍💻 Author

**Shaik Ubedulla**

GitHub: https://github.com/ubbushaik8-rgb

Email: ubbushaik8@gmail.com

---

⭐ If you found this project useful, consider giving it a **Star** on GitHub.
