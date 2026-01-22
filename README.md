# Resume ATS Scorer & Cover Letter Generator Chrome Extension

A comprehensive Chrome extension for resume analysis, ATS scoring, job matching, and AI-powered cover letter generation using OpenAI's GPT models.

## Features

1. **ATS Resume Scoring**
   - Upload PDF resume
   - Get ATS score (0-100) with detailed feedback
   - Identifies strengths and areas for improvement

2. **Job Posting Match Analysis**
   - Analyze current webpage for job postings
   - Calculate match percentage between resume and job posting
   - Get matched/missing skills and recommendations

3. **Resume Analysis & Improvements**
   - Get detailed improvement suggestions by section
   - Download improved sections as PDF

4. **AI Cover Letter Generator**
   - Generate personalized cover letters based on resume + job posting
   - Support for custom theme/format (upload sample cover letter)
   - Download generated cover letter as PDF

5. **Dark/Light Theme**
   - Beautiful dark theme (default)
   - Light theme option
   - Theme preference saved

## Installation

### Step 1: Generate Icons (First Time Only)

The extension needs icon files. Placeholder icons are included, but for better appearance:

1. Open `create_icons.html` in your browser
2. Click the download buttons for each icon size (16x16, 48x48, 128x128)
3. Save the downloaded PNG files to the `icons/` folder, replacing the placeholder files

Alternatively, you can create custom icons manually as PNG files:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)  
- `icons/icon128.png` (128x128 pixels)

### Step 2: Load Extension

#### Option 1: Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension directory (`session1`)
5. The extension should now appear in your extensions list

#### Option 2: Package Extension

1. In `chrome://extensions/`, click "Pack extension"
2. Select the extension directory
3. Install the generated `.crx` file

## Setup

1. **Get OpenAI API Key**
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Navigate to API Keys section
   - Create a new API key (starts with `sk-`)

2. **Configure Extension**
   - Click the extension icon in Chrome toolbar
   - Enter your OpenAI API key
   - Click "Save"
   - Your API key is stored locally and never shared

## Usage

### ATS Resume Scoring

1. Click the extension icon
2. Upload your resume PDF (drag & drop or click to select)
3. ATS score will be calculated automatically
4. View score, feedback, strengths, and improvements

### Job Posting Match

1. Navigate to a job posting page (LinkedIn, Indeed, company website, etc.)
2. Click the extension icon
3. Click "Analyze Current Page for Job Posting"
4. View match percentage and detailed analysis

### Resume Analysis

1. Upload your resume (if not already uploaded)
2. Click "Analyze Resume for Improvements"
3. Review suggestions by section
4. Download improved sections as PDF

### Cover Letter Generation

1. Upload your resume
2. Analyze a job posting (see above)
3. (Optional) Upload a sample cover letter to match its format
4. Click "Generate Cover Letter"
5. Review and download as PDF

## Requirements

- Chrome browser (latest version recommended)
- OpenAI API key with access to GPT-4 or GPT-4o models
- Internet connection (for API calls)

## File Structure

```
session1/
├── manifest.json          # Extension manifest
├── popup.html            # Main UI
├── popup.css             # Styles with dark/light theme
├── popup.js              # Main functionality
├── background.js         # Service worker
├── content.js            # Content script for job posting detection
├── utils.js              # Utility functions
├── icons/                # Extension icons
└── README.md            # This file
```

## Notes

- **PDF Extraction**: The extension attempts to extract text from PDFs. For better results, you may need to integrate a PDF parsing library like pdf.js. Currently, it uses a fallback method.

- **API Costs**: This extension uses OpenAI's API, which incurs costs based on usage. Monitor your API usage at [OpenAI Dashboard](https://platform.openai.com/usage).

- **Privacy**: All data processing happens through OpenAI's API. Your resume text and API key are stored locally in Chrome's storage and never sent to third parties (except OpenAI for processing).

- **Job Posting Detection**: The extension uses heuristics to detect job postings. It may not work perfectly on all websites. For best results, ensure you're on a job posting page.

## Troubleshooting

- **PDF not extracting text**: Some PDFs use images or complex formatting. Try copying your resume text manually or ensure your PDF has selectable text.

- **Job posting not detected**: Make sure you're on the actual job posting page and the page has fully loaded. Try refreshing the page.

- **API errors**: Check your API key is correct and has sufficient credits. Ensure you have access to GPT-4 models.

- **Theme not saving**: Clear extension storage and try again, or check Chrome storage permissions.

## Future Enhancements

- [ ] Integrate pdf.js for better PDF text extraction
- [ ] Add support for multiple resume formats (DOCX, TXT)
- [ ] Implement resume template library
- [ ] Add history of analyzed jobs and cover letters
- [ ] Support for batch job analysis
- [ ] Export analysis reports

## License

This project is provided as-is for personal use.

## Support

For issues or questions, please check:
1. Your OpenAI API key is valid and has credits
2. You have internet connection
3. The extension has necessary permissions
4. Chrome is up to date

