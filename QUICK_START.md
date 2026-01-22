# Quick Start Guide - How to Use in Chrome

## Step 1: Generate Icons (Optional but Recommended)

1. Open `create_icons.html` in your Chrome browser
2. You'll see three canvas previews of the icons
3. Click each download button:
   - "Download 16x16" → Save as `icon16.png` in the `icons/` folder
   - "Download 48x48" → Save as `icon48.png` in the `icons/` folder
   - "Download 128x128" → Save as `icon128.png` in the `icons/` folder

**Note:** Placeholder icons are already included, but custom icons look better!

## Step 2: Load the Extension in Chrome

1. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Type `chrome://extensions/` in the address bar and press Enter
   - OR go to: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Look for a toggle switch labeled "Developer mode" in the top-right corner
   - Turn it ON (it will turn blue)

3. **Load the Extension**
   - Click the "Load unpacked" button (appears after enabling Developer mode)
   - Navigate to and select the `session1` folder
   - Click "Select Folder" (or "Open" on Mac)

4. **Verify Installation**
   - The extension should now appear in your extensions list
   - You should see "Resume ATS Scorer & Cover Letter Generator"
   - The extension icon should appear in your Chrome toolbar (top-right)

## Step 3: Set Up Your OpenAI API Key

1. **Get an API Key** (if you don't have one)
   - Go to https://platform.openai.com/
   - Sign up or log in
   - Navigate to API Keys section
   - Click "Create new secret key"
   - Copy the key (it starts with `sk-`)

2. **Enter the API Key in Extension**
   - Click the extension icon in your Chrome toolbar
   - The extension popup will open
   - Paste your OpenAI API key in the text box
   - Click "Save"
   - You should see a success notification

## Step 4: Upload Your Resume

### Option A: Upload PDF
1. In the extension popup, find "Upload Resume" section
2. Click the upload area or drag & drop your PDF resume
3. Wait for processing (you'll see a loading indicator)
4. Your ATS score will be calculated automatically

### Option B: Paste Resume Text
1. Click "Or Paste Resume Text" button
2. Paste your resume text in the text area that appears
3. Click "Use This Text"
4. Your ATS score will be calculated automatically

## Step 5: Use the Features

### 📊 View ATS Score
- After uploading your resume, the ATS score appears automatically
- View the score (0-100), feedback, strengths, and improvements
- Green = Good (80+), Yellow = Average (60-79), Red = Needs Work (<60)

### 🎯 Analyze Job Posting Match
1. Navigate to any job posting page (LinkedIn, Indeed, company website, etc.)
2. Make sure you've uploaded your resume first
3. Open the extension popup
4. Click "Analyze Current Page for Job Posting"
5. View your match percentage and detailed analysis

### ✏️ Get Resume Improvements
1. Make sure your resume is uploaded
2. Click "Analyze Resume for Improvements"
3. Review suggestions by section
4. Click "Download [Section] PDF" to save improvements

### 💼 Generate Cover Letter
1. Upload your resume
2. Analyze a job posting (see above)
3. (Optional) Upload a sample cover letter to match its format
4. Click "Generate Cover Letter"
5. Review the generated cover letter
6. Click "Download Cover Letter PDF" to save

### 🌓 Change Theme
- Click the moon/sun icon (🌙/☀️) in the top-right of the popup
- Dark theme is default
- Light theme available
- Your preference is saved automatically

## Troubleshooting

### Extension not loading?
- Make sure Developer mode is enabled
- Check that you selected the correct folder (session1)
- Look for errors in the extensions page

### Can't find the extension icon?
- Click the puzzle piece icon (🧩) in Chrome toolbar
- Find "Resume ATS Scorer" in the list
- Click the pin icon to keep it visible

### PDF not working?
- Try the "Paste Resume Text" option instead
- Make sure your PDF has selectable text (not just images)

### API errors?
- Verify your API key is correct
- Check you have credits in your OpenAI account
- Make sure you have internet connection

### Job posting not detected?
- Refresh the job posting page
- Make sure the page is fully loaded
- Try on a different job posting site

## Tips

- 💡 Keep your resume uploaded - it's stored in the extension
- 💡 Generate multiple cover letters by analyzing different job postings
- 💡 Download improvement PDFs for each section separately
- 💡 The extension works best on professional job sites (LinkedIn, Indeed, Glassdoor)
- 💡 Save your API key securely - you'll need it each time you reload the extension

## Keyboard Shortcuts (Chrome)

- `Alt+E` (Windows/Linux) or `Cmd+Shift+E` (Mac) - Open Extensions page
- Click extension icon to open popup anytime

## Need Help?

- Check the full README.md for detailed information
- Review OpenAI API documentation: https://platform.openai.com/docs
- Make sure Chrome is up to date

Enjoy using your Resume ATS Scorer Extension! 🚀

