# CertFlow - Quick Start Guide

## What's New: Multi-Placeholder Certificates

You can now add **multiple text fields** to your certificates with **independent styling** and **auto-populated from your CSV**.

## Step-by-Step Workflow

### 1️⃣ Upload Your Certificate Template

- Click **"Upload certificate template"** in the Template section
- Upload JPG/PNG image(s) - single page or multiple pages
- Supports landscape, portrait, any resolution

### 2️⃣ Add Placeholders

- In the **Placeholder Manager**, click **"+ Add Field"**
- Select field from dropdown:
  - **Common**: name, email, date, company, title, id, score
  - **Custom**: Any column from your CSV
- Click **"Add"**
- Repeat for each field you want on the certificate

### 3️⃣ Position Each Placeholder

- Click on a placeholder in the canvas to select it
- Drag it to the desired position
- Use the controls on the right to adjust:
  - **Size**: Font size (10-500px)
  - **Color**: Text color picker
  - **Align**: Left / Center / Right
  - **Bold**: Toggle bold text
  - **Font**: Roboto, Cinzel, Playfair Display, or Montserrat
  - **Effect**: None, Drop shadow, White outline, Black outline, Gold glow

**Tip**: Position shows X%, Y% coordinates. Try common positions:
- Header text: 50%, 15%
- Name: 50%, 40%
- Date: 50%, 70%
- Footer: 50%, 90%

### 4️⃣ Upload Your Recipients CSV

- Required columns: **name**, **email**
- Optional columns: any other data you want on certificates
- Format:
  ```
  name,email,date,company
  John Doe,john@example.com,2026-06-01,Acme Corp
  Jane Smith,jane@example.com,2026-06-02,Tech Inc
  ```

### 5️⃣ Preview Certificates

- Click **"Generate"** to see sample certificates
- Preview shows actual recipient data in all placeholders
- Scroll through samples to verify styling and positioning
- Adjust any placeholder as needed

### 6️⃣ Send Certificates

**If you're an admin:**
- Click **"Start campaign"** or **"Start test"**
- Campaign runs in background
- Watch progress bar in real-time

**If you're a worker:**
- Click **"Submit for approval"**
- Admin will review and approve
- You'll be notified when complete

## Common Questions

**Q: Can I position text differently on each page?**
✅ Yes! Each page of your multi-page template is independent.

**Q: What if my CSV has extra columns I don't want on the certificate?**
✅ Just don't add those fields as placeholders. Only added fields appear.

**Q: Can I add custom data not in the CSV?**
❌ No, all placeholder data must come from your CSV.

**Q: What happens if a recipient is missing a field?**
❌ That field won't appear on their certificate. Ensure all data is complete.

**Q: Can I use the same field twice?**
✅ Yes! Add {{name}} twice if you want the recipient's name in two places.

**Q: How do I preview before sending to all recipients?**
Use **"Quick test"** to send one certificate to the admin email.

## Styling Guide

### Fonts
- **Roboto**: Clean, modern, professional (default)
- **Cinzel**: Elegant, formal, serif
- **Playfair Display**: Luxury, high-end, serif
- **Montserrat**: Bold, geometric, modern

### Effects
- **None**: Plain text (fastest, most readable)
- **Drop shadow**: Text with dark shadow behind
- **White outline**: White stroke around text
- **Black outline**: Black stroke around text  
- **Gold glow**: Gold shadow for prestigious look

### Color Tips
- Dark text on light background for readability
- Use contrast: white text on dark image, dark text on light image
- Professional colors: #000000 (black), #1a3a52 (dark blue), #6b4423 (brown)
- Gold accents: #d4af37

## Troubleshooting

**Problem: Text is cut off**
- ✅ Make font size smaller
- ✅ Move text closer to center
- ✅ Check text_align setting

**Problem: Field doesn't show on certificate**
- ✅ Check CSV has that column (case doesn't matter)
- ✅ Verify placeholder position isn't outside image bounds
- ✅ Ensure field value is in the CSV row

**Problem: Font looks wrong**
- ✅ Try different font family
- ✅ Check if bold is enabled (may not suit all fonts)
- ✅ Reduce font size if overlapping

**Problem: Preview looks good but PDF output is different**
- ✅ Check image resolution (higher res = better quality)
- ✅ Preview is JPEG, output is PDF - slight color difference normal
- ✅ Test with actual recipient data, not preview sample

## Examples

### Example 1: Professional Certificate
```
Template: A4 certificate with blue header
Placeholders:
- {{name}} at 50%, 35% (Playfair Display, 64px, #1a3a52, bold)
- {{company}} at 50%, 50% (Roboto, 32px, #4a4a4a)
- {{date}} at 50%, 75% (Roboto, 24px, #999999)
```

### Example 2: Course Completion
```
Template: Landscape certificate
Placeholders:
- {{name}} at 50%, 40% (Cinzel, 56px, #000000)
- {{course_name}} at 50%, 55% (Roboto, 36px, #333333)
- {{completion_date}} at 20%, 80% (Roboto, 20px, #666666)
- {{certificate_id}} at 80%, 80% (Roboto, 14px, #999999)
```

### Example 3: Award Certificate
```
Template: Portrait certificate with gold accents
Placeholders:
- {{recipient}} at 50%, 35% (Playfair Display, 72px, #d4af37, gold-glow)
- {{achievement}} at 50%, 50% (Cinzel, 44px, #2c3e50)
- {{date}} at 50%, 70% (Montserrat, 24px, #555555)
```

## Pro Tips

1. **Test first**: Always use "Quick test" before sending to all recipients
2. **Backup data**: Save your CSV in multiple locations
3. **High resolution**: Use 300 DPI images for best PDF quality
4. **Centered layout**: 50% X, 50% Y is usually safe for center
5. **Font pairing**: Serif (Cinzel, Playfair) with sans-serif (Roboto, Montserrat) looks professional
6. **Whitespace**: Leave margins - don't position text at 0% or 100%
7. **Batch testing**: Create test CSV with 3-5 realistic entries to verify

## System Requirements

- **Browser**: Chrome, Firefox, Safari, Edge (latest)
- **CSV format**: .csv with UTF-8 encoding
- **Image format**: .jpg, .jpeg, .png
- **Image size**: No limit, but 300 DPI recommended for quality
- **CSV size**: Up to 10,000 recipients (tested)

## Support

- **Documentation**: See FEATURES.md and IMPLEMENTATION_GUIDE.md
- **API**: Backend API runs on `http://localhost:8000/docs`
- **Logs**: Check browser console (F12) for errors

---

**Ready to create professional certificates?**

Start with step 1: Upload your template! 🚀

Version 2.0.0 | Last Updated: 2026-06-17
