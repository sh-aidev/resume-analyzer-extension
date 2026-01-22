# Quick Start Guide - Resume Analyzer Extension

## Step 1: Load the Extension in Chrome

1. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Type `chrome://extensions/` in the address bar and press Enter
   - OR go to: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Look for a toggle switch labeled "Developer mode" in the top-right corner
   - Turn it ON (it will turn blue)

3. **Load the Extension**
   - Click the "Load unpacked" button (appears after enabling Developer mode)
   - Navigate to and select the `resume-analyzer-extension` folder
   - Click "Select Folder" (or "Open" on Mac)

4. **Verify Installation**
   - The extension should now appear in your extensions list
   - You should see "Resume Analyzer"
   - The extension icon should appear in your Chrome toolbar (top-right)

## Step 2: Configure AI Provider & API Key

### Choose Your AI Provider

1. **Click the extension icon** in your Chrome toolbar
2. **Select AI Provider:**
   - Choose between **OpenAI** or **Gemini** (radio buttons)
   - Select your preferred **model** from the dropdown

### Get API Key

**For OpenAI:**
- Go to https://platform.openai.com/
- Sign up or log in
- Navigate to API Keys section
- Click "Create new secret key"
- Copy the key (it starts with `sk-`)

**For Gemini:**
- Go to https://makersuite.google.com/app/apikey
- Sign in with your Google account
- Create a new API key
- Copy the key (it starts with `AIza`)

### Enter API Key in Extension

1. In the extension popup, paste your API key in the text box
2. Click "Save"
3. You should see a success notification
4. Your API key is stored locally and never shared

## Step 3: Upload Your Resume

### Option A: Upload PDF
1. In the extension popup, find "Upload Resume" section
2. Click the upload area or drag & drop your PDF resume
3. Wait for processing (you'll see a loading indicator)
4. Resume information will be displayed

### Option B: Paste Resume Text
1. Click "Or Paste Resume Text" button
2. Paste your resume text in the text area that appears
3. Click "Use This Text"
4. Resume information will be displayed

## Step 4: Analyze Job Postings

### Method 1: Right-Click Context Menu (Recommended)
1. Navigate to any job posting page (LinkedIn, Indeed, company website, etc.)
2. **Select the job description text** on the page
3. **Right-click** on the selected text
4. Choose from the context menu:
   - **"ATS Score for the selected Job"** - Get ATS score analysis
   - **"Generate Cover Letter"** - Generate cover letter
   - **"Resume Analysis"** - Get in-depth analysis
4. Click the extension icon to view results

### Method 2: Select Text Button
1. Navigate to a job posting page
2. Open the extension popup
3. Click **"Select Text on Page"** button
4. The popup will close - select text on the webpage
5. Right-click on selected text and choose an option

### Method 3: Paste Job Description
1. Copy the job description text
2. Open the extension popup
3. Paste the text in the "Job Description" textarea
4. Click **"Get ATS Score for This Job"**

## Step 5: Use the Features

### 📊 ATS Resume Score
- After uploading resume and selecting job description, click "Get ATS Score for This Job"
- View your **Resume Check Score** (0-100) with:
  - Circular progress indicator
  - Strength label (EXCELLENT/GOOD/AVERAGE/POOR)
  - Section-wise analysis with issue counts
  - **Collapsible improvement points** - Click on red sections to see:
    - Improvement points (red bullet points)
    - How to fix (detailed instructions)
    - Example content (improved examples)

### 🎯 Match Score
- Automatically calculated when you analyze a job posting
- Shows how well your resume matches the job requirements
- Similar format to ATS Score with:
  - Match percentage
  - Section-wise mismatch analysis
  - Detailed examples of what's missing
  - Improvement suggestions

### 📝 In-depth Resume Analysis
1. Make sure your resume is uploaded
2. Click **"In-depth Resume Analysis"** button
3. Review comprehensive analysis by section:
   - Improvement points
   - How to fix
   - Example content
4. All sections are collapsible for easy navigation

### 💼 Generate Cover Letter
1. Upload your resume
2. Select or paste a job posting
3. Click **"Generate Cover Letter"**
4. Review the generated cover letter:
   - Single page format
   - 200-250 words
   - Professional format
   - Includes current date
5. Click **"Download Cover Letter as PDF"** to save

### 🌓 Change Theme
- Click the moon/sun icon (🌙/☀️) in the top-right of the popup
- Dark theme is default
- Light theme available
- Your preference is saved automatically

## Supported AI Models

### OpenAI Models
- **gpt-5-mini** (default)
- gpt-4o, gpt-4o-mini
- gpt-4.1, gpt-4.1-mini, gpt-4.1-nano
- gpt-4.5-preview variants
- o1, o1-preview, o1-mini
- o3, o3-mini, o4-mini
- gpt-5 variants

### Gemini Models
- **gemini-2.5-flash** (default)
- gemini-3-pro-preview
- gemini-3-flash-preview
- gemini-2.5-flash-lite
- gemini-2.5-pro

## Troubleshooting

### Extension not loading?
- Make sure Developer mode is enabled
- Check that you selected the correct folder (`resume-analyzer-extension`)
- Look for errors in the extensions page

### Can't find the extension icon?
- Click the puzzle piece icon (🧩) in Chrome toolbar
- Find "Resume Analyzer" in the list
- Click the pin icon to keep it visible

### PDF not extracting text?
- Try the "Paste Resume Text" option instead
- Make sure your PDF has selectable text (not just images)
- Some PDFs may require manual text extraction

### API errors?
- Verify your API key is correct
- Check you have credits in your OpenAI/Gemini account
- Make sure you have internet connection
- Ensure the selected model is available in your API plan

### Job posting not detected?
- Use the right-click context menu method (recommended)
- Or use "Select Text on Page" button
- Make sure you're on a regular webpage (not chrome:// pages)
- Refresh the page if needed

### Text selection not working?
- Make sure you're on a regular webpage
- Try refreshing the page
- Use the paste method as an alternative

### Theme not saving?
- Clear extension storage and try again
- Check Chrome storage permissions

## Tips

- 💡 **Keep your resume uploaded** - It's stored locally in the extension
- 💡 **Use right-click menu** - Fastest way to analyze job postings
- 💡 **Generate multiple cover letters** - Analyze different job postings
- 💡 **Collapsible sections** - Click on red sections to see detailed improvements
- 💡 **Copy text from suggestions** - Text in expanded sections is selectable
- 💡 **Works best on professional job sites** - LinkedIn, Indeed, Glassdoor, etc.
- 💡 **Switch AI providers** - Try both OpenAI and Gemini to see which works better
- 💡 **Change models** - Different models may give different results

## Keyboard Shortcuts (Chrome)

- `Alt+E` (Windows/Linux) or `Cmd+Shift+E` (Mac) - Open Extensions page
- Click extension icon to open popup anytime
- Right-click on selected text for quick access

## Privacy & Security

- ✅ All data stored locally in Chrome storage
- ✅ API keys never shared with third parties
- ✅ Resume data stays on your device
- ✅ Only sent to selected AI provider (OpenAI/Gemini) for processing
- ✅ No tracking or analytics

## Need Help?

- Check the full [README.md](README.md) for detailed information
- Review OpenAI API documentation: https://platform.openai.com/docs
- Review Gemini API documentation: https://ai.google.dev/docs
- Make sure Chrome is up to date

---

**Made with lots of Passion and ☕**

Enjoy using your Resume Analyzer Extension! 🚀