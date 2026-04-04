import asyncio
from services.campaign_runner import run_campaign, campaign_state
from models import CampaignConfig, Recipient

async def test_run():
    config = CampaignConfig(
        email_subject="Test",
        email_body="test",
        is_html=False,
        test_mode=True,
        x_percent=50,
        y_percent=50,
        font_size=50,
        font_color="black",
        text_align="center",
        start_index=0,
        email_only=True
    )
    await run_campaign([Recipient(name="Test User", email="some@email.com")], b"", config, None)
    print("FAILED LIST:", campaign_state.failed_list)

asyncio.run(test_run())
