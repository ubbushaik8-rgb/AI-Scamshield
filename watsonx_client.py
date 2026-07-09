"""
AI ScamShield — IBM watsonx.ai / Granite Client
IBM Build on IBM (BOB) Hackathon

Thin wrapper around the IBM watsonx.ai text-generation REST API.

Configure via environment variables to enable real Granite calls:

    WATSONX_API_KEY      IBM Cloud API key
    WATSONX_PROJECT_ID   watsonx.ai project ID
    WATSONX_URL          Regional endpoint, e.g. https://us-south.ml.cloud.ibm.com
    WATSONX_MODEL_ID     Defaults to "ibm/granite-3-8b-instruct"

If these are not set, `is_configured()` returns False and app.py falls
back to the local rule-based engine (knowledge_base.py + scam_engine.py)
so the product is always fully functional, with or without live IBM
credentials.

Docs: https://cloud.ibm.com/apidocs/watsonx-ai
"""

import os
import time
import requests

WATSONX_API_KEY = os.environ.get("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.environ.get("WATSONX_PROJECT_ID", "")
WATSONX_URL = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WATSONX_MODEL_ID = os.environ.get("WATSONX_MODEL_ID", "ibm/granite-3-8b-instruct")
IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token"

_token_cache = {"token": None, "expires_at": 0}


def is_configured() -> bool:
    return bool(WATSONX_API_KEY and WATSONX_PROJECT_ID)


def _get_iam_token() -> str:
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    resp = requests.post(
        IAM_TOKEN_URL,
        data={
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": WATSONX_API_KEY,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600)
    return _token_cache["token"]


def generate(prompt: str, max_new_tokens: int = 400, temperature: float = 0.4) -> str:
    """
    Calls IBM watsonx.ai's text generation endpoint with the Granite model.
    Raises on any failure — callers should catch and fall back to local logic.
    """
    if not is_configured():
        raise RuntimeError("watsonx.ai is not configured (missing WATSONX_API_KEY / WATSONX_PROJECT_ID).")

    token = _get_iam_token()
    endpoint = f"{WATSONX_URL}/ml/v1/text/generation?version=2024-05-01"

    payload = {
        "model_id": WATSONX_MODEL_ID,
        "project_id": WATSONX_PROJECT_ID,
        "input": prompt,
        "parameters": {
            "decoding_method": "greedy" if temperature == 0 else "sample",
            "max_new_tokens": max_new_tokens,
            "temperature": temperature,
            "repetition_penalty": 1.1,
        },
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    resp = requests.post(endpoint, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    results = data.get("results", [])
    if not results:
        raise RuntimeError("watsonx.ai returned no results.")
    return results[0].get("generated_text", "").strip()
