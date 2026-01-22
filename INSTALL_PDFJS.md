# PDF.js Installation Instructions

The extension uses pdf.js for PDF text extraction. There are two ways to set it up:

## Option 1: Using CDN (Easier - Already Configured)

The extension is configured to use pdf.js from a CDN. This should work automatically, but if you encounter CSP (Content Security Policy) errors, use Option 2.

## Option 2: Download PDF.js Locally (Recommended for Chrome Extensions)

1. Download pdf.js from: https://github.com/mozilla/pdf.js/releases
   - Download the "generic-legacy" build for browsers
   - Extract the zip file

2. Copy the following files to the `lib/` folder:
   - `pdf.min.js` → `lib/pdf.min.js`
   - `pdf.worker.min.js` → `lib/pdf.worker.min.js`

3. Update `popup.html`:
   - Change: `<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js">`
   - To: `<script src="lib/pdf.min.js"></script>`

4. Update `popup.js` in the `extractTextFromPDF` function:
   - Change: `pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';`
   - To: `pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');`

5. Update `manifest.json` to include the worker file:
   ```json
   "web_accessible_resources": [
     {
       "resources": ["lib/pdf.worker.min.js"],
       "matches": ["<all_urls>"]
     }
   ]
   ```

## Quick Download Script

You can use this command to download pdf.js automatically:

```bash
cd lib
wget https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js
wget https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js
```

Then update the paths as described in Option 2.

