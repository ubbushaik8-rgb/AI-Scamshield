"""
AI ScamShield — Core Detection Engine
IBM Build on IBM (BOB) Hackathon

Implements the local (no-API-key-required) reasoning behind three of the
four agents:

    Agent 1 — Scam Type Classifier
    Agent 2 — Threat Indicator Analyzer
    Agent 4 — Safety Advice Generator

Agent 3 (RAG Knowledge Retrieval) lives in knowledge_base.py.

Each function here is intentionally rule/heuristic based so the product
works fully offline and deterministically. When WATSONX credentials are
configured (see watsonx_client.py), app.py asks Granite to turn this
structured signal into the natural-language "explanation" and chat
replies — the heuristics below decide WHAT happened, Granite (when
available) explains WHY in fluent prose.
"""

import re

# ── Pattern libraries ────────────────────────────────────────────────────

URGENCY_WORDS = [
    "urgent", "immediately", "act now", "expire", "expires", "expired",
    "within 24 hours", "within 12 hours", "final notice", "last chance",
    "suspend", "suspended", "blocked", "block", "deactivat", "verify now",
    "limited time", "action required",
]

CREDENTIAL_REQUEST_WORDS = [
    "otp", "cvv", "pin", "password", "net banking", "netbanking",
    "upi pin", "atm pin", "aadhaar number", "card number", "security code",
]

MONEY_REQUEST_WORDS = [
    "processing fee", "registration fee", "security deposit", "customs duty",
    "advance payment", "pay to claim", "activation fee", "courier charges",
    "unlock your prize", "handling charges", "gst payment", "tax payment",
]

PRIZE_WORDS = [
    "won", "winner", "lottery", "lucky draw", "congratulations", "prize",
    "jackpot", "selected for", "reward",
]

JOB_WORDS = [
    "work from home", "part time job", "part-time job", "daily payout",
    "earn per day", "no experience needed", "hiring immediately",
    "task based job", "data entry job",
]

UPI_WORDS = [
    "upi", "collect request", "gpay", "google pay", "phonepe", "paytm",
    "scan the qr", "scan qr", "receive money", "cashback approval",
]

GENERIC_GREETING = ["dear customer", "dear user", "dear valued customer", "dear sir/madam"]

URL_REGEX = re.compile(r"(https?://[^\s]+|www\.[^\s]+)", re.IGNORECASE)
SHORTENER_DOMAINS = ["bit.ly", "tinyurl", "t.co", "goo.gl", "is.gd", "cutt.ly", "shorturl"]
SUSPICIOUS_TLDS = [".xyz", ".top", ".click", ".gq", ".tk", ".ml", ".cf", ".info", ".loan"]
KNOWN_BRANDS = ["sbi", "hdfc", "icici", "axis", "paytm", "amazon", "flipkart", "irctc", "lic", "rbi"]


def _contains_any(text: str, words) -> list:
    hits = []
    for w in words:
        if w in text:
            hits.append(w)
    return hits


def _analyze_urls(text: str) -> list:
    """Return a list of URL-related red-flag reason strings."""
    reasons = []
    urls = URL_REGEX.findall(text)
    for url in urls:
        low = url.lower()
        if any(s in low for s in SHORTENER_DOMAINS):
            reasons.append(f"Shortened/obfuscated URL detected ({url}) — true destination is hidden.")
        if any(low.endswith(tld) or f"{tld}/" in low for tld in SUSPICIOUS_TLDS):
            reasons.append(f"Suspicious top-level domain in link ({url}).")
        # brand-in-subdomain / lookalike detection
        for brand in KNOWN_BRANDS:
            if brand in low and not re.search(rf"://(www\.)?{brand}\.com", low) and not re.search(rf"://(www\.)?{brand}\.co\.in", low):
                reasons.append(f"Link mimics brand '{brand.upper()}' but does not use its official domain ({url}).")
                break
        if low.startswith("http://"):
            reasons.append(f"Link uses unencrypted HTTP instead of HTTPS ({url}).")
    return reasons


def classify_scam_type(message: str, hint_type: str = "all") -> str:
    """Agent 1 — determine the most likely scam category."""
    text = message.lower()

    if hint_type and hint_type != "all":
        type_map = {
            "email": "Phishing Email",
            "sms": "SMS / Smishing",
            "whatsapp": "WhatsApp Scam",
            "upi": "UPI Fraud",
            "url": "Malicious URL",
            "qr": "QR Code Scam",
            "job": "Fake Job Offer",
        }
        forced = type_map.get(hint_type)
    else:
        forced = None

    scores = {
        "UPI Fraud": len(_contains_any(text, UPI_WORDS)) * 2,
        "Fake Job Offer": len(_contains_any(text, JOB_WORDS)) * 2,
        "Lottery / Prize Scam": len(_contains_any(text, PRIZE_WORDS)) * 2 + len(_contains_any(text, MONEY_REQUEST_WORDS)),
        "Phishing Email": len(_contains_any(text, GENERIC_GREETING)) + len(_contains_any(text, CREDENTIAL_REQUEST_WORDS)),
        "Malicious URL": len(URL_REGEX.findall(text)) * 2 if URL_REGEX.findall(text) else 0,
        "Banking / OTP Fraud": len(_contains_any(text, CREDENTIAL_REQUEST_WORDS)) * 2,
    }

    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]

    if forced:
        # Respect the user's chosen scan-type tab, but still let content override
        # only when the detected signal is much stronger and unambiguous.
        return forced if best_score < 3 else best_type

    if best_score == 0:
        return "No Specific Scam Pattern"
    return best_type


def analyze_indicators(message: str) -> dict:
    """Agent 2 — extract concrete threat indicators and compute a risk score."""
    text = message.lower()
    reasons = []
    score = 0

    urgency_hits = _contains_any(text, URGENCY_WORDS)
    if urgency_hits:
        reasons.append(f"Urgency/pressure language detected: \"{urgency_hits[0]}\".")
        score += 15 * min(len(urgency_hits), 2)

    cred_hits = _contains_any(text, CREDENTIAL_REQUEST_WORDS)
    if cred_hits:
        reasons.append(f"Requests sensitive credentials ({', '.join(cred_hits[:3])}) — legitimate entities never ask for these.")
        score += 25

    money_hits = _contains_any(text, MONEY_REQUEST_WORDS)
    if money_hits:
        reasons.append(f"Requests upfront payment ({money_hits[0]}) to release funds/prize/job — a classic advance-fee fraud pattern.")
        score += 25

    prize_hits = _contains_any(text, PRIZE_WORDS)
    if prize_hits:
        reasons.append("Claims the recipient has won a prize/lottery they likely never entered.")
        score += 15

    job_hits = _contains_any(text, JOB_WORDS)
    if job_hits:
        reasons.append("Unrealistic work-from-home / high daily payout job offer pattern detected.")
        score += 15

    upi_hits = _contains_any(text, UPI_WORDS)
    if upi_hits and ("collect" in text or "receive" in text):
        reasons.append("Frames an outgoing UPI collect-request approval as 'receiving' money — a common UPI scam trick.")
        score += 20

    greeting_hits = _contains_any(text, GENERIC_GREETING)
    if greeting_hits:
        reasons.append("Uses a generic greeting instead of your actual name, typical of mass-sent phishing.")
        score += 10

    url_reasons = _analyze_urls(text)
    if url_reasons:
        reasons.extend(url_reasons)
        score += 15 * min(len(url_reasons), 2)

    # Grammar / formatting heuristic: excessive punctuation or ALL CAPS shouting
    if re.search(r"[A-Z]{6,}", message):
        reasons.append("Excessive capitalisation used to create alarm.")
        score += 5
    if message.count("!") >= 3:
        reasons.append("Excessive exclamation marks — common in scam messaging to induce panic.")
        score += 5

    score = max(0, min(score, 100))
    return {"reasons": reasons, "score": score}


def determine_verdict(score: int):
    """Map a 0-100 risk score to a verdict + risk level."""
    if score >= 60:
        return "SCAM", "HIGH"
    if score >= 35:
        return "SUSPICIOUS", "MEDIUM"
    if score >= 15:
        return "SUSPICIOUS", "LOW"
    return "GENUINE", "SAFE"


SAFETY_TIPS_BY_TYPE = {
    "UPI Fraud": [
        "Never enter your UPI PIN to 'receive' money — a PIN is only ever needed to SEND money.",
        "Verify collect requests carefully; decline any request you did not initiate.",
        "Contact your bank directly using the number on your card, not one from the message.",
    ],
    "Fake Job Offer": [
        "Never pay money — for registration, training, or a 'deposit' — to receive a job.",
        "Verify the company's official careers page and contact HR through official channels.",
        "Be wary of offers with no formal interview and unrealistically high pay.",
    ],
    "Lottery / Prize Scam": [
        "You cannot win a contest you never entered — treat any such message as fraudulent.",
        "Never pay a 'processing fee' or 'tax' to claim a prize.",
        "Do not share personal or banking details with unknown prize notifications.",
    ],
    "Phishing Email": [
        "Do not click links or download attachments from unexpected emails.",
        "Check the sender's actual email domain carefully, not just the display name.",
        "Go directly to the organisation's official website instead of clicking email links.",
    ],
    "Malicious URL": [
        "Do not click the link. Type the organisation's known web address directly instead.",
        "Check for HTTPS and the correct domain spelling before entering any details.",
        "Use a link-scanning tool if you must check where a shortened URL leads.",
    ],
    "Banking / OTP Fraud": [
        "Never share your OTP, CVV, or PIN with anyone — banks never ask for these.",
        "Hang up and call your bank's official helpline if you're unsure.",
        "Enable transaction alerts and report unauthorised debits immediately.",
    ],
    "QR Code Scam": [
        "Scanning a QR code and entering your PIN will SEND money, never receive it.",
        "Only scan QR codes from trusted, verified sources.",
        "Verify the merchant name shown after scanning before authorising any payment.",
    ],
    "WhatsApp Scam": [
        "Verify unknown contacts by calling the person directly on their known number.",
        "Be cautious of investment groups promising guaranteed high returns.",
        "Don't forward suspicious messages — report and block the sender instead.",
    ],
}

DEFAULT_SAFETY_TIPS = [
    "Pause before acting — scammers rely on urgency to short-circuit careful thinking.",
    "Verify any request through an official, independently-sourced contact channel.",
    "Never share OTPs, passwords, or make upfront payments to unknown parties.",
]

REPORT_TO_DEFAULT = [
    "National Cyber Crime Helpline — 1930",
    "National Cybercrime Reporting Portal — cybercrime.gov.in",
]


def safety_tips_for(scam_type: str) -> list:
    return SAFETY_TIPS_BY_TYPE.get(scam_type, DEFAULT_SAFETY_TIPS)


def report_to_for(scam_type: str) -> list:
    extra = []
    if scam_type in ("Banking / OTP Fraud", "UPI Fraud"):
        extra = ["RBI Banking Ombudsman — cms.rbi.org.in"]
    elif scam_type == "Phishing Email":
        extra = ["CERT-In — incident@cert-in.org.in"]
    return REPORT_TO_DEFAULT + extra


def build_explanation_fallback(verdict: str, scam_type: str, reasons: list) -> str:
    """Local, template-based explanation used when watsonx isn't configured."""
    if verdict == "SCAM":
        opening = f"This message shows strong, multiple indicators of a {scam_type.lower()}."
    elif verdict == "SUSPICIOUS":
        opening = f"This message shows some characteristics consistent with a {scam_type.lower()}, though the signal is not conclusive."
    else:
        opening = "This message does not show notable indicators of a scam based on the patterns analysed."

    if reasons:
        body = " Key signals include: " + "; ".join(reasons[:4]) + "."
    else:
        body = " No strong red-flag patterns were detected in the text."

    closing = (
        " Regardless of the verdict, never share OTPs, PINs, or make upfront payments "
        "based on an unsolicited message, and verify independently before acting."
    )
    return opening + body + closing
