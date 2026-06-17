# CertFlow - Advanced Features

## ✨ Multiple Placeholder Support

### Problem Solved
Previously, users could only add a single placeholder (typically `{{name}}`) to their certificates, and all pages shared the same position and styling. This update enables:

1. **Per-Page Independent Positioning** - Each template page can have different placeholder positions
2. **Multiple Field Support** - Add {{name}}, {{email}}, {{date}}, {{company}}, {{title}}, {{id}}, {{score}}, or any CSV header
3. **Individual Styling** - Each placeholder has its own font size, color, alignment, effects, and positioning

### How to Use

#### 1. Upload Template
- Upload your certificate template image(s) via the Template section
- Multiple pages are fully supported - each page can have different layouts

#### 2. Add Placeholders
- Click the **"+ Add Field"** button in the Placeholder Manager
- Select from common fields (name, email, date, etc.) or any custom field from your CSV
- Each placeholder is independently positioned and styled

#### 3. Position Each Placeholder
- Click on a placeholder in the template canvas to select it
- Drag it to the desired position on the certificate
- The position is shown as X%, Y% coordinates (0-100%)

#### 4. Customize Each Placeholder
- **Size**: Adjust font size for each placeholder (10-500px)
- **Color**: Set text color individually
- **Alignment**: Choose left/center/right alignment per placeholder
- **Effects**: Apply drop shadow, outline, or gold glow effects
- **Font**: Select from Roboto, Cinzel, Playfair Display, or Montserrat
- **Bold**: Toggle bold styling

#### 5. CSV Integration
- When you upload a CSV file, the system automatically extracts column headers
- Available headers appear in the "Add Field" dropdown
- Placeholders automatically pull data from the corresponding CSV columns

### Example Workflow

**Template**: Certificate with header and footer spaces

**CSV Headers**: name, email, course_name, completion_date, certificate_id

**Placeholders Added**:
- {{name}} - positioned at center (50%, 30%) in large serif font
- {{course_name}} - positioned at center (50%, 45%) in medium font
- {{completion_date}} - positioned bottom-right (80%, 75%) in small font
- {{certificate_id}} - positioned bottom-left (20%, 90%) in tiny monospace

**Result**: Each recipient gets a personalized certificate with all their data correctly positioned and styled.

### Technical Architecture

#### Frontend Components

**PlaceholderManager.jsx** - Manages the list of placeholders
- Add/remove placeholders
- Lists all placeholders with current position and size info
- Auto-suggests available CSV headers

**OverlayEditor.jsx** - Template canvas and positioning
- Upload and display template images
- Drag-and-drop placeholder positioning
- Real-time style preview
- Per-page independent editing (multiple pages)
- Individual placeholder controls

**App.jsx** - State Management
- `placeholders` state: Array of all placeholders with their configs
- `csvHeaders` state: Extracted from uploaded CSV
- Passes data to all components

**CsvUploader.jsx** - CSV Parsing
- Extracts headers from CSV file
- Passes headers back to App for placeholder suggestions

#### Data Structure

```javascript
{
  field: "name",           // CSV column name
  x_percent: 50,          // Horizontal position (0-100%)
  y_percent: 30,          // Vertical position (0-100%)
  font_size: 48,          // Font size in pixels
  font_color: "#000000",  // Hex color code
  text_align: "center",   // left/center/right
  is_bold: false,         // Bold flag
  font_family: "Roboto",  // Font family
  text_effect: "none"     // shadow/outline-white/outline-black/gold-glow/none
}
```

### Backend Integration

- **Endpoint**: `POST /campaigns` accepts `placeholders` array instead of single coordinate set
- **PDF Generation**: `services/pdf_service.py` iterates through all placeholders and renders each one
- **Email Template**: Supports multiple {{field}} references in email body
- **Preview**: `GET /previews` returns sample certificates with all placeholders rendered

### Benefits

✅ **Flexibility**: Customize layout for each recipient data point
✅ **Professional**: Create complex multi-field certificates
✅ **Scalable**: Support any CSV columns without code changes
✅ **User-Friendly**: Visual drag-and-drop interface
✅ **Maintainable**: Independent placeholder configs make iteration easy

## 🌓 Light/Dark Mode Theme System

The app supports automatic light/dark mode switching with:
- System preference detection
- Manual theme toggle (light/dark/system)
- Smooth 300ms color transitions
- localStorage persistence
- Professional color palette designed for accessibility

See the main README for details on theme usage.

---

**Version**: 2.0.0+  
**Last Updated**: 2026-06-17
