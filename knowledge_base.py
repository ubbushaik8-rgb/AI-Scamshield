"""
AI ScamShield — Built-in Cybersecurity Knowledge Base
IBM Build on IBM (BOB) Hackathon

This module acts as the local knowledge store for Agent 3 (RAG Knowledge
Retrieval). In production this would be embedded into a vector store
(e.g. ChromaDB) and queried via IBM watsonx.ai embeddings; here it is
a lightweight keyword-scored retriever so the whole app runs with zero
external dependencies. If WATSONX credentials are configured, the raw
documents below are still used as the grounding context that gets
passed to the Granite model — this file IS the "RAG" corpus either way.
"""

KNOWLEDGE_DOCS = [
    {
        "id": "rbi-otp",
        "source": "RBI Cybersecurity Guidelines",
        "tags": ["banking", "otp", "rbi", "bank", "account", "kyc"],
        "text": (
            "The Reserve Bank of India advises that banks and their staff will NEVER "
            "call, SMS, or email customers asking for OTP, CVV, UPI PIN, or net-banking "
            "passwords. Any message demanding urgent 'KYC update' or threatening account "
            "suspension unless you click a link or share an OTP is a strong indicator of "
            "banking fraud. Genuine banks direct customers to visit a branch or use the "
            "official app for KYC, and never ask for credentials over phone/SMS/WhatsApp."
        ),
    },
    {
        "id": "certin-phishing",
        "source": "CERT-In Threat Advisories",
        "tags": ["phishing", "email", "malware", "link", "attachment"],
        "text": (
            "CERT-In (Indian Computer Emergency Response Team) advisories describe "
            "phishing emails as commonly using urgency ('act within 24 hours'), "
            "generic greetings ('Dear Customer'), spoofed sender domains that closely "
            "resemble a legitimate brand (e.g. using extra letters, hyphens or the wrong "
            "top-level domain), and links that lead to credential-harvesting pages. "
            "Attachments with .exe, .scr, .js, or macro-enabled Office files are frequent "
            "malware delivery vectors and should never be opened from unsolicited mail."
        ),
    },
    {
        "id": "owasp-web",
        "source": "OWASP Top 10",
        "tags": ["url", "website", "web", "link", "malicious"],
        "text": (
            "OWASP guidance notes that malicious URLs frequently use lookalike domains, "
            "IP-address links, excessive subdomains, or URL shorteners to disguise the "
            "true destination. A legitimate organisation's login page will use its "
            "verified primary domain over HTTPS; redirects through unrelated domains or "
            "domains registered very recently are red flags consistent with phishing "
            "infrastructure."
        ),
    },
    {
        "id": "nist-csf",
        "source": "NIST Cybersecurity Framework 2.0",
        "tags": ["framework", "risk", "general", "cyber", "safety"],
        "text": (
            "NIST's Identify-Protect-Detect-Respond-Recover model recommends verifying "
            "the identity of a requester through an independent channel before acting on "
            "any request involving money, credentials, or personal data, especially when "
            "the request creates a sense of urgency or fear."
        ),
    },
    {
        "id": "npci-upi",
        "source": "NPCI / UPI Safety Guidelines",
        "tags": ["upi", "payment", "collect", "gpay", "phonepe", "paytm", "qr"],
        "text": (
            "NPCI guidance clarifies that a UPI 'collect request' is a request FOR money "
            "to be sent TO the requester — entering your UPI PIN on a collect request "
            "always results in you losing money, never receiving it. Genuine refunds, "
            "cashback, or prize money are never collected by scanning a QR code or "
            "approving a collect request; scammers frequently disguise payment requests "
            "as 'refund' or 'cashback' approvals to trick victims into authorising an "
            "outgoing payment."
        ),
    },
    {
        "id": "google-safe-browsing",
        "source": "Google Safe Browsing",
        "tags": ["url", "https", "browsing", "site", "domain"],
        "text": (
            "Google Safe Browsing standards flag sites that request credentials over "
            "unencrypted HTTP, use domains unrelated to the brand they impersonate, or "
            "were registered within the past few weeks as high risk. Users are advised "
            "to check the address bar domain carefully character-by-character before "
            "entering any login details."
        ),
    },
    {
        "id": "job-scam",
        "source": "Cyber Crime Portal Advisory — Employment Fraud",
        "tags": ["job", "employment", "work from home", "salary", "offer", "hiring"],
        "text": (
            "India's National Cybercrime Reporting Portal warns that fake job offers "
            "typically promise unrealistically high pay for minimal work, are offered "
            "without a formal interview, and ask the candidate to pay a 'registration', "
            "'training', or 'security deposit' fee upfront, or to complete suspicious "
            "'task-based' assignments involving cryptocurrency deposits. Legitimate "
            "employers never require a candidate to pay money to receive a job."
        ),
    },
    {
        "id": "lottery-scam",
        "source": "Cyber Crime Portal Advisory — Lottery & Prize Fraud",
        "tags": ["lottery", "prize", "winner", "lucky draw", "claim"],
        "text": (
            "Lottery and prize scams inform the victim they have won a contest they "
            "never entered, then request an upfront 'processing fee', 'customs duty', "
            "or 'tax payment' before the prize can be released. No genuine lottery or "
            "contest requires the winner to pay money to receive winnings."
        ),
    },
    {
        "id": "whatsapp-scam",
        "source": "CERT-In Advisory — Messaging App Fraud",
        "tags": ["whatsapp", "sms", "smishing", "message", "chat"],
        "text": (
            "Common WhatsApp/SMS scam patterns include messages from unknown numbers "
            "claiming to be a relative in distress, fake delivery notifications with "
            "tracking links, investment 'trading group' invitations promising guaranteed "
            "returns, and part-time job offers requesting 'task' payments. Scammers "
            "increasingly use spoofed profile photos and cloned business accounts to "
            "appear legitimate."
        ),
    },
    {
        "id": "report-authorities",
        "source": "Reporting Authorities Reference",
        "tags": ["report", "helpline", "complaint", "authority"],
        "text": (
            "Cyber fraud in India can be reported via the National Cyber Crime Helpline "
            "(1930), the National Cybercrime Reporting Portal (cybercrime.gov.in), "
            "CERT-In (incident@cert-in.org.in) for technical incidents, and the RBI "
            "Ombudsman (cms.rbi.org.in) for banking-related fraud complaints."
        ),
    },
]


def retrieve_knowledge(message: str, scam_type: str = "", top_k: int = 3):
    """
    Very small keyword-overlap retriever standing in for a vector-store
    similarity search. Scores each doc by tag/keyword hits in the message
    (plus a boost if the doc's tags relate to the classified scam_type),
    and returns the top_k most relevant documents.
    """
    text = (message or "").lower()
    scored = []
    for doc in KNOWLEDGE_DOCS:
        score = 0
        for tag in doc["tags"]:
            if tag in text:
                score += 2
            if scam_type and tag in scam_type.lower():
                score += 3
        if score > 0:
            scored.append((score, doc))

    if not scored:
        # Fallback: general guidance docs
        scored = [(1, d) for d in KNOWLEDGE_DOCS if d["id"] in ("nist-csf", "report-authorities")]

    scored.sort(key=lambda x: x[0], reverse=True)
    top_docs = [d for _, d in scored[:top_k]]
    combined_text = " ".join(f"[{d['source']}] {d['text']}" for d in top_docs)
    return {
        "documents": top_docs,
        "combined_text": combined_text,
    }
