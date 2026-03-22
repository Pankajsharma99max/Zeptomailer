"""
ZeptoMail Batch Email Sender.

Sends emails with PDF attachments via the ZeptoMail API.
Uses asyncio for concurrent sending within batches and yields results in real-time.
"""

import asyncio
import base64
import logging
import httpx
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

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
                logger.debug("Email sent to %s <%s>", recipient_name, recipient_email)
                return True, ""
            else:
                error_msg = f"HTTP {resp.status_code}: {resp.text}"
                logger.error("ZeptoMail API error for %s <%s>: %s", recipient_name, recipient_email, error_msg)
                return False, error_msg
    except Exception as e:
        logger.error("Email send exception for %s <%s>: %s", recipient_name, recipient_email, e)
        return False, str(e)


async def send_batch(
    token: str,
    sender_email: str,
    sender_name: str,
    recipients: List[Dict[str, Any]],
    subject: str,
    body: str,
    is_html: bool = False,
):
    """
    Send a batch of emails concurrently. Each recipient dict must contain:
      - name: str
      - email: str
      - pdf_bytes: bytes

    Yields {email, name, success, error} dicts as they complete in real-time.
    """
    async def _send_task(r: Dict[str, Any]) -> Dict[str, Any]:
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
        return {
            "email": r["email"],
            "name": r["name"],
            "success": success,
            "error": error,
        }

    tasks = [_send_task(r) for r in recipients]
    for coro in asyncio.as_completed(tasks):
        result = await coro
        yield result

