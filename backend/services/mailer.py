"""
ZeptoMail Batch Email Sender.

Sends emails with PDF attachments via the ZeptoMail API.
Each batch handles up to 50 recipients with individual attachments.
"""

import base64
import httpx
from typing import List, Dict, Any, Tuple

ZEPTOMAIL_API_URL = "https://api.zeptomail.com/v1.1/email"
ZEPTOMAIL_BATCH_URL = "https://api.zeptomail.com/v1.1/email/batch"


async def send_single_email(
    token: str,
    sender_email: str,
    sender_name: str,
    recipient_email: str,
    recipient_name: str,
    subject: str,
    body: str,
    pdf_bytes: bytes,
    filename: str = "Certificate.pdf",
    is_html: bool = False,
) -> Tuple[bool, str]:
    """
    Send a single email with a PDF attachment via ZeptoMail.
    Returns (success: bool, error_message: str).
    """
    payload = {
        "from": {"address": sender_email, "name": sender_name},
        "to": [
            {
                "email_address": {
                    "address": recipient_email,
                    "name": recipient_name,
                }
            }
        ],
        "subject": subject,
        "htmlbody": body if is_html else f"<div style='font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6'>{body.replace(chr(10), '<br>')}</div>",
        "attachments": [
            {
                "content": base64.b64encode(pdf_bytes).decode("utf-8"),
                "mime_type": "application/pdf",
                "name": filename,
            }
        ],
    }

    headers = {
        "Authorization": f"Zoho-enczapikey {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                ZEPTOMAIL_API_URL, json=payload, headers=headers
            )
            if resp.status_code in (200, 201):
                return True, ""
            else:
                return False, f"HTTP {resp.status_code}: {resp.text}"
    except Exception as e:
        return False, str(e)


async def send_batch(
    token: str,
    sender_email: str,
    sender_name: str,
    recipients: List[Dict[str, Any]],
    subject: str,
    body: str,
    is_html: bool = False,
) -> List[Dict[str, Any]]:
    """
    Send a batch of emails. Each recipient dict must contain:
      - name: str
      - email: str
      - pdf_bytes: bytes

    Since ZeptoMail batch API sends the same content to all recipients,
    but we need individual attachments per recipient, we send them
    individually within the batch window.

    Returns list of {email, name, success, error} dicts.
    """
    results = []

    for r in recipients:
        success, error = await send_single_email(
            token=token,
            sender_email=sender_email,
            sender_name=sender_name,
            recipient_email=r["email"],
            recipient_name=r["name"],
            subject=subject,
            body=body,
            pdf_bytes=r["pdf_bytes"],
            filename=f"{r['name']}_Certificate.pdf",
            is_html=is_html,
        )
        results.append(
            {
                "email": r["email"],
                "name": r["name"],
                "success": success,
                "error": error,
            }
        )

    return results
