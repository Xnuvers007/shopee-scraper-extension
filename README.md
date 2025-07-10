# 🛒 Shopee Scraper Extension

<div align="center">
  <img src="icons/icon128.png" alt="Shopee Scraper Logo" width="120" />
  <h3>Extract Product Data with Ease</h3>
  <p>A powerful and lightweight Chrome extension to scrape product listings from <strong>Shopee.co.id</strong>.</p>
</div>

<p align="center">
  <a href="#-features">✨ Features</a> • 
  <a href="#-installation">🔧 Installation</a> • 
  <a href="#-how-to-use">📝 How to Use</a> • 
  <a href="#-export-formats">📊 Export Formats</a> • 
  <a href="#-screenshots">📸 Screenshots</a> • 
  <a href="#-security">🛡️ Security</a> • 
  <a href="#-license">📄 License</a>
</p>

---

## ✨ Features

- 🔍 **Keyword-based Search** — Easily target products using custom search terms.
- 📊 **Detailed Data Extraction** — Get product names, prices, locations, and URLs.
- 📱 **Paginated Scraping** — Navigate through pages with built-in progress tracking.
- ⏯️ **Pause & Resume Support** — Control your scraping flow at any time.
- 🔄 **Sorting Options** — Sort results based on your chosen attributes.
- 📁 **Multiple Export Formats** — Export to **XLSX**, **PDF**, **JSON**, or **TXT**.
- 🛡️ **Secure & Stable** — Input validation, CSP, and error handling for peace of mind.
- 🚀 **Fast & Lightweight** — Built with performance and simplicity in mind.

---

## 🔧 Installation

### 📦 Method 1: Chrome Web Store
> _Coming Soon_

### 🧰 Method 2: Manual Installation

1. **Download the Extension**
   - Clone or download this repository as a `.zip` file
   - Extract the contents if needed

2. **Load Extension in Chrome**
   - Open `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right corner)
   - Click **Load Unpacked**
   - Select the extracted folder

3. **Verify Installation**
   - Click the extension icon in the toolbar
   - If the popup appears, the installation was successful

---

## 📝 How to Use

### 1. Configure Search

- Enter a **product keyword**
- Set **start page number** (default: 1)
- Optionally set an **end page number**
- Choose **sorting option**
- Select **export format**

### 2. Start Scraping

- Click **"Mulai Scrape"** to begin
- The extension will open Shopee.co.id and start collecting data
- A progress bar will indicate scraping status

### 3. Control the Process

- Click **"Jeda"** to pause
- Click **"Lanjutkan"** to resume from last progress

### 4. View & Export Results

- Upon completion, data is automatically exported
- Find the exported file in your **Downloads** folder

---

## 📊 Export Formats

| Format | Description                      | Best For                                 |
|--------|----------------------------------|------------------------------------------|
| XLSX   | Microsoft Excel format           | Data analysis, spreadsheet manipulation  |
| PDF    | Portable Document Format         | Reporting, easy sharing                  |
| JSON   | JavaScript Object Notation       | Development, data integration            |
| TXT    | Plain text file                  | Lightweight viewing, universal access    |

---

## 📸 Screenshots

<div align="center">
  <p><strong>Extension Interface</strong></p>
  <img src="https://raw.githubusercontent.com/xnuvers007/shopee-scraper-extension/master/screenshots/interface.png" width="320" />

  <p><strong>Scraping in Progress</strong></p>
  <img src="https://raw.githubusercontent.com/xnuvers007/shopee-scraper-extension/master/screenshots/scraping.png" width="320" />

  <p><strong>Excel Export Example</strong></p>
  <img src="https://raw.githubusercontent.com/xnuvers007/shopee-scraper-extension/master/screenshots/excel_export.png" width="720" />
</div>

---

## 🛡️ Security

Shopee Scraper is built with security in mind:

- 🔐 Input sanitization to prevent injection
- ✅ Validated and secure URL building
- 🔒 Content Security Policy (CSP) enforced
- 📁 Safe file handling and controlled downloads
- ⚠️ Error detection and graceful failure recovery

---

## 💻 Technical Details

- Built using **Manifest V3** for Chrome extensions
- Modern **JavaScript (ES6+)** with async/await
- Key libraries:
  - [SheetJS](https://github.com/SheetJS/sheetjs) — Excel export
  - [jsPDF](https://github.com/parallax/jsPDF) — PDF generation
  - [SweetAlert2](https://github.com/sweetalert2/sweetalert2) — Alerts & modals

---

## 🤝 Contributing

We welcome contributions! Here’s how:

1. **Fork** the repo
2. Create your branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for full details.

---

## 🙏 Acknowledgements

- [SheetJS](https://sheetjs.com/) for Excel functionality
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
- [SweetAlert2](https://sweetalert2.github.io/) for UI dialogs
- All amazing [contributors](https://github.com/Xnuvers007/shopee-scraper-extension/graphs/contributors)

---

<div align="center">
  <p>Developed with ❤️ by <a href="https://github.com/Xnuvers007">Xnuvers007</a></p>
</div>
