import asyncio
from config import get_settings
from services.mailer import send_single_email

async def test():
    settings = get_settings()
    # Dummy PDF
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n"
    
    success, error = await send_single_email(
        token=settings.ZEPTOMAIL_TOKEN,
        sender_email=settings.SENDER_EMAIL,
        sender_name=settings.SENDER_NAME,
        recipient_email=settings.ADMIN_EMAIL,
        recipient_name="Test User",
        subject="Test ZeptoMail Diagnostics",
        body="This is a test from diagnostic script.",
        pdf_bytes=pdf_bytes,
    )
    
    print(f"SUCCESS: {success}")
    if not success:
        print(f"ERROR: {error}")

if __name__ == "__main__":
    asyncio.run(test())
