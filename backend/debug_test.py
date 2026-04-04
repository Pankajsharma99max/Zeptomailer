import asyncio
from services.mailer import send_single_email
from config import get_settings

async def main():
    settings = get_settings()
    success, error = await send_single_email(
        token=settings.ZEPTOMAIL_TOKEN,
        sender_email=settings.SENDER_EMAIL,
        sender_name=settings.SENDER_NAME,
        recipient_email="test@example.com",
        recipient_name="Test User",
        subject="Test ZeptoMail Integration",
        body="This is a test ensuring the ZeptoMail API token is valid."
    )
    with open("mail_debug.txt", "w") as f:
        f.write(f"Success: {success}, Error: {repr(error)}")

asyncio.run(main())
