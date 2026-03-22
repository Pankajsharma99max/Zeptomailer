import httpx
import io
import asyncio
from PIL import Image

async def main():
    print("Creating dummy image...")
    # 1. Create dummy image
    img = Image.new('RGB', (800, 600), color='white')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()

    async with httpx.AsyncClient() as client:
        print("Uploading template...")
        # 2. Upload template
        res_img = await client.post('http://localhost:8000/api/upload/template', files={'file': ('test.png', img_bytes, 'image/png')})
        print('Template:', res_img.json())

        print("Uploading CSV...")
        # 3. Create dummy CSV
        csv_content = b'name,email\nTest User,test@devnovate.co\n'
        res_csv = await client.post('http://localhost:8000/api/upload/csv', files={'file': ('test.csv', csv_content, 'text/csv')})
        print('CSV:', res_csv.json())

        print("Starting campaign...")
        # 4. Start campaign
        payload = {
            'x_percent': 50,
            'y_percent': 50,
            'font_size': 48,
            'font_color': '#000000',
            'text_align': 'center',
            'email_subject': 'Test Subject',
            'email_body': 'Test Body',
            'is_html': False,
            'test_mode': False
        }
        res_start = await client.post('http://localhost:8000/api/campaign/start', json=payload)
        print('Start:', res_start.json())

if __name__ == "__main__":
    asyncio.run(main())
