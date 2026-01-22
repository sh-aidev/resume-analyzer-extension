// Popup script for Resume ATS Scorer Extension

let apiKey = '';
let resumeData = null;
let resumeText = '';
let jobPostingText = '';

// Initialize when DOM is ready
function initializeExtension() {
  try {
    console.log('Initializing extension...');
    console.log('Document ready state:', document.readyState);
    
    loadApiKey();
    setupEventListeners();
    checkResumeStatus();
    console.log('Extension initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    console.error('Stack:', error.stack);
    alert('Error initializing extension: ' + error.message + '\n\nCheck console for details.');
  }
}

// Initialize immediately - Chrome extension popups are usually already ready
console.log('popup.js script loaded');
console.log('Document ready state:', document.readyState);
console.log('Document body:', document.body);

// For Chrome extension popups, DOM is usually ready immediately
if (document.body) {
  console.log('Body exists, initializing now');
  initializeExtension();
} else {
  console.log('Body not ready, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initializeExtension);
}

// Also try on window load as backup
window.addEventListener('load', function() {
  console.log('Window load fired - re-checking');
  setupEventListeners();
}, { once: true });

// Load saved API key
async function loadApiKey() {
  const result = await chrome.storage.local.get(['openaiApiKey']);
  if (result.openaiApiKey) {
    apiKey = result.openaiApiKey;
    document.getElementById('apiKey').value = '•'.repeat(20);
  }
}

// Setup event listeners
function setupEventListeners() {
  try {
    console.log('Setting up event listeners...');
    
    // API Key save
    const saveBtn = document.getElementById('saveKey');
    console.log('Save button element:', saveBtn);
    if (saveBtn) {
      // Remove any existing listeners first
      const newSaveBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
      newSaveBtn.addEventListener('click', function(e) {
        console.log('Save button clicked!', e);
        saveApiKey(e);
      });
      console.log('Save button listener attached');
    } else {
      console.error('Save button not found!');
      console.log('Available elements:', document.querySelectorAll('button'));
    }
    
    // Theme toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Resume upload
    const uploadArea = document.getElementById('uploadArea');
    const resumeUpload = document.getElementById('resumeUpload');
    if (uploadArea && resumeUpload) {
      uploadArea.addEventListener('click', () => resumeUpload.click());
      uploadArea.addEventListener('dragover', handleDragOver);
      uploadArea.addEventListener('drop', handleDrop);
      resumeUpload.addEventListener('change', handleResumeUpload);
    }
    
    // Manual text input
    const pasteBtn = document.getElementById('pasteTextBtn');
    const useTextBtn = document.getElementById('useTextBtn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', showTextInput);
    }
    if (useTextBtn) {
      useTextBtn.addEventListener('click', useTextInput);
    }
    
    // Analysis buttons
    const analyzeJobBtn = document.getElementById('analyzeJob');
    const analyzeResumeBtn = document.getElementById('analyzeResume');
    const generateCoverBtn = document.getElementById('generateCoverLetter');
    if (analyzeJobBtn) {
      analyzeJobBtn.addEventListener('click', analyzeJobPosting);
    }
    if (analyzeResumeBtn) {
      analyzeResumeBtn.addEventListener('click', analyzeResume);
    }
    if (generateCoverBtn) {
      generateCoverBtn.addEventListener('click', generateCoverLetter);
    }
    
    // Load theme preference
    loadThemePreference();
    
    console.log('Event listeners set up successfully');
  } catch (error) {
    console.error('Error setting up event listeners:', error);
    alert('Error setting up buttons: ' + error.message);
  }
}

// Save API Key
async function saveApiKey(event) {
  console.log('saveApiKey called', event);
  
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  try {
    console.log('Getting API key input...');
    const input = document.getElementById('apiKey');
    console.log('API key input:', input);
    
    if (!input) {
      alert('API key input field not found');
      return;
    }
    
    const key = input.value.trim();
    console.log('API key value length:', key.length);
    
    if (!key) {
      alert('Please enter an API key');
      return;
    }
    
    if (!key.startsWith('sk-')) {
      if (!confirm('The API key should start with "sk-". Continue anyway?')) {
        return;
      }
    }
    
    console.log('Saving API key...');
    apiKey = key;
    await chrome.storage.local.set({ openaiApiKey: key });
    input.value = '•'.repeat(20);
    input.type = 'password';
    
    // Enable buttons if resume is uploaded
    checkResumeStatus();
    
    showNotification('API key saved successfully!');
    console.log('API key saved successfully');
  } catch (error) {
    console.error('Error saving API key:', error);
    alert('Error saving API key: ' + error.message);
  }
}

// Theme toggle
function toggleTheme(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  try {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (!body || !themeIcon) {
      console.error('Theme elements not found');
      return;
    }
    
    const isDark = body.classList.contains('dark-theme');
    
    if (isDark) {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      themeIcon.textContent = '☀️';
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      themeIcon.textContent = '🌙';
    }
    
    chrome.storage.local.set({ theme: body.classList.contains('dark-theme') ? 'dark' : 'light' });
    console.log('Theme toggled');
  } catch (error) {
    console.error('Error toggling theme:', error);
  }
}

function loadThemePreference() {
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      document.getElementById('themeIcon').textContent = '☀️';
    }
  });
}

// Show manual text input
function showTextInput() {
  const textArea = document.getElementById('textInputArea');
  textArea.style.display = textArea.style.display === 'none' ? 'block' : 'none';
  if (textArea.style.display === 'block') {
    document.getElementById('resumeTextInput').focus();
  }
}

// Use manual text input
async function useTextInput() {
  const text = document.getElementById('resumeTextInput').value.trim();
  
  if (!text || text.length < 50) {
    alert('Please paste your resume text (at least 50 characters)');
    return;
  }
  
  if (!apiKey) {
    alert('Please enter and save your OpenAI API key first');
    return;
  }
  
  resumeText = text;
  resumeData = {
    text: resumeText,
    name: 'Pasted Resume Text'
  };
  
  // Show resume info
  document.getElementById('resumeInfo').style.display = 'block';
  document.getElementById('resumeInfo').innerHTML = `
    <strong>Resume:</strong> Pasted Text<br>
    <strong>Text Length:</strong> ${resumeText.length} characters
  `;
  
  // Hide text input
  document.getElementById('textInputArea').style.display = 'none';
  document.getElementById('resumeTextInput').value = '';
  
  // Enable buttons
  checkResumeStatus();
  
  // Auto-calculate ATS score
  await calculateATSScore();
  
  showNotification('Resume text loaded successfully!');
}

// Handle resume upload
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.style.borderColor = 'var(--accent-primary)';
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.style.borderColor = 'var(--border-color)';
  
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type === 'application/pdf') {
    processResumeFile(files[0]);
  } else {
    alert('Please upload a PDF file');
  }
}

function handleResumeUpload(e) {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    processResumeFile(file);
  } else if (file) {
    alert('Please upload a PDF file');
  }
}

async function processResumeFile(file) {
  if (!apiKey) {
    alert('Please enter and save your OpenAI API key first');
    return;
  }
  
  showLoading('Processing resume...');
  
  try {
    // Read PDF and extract text
    resumeText = await extractTextFromPDF(file);
    resumeData = {
      file: file,
      text: resumeText,
      name: file.name
    };
    
    // Show resume info
    document.getElementById('resumeInfo').style.display = 'block';
    document.getElementById('resumeInfo').innerHTML = `
      <strong>Resume:</strong> ${file.name}<br>
      <strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB<br>
      <strong>Text Length:</strong> ${resumeText.length} characters
    `;
    
    // Enable buttons
    checkResumeStatus();
    
    // Auto-calculate ATS score
    await calculateATSScore();
    
    hideLoading();
    showNotification('Resume uploaded successfully!');
  } catch (error) {
    hideLoading();
    console.error('Error processing resume:', error);
    alert('Error processing resume: ' + error.message + '\n\nNote: For better PDF extraction, you can also copy and paste your resume text manually.');
  }
}

// Wait for pdf.js to load (non-blocking)
async function waitForPDFJS() {
  // Check if already loaded
  if (typeof pdfjsLib !== 'undefined') {
    return pdfjsLib;
  }
  
  // Wait for it to load (check every 100ms, max 5 seconds)
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkPDFJS = setInterval(() => {
      attempts++;
      if (typeof pdfjsLib !== 'undefined') {
        clearInterval(checkPDFJS);
        resolve(pdfjsLib);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkPDFJS);
        // Don't reject - just return null so PDF extraction can fail gracefully
        console.warn('PDF.js library failed to load, but continuing...');
        resolve(null);
      }
    }, 100);
  });
}

// Extract text from PDF using pdf.js
async function extractTextFromPDF(file) {
  return new Promise(async (resolve, reject) => {
    try {
      // Wait for pdf.js to load
      const pdfjs = await waitForPDFJS();
      
      // If pdf.js didn't load, throw a helpful error
      if (!pdfjs) {
        throw new Error('PDF.js library not loaded. Please refresh the extension or use "Paste Resume Text" option.');
      }
      
      // Set worker source (local file)
      pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          
          // Load PDF document
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          let fullText = '';
          
          // Extract text from all pages
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Combine text items
            const pageText = textContent.items
              .map(item => item.str)
              .join(' ');
            
            fullText += pageText + '\n\n';
          }
          
          // Clean up text
          fullText = fullText
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n')  // Remove multiple newlines
            .trim();
          
          if (fullText.length < 50) {
            reject(new Error('Extracted text is too short. The PDF might contain only images or scanned content. Please paste your resume text manually.'));
            return;
          }
          
          resolve(fullText);
        } catch (error) {
          console.error('PDF extraction error:', error);
          
          // Fallback: try reading as plain text (for some PDFs)
          const textReader = new FileReader();
          textReader.onload = (event) => {
            let text = event.target.result;
            if (text && text.length > 100 && !text.match(/^\x00+$/)) {
              text = text.replace(/\x00/g, '').replace(/\r\n/g, '\n').trim();
              if (text.length > 100) {
                resolve(text);
                return;
              }
            }
            reject(new Error('Could not extract text from PDF. Please use the "Paste Resume Text" option or ensure your PDF contains selectable text.'));
          };
          textReader.onerror = () => {
            reject(new Error('PDF extraction failed. Please use the "Paste Resume Text" option instead.'));
          };
          textReader.readAsText(file);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    } catch (error) {
      // Catch any errors from the outer try block (like pdf.js loading errors)
      console.error('PDF extraction setup error:', error);
      reject(error);
    }
  });
}

// Calculate ATS Score
async function calculateATSScore() {
  if (!resumeText || !apiKey) return;
  
  showLoading('Calculating ATS score...');
  
  try {
    const prompt = `Analyze this resume and provide an ATS (Applicant Tracking System) score from 0-100. 
    Consider:
    1. Keyword optimization (5-10 points per relevant keyword)
    2. Formatting and structure (20 points)
    3. Contact information completeness (10 points)
    4. Work experience clarity and metrics (20 points)
    5. Skills section quality and relevance (15 points)
    6. Education details (10 points)
    7. ATS-friendly formatting (no images, proper headers) (15 points)
    
    Resume Text:
    ${resumeText.substring(0, 4000)}
    
    Respond ONLY in valid JSON format with no markdown code blocks. The JSON must be valid and parseable:
    {
      "score": <number 0-100>,
      "feedback": "<detailed feedback explaining the score>",
      "strengths": ["<strength1>", "<strength2>", "<strength3>"],
      "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"]
    }`;
    
    const response = await callOpenAI(prompt);
    
    // Use robust JSON extraction
    const result = extractJSON(response);
    
    // Display score
    document.getElementById('atsScore').textContent = result.score;
    document.getElementById('atsFeedback').innerHTML = `
      <strong>Feedback:</strong> ${result.feedback}<br><br>
      <strong>Strengths:</strong><ul>${result.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
      <strong>Improvements:</strong><ul>${result.improvements.map(i => `<li>${i}</li>`).join('')}</ul>
    `;
    document.getElementById('atsScoreSection').style.display = 'block';
    
    // Update score circle color based on score
    const scoreCircle = document.getElementById('scoreCircle');
    if (result.score >= 80) {
      scoreCircle.style.background = 'linear-gradient(135deg, #00b894, #00cec9)';
    } else if (result.score >= 60) {
      scoreCircle.style.background = 'linear-gradient(135deg, #fdcb6e, #e17055)';
    } else {
      scoreCircle.style.background = 'linear-gradient(135deg, #e17055, #d63031)';
    }
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error calculating ATS score:', error);
    console.error('Resume text length:', resumeText?.length);
    
    // Provide more helpful error message
    let errorMsg = 'Error calculating ATS score: ' + error.message;
    if (error.message.includes('JSON')) {
      errorMsg += '\n\nThe AI response could not be parsed as JSON. This might be due to:\n';
      errorMsg += '• The response format from OpenAI\n';
      errorMsg += '• Special characters in your resume\n';
      errorMsg += '• API response issues\n\n';
      errorMsg += 'Please try again or use a shorter resume text.';
    }
    
    alert(errorMsg);
  }
}

// Analyze job posting
async function analyzeJobPosting() {
  if (!apiKey) {
    alert('Please enter and save your OpenAI API key first');
    return;
  }
  
  showLoading('Analyzing job posting...');
  
  try {
    // Get active tab content
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractJobPostingContent
    });
    
    jobPostingText = results[0].result || '';
    
    if (!jobPostingText || jobPostingText.length < 100) {
      hideLoading();
      alert('Could not detect job posting on this page. Please navigate to a job posting page or ensure the page has loaded completely.');
      return;
    }
    
    if (!resumeText) {
      hideLoading();
      alert('Please upload your resume first');
      return;
    }
    
    // Calculate match percentage
    const prompt = `Compare this resume with the job posting and calculate a match percentage (0-100).
    
    Resume:
    ${resumeText.substring(0, 4000)}
    
    Job Posting:
    ${jobPostingText.substring(0, 4000)}
    
    Respond ONLY in valid JSON format with no markdown code blocks:
    {
      "matchPercentage": <number 0-100>,
      "analysis": "<detailed analysis of the match>",
      "matchedSkills": ["<skill1>", "<skill2>", "<skill3>"],
      "missingSkills": ["<skill1>", "<skill2>"],
      "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"]
    }`;
    
    const response = await callOpenAI(prompt);
    
    // Use robust JSON extraction
    const result = extractJSON(response);
    
    // Display match result
    const matchResult = document.getElementById('jobMatchResult');
    matchResult.style.display = 'block';
    matchResult.innerHTML = `
      <h3>Match Score: ${result.matchPercentage}%</h3>
      <p><strong>Analysis:</strong> ${result.analysis}</p>
      <p><strong>Matched Skills:</strong> ${result.matchedSkills.join(', ') || 'None identified'}</p>
      <p><strong>Missing Skills:</strong> ${result.missingSkills.join(', ') || 'None identified'}</p>
      <p><strong>Recommendations:</strong></p>
      <ul>${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
    `;
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error analyzing job posting:', error);
    alert('Error analyzing job posting: ' + error.message);
  }
}

// Analyze resume for improvements
async function analyzeResume() {
  if (!resumeText || !apiKey) return;
  
  showLoading('Analyzing resume for improvements...');
  
  try {
    const prompt = `Analyze this resume and provide detailed improvement suggestions organized by section.
    
    Resume:
    ${resumeText.substring(0, 4000)}
    
    Respond ONLY in valid JSON format with no markdown code blocks:
    {
      "sections": [
        {
          "name": "<section name>",
          "currentContent": "<current content summary>",
          "suggestions": "<detailed improvement suggestions>",
          "improvedContent": "<improved version of the content>"
        }
      ],
      "overallFeedback": "<overall feedback and summary>"
    }`;
    
    const response = await callOpenAI(prompt);
    
    // Use robust JSON extraction
    const result = extractJSON(response);
    
    // Display analysis results
    const analysisResults = document.getElementById('analysisResults');
    analysisResults.style.display = 'block';
    analysisResults.innerHTML = `
      <h3>Improvement Analysis</h3>
      <p><strong>Overall Feedback:</strong> ${result.overallFeedback}</p>
      ${result.sections.map((section, index) => `
        <div class="analysis-item">
          <h4>${section.name}</h4>
          <p><strong>Current:</strong> ${section.currentContent.substring(0, 300)}${section.currentContent.length > 300 ? '...' : ''}</p>
          <p><strong>Suggestions:</strong> ${section.suggestions}</p>
          <p><strong>Improved:</strong> ${section.improvedContent.substring(0, 300)}${section.improvedContent.length > 300 ? '...' : ''}</p>
          <button class="download-btn" onclick="window.downloadSectionPDF('${section.name.replace(/'/g, "\\'")}', ${index})">
            Download ${section.name} PDF
          </button>
        </div>
      `).join('')}
    `;
    
    // Store sections for PDF download
    window.analysisSections = result.sections;
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error analyzing resume:', error);
    alert('Error analyzing resume: ' + error.message);
  }
}

// Generate cover letter
async function generateCoverLetter() {
  if (!resumeText || !jobPostingText || !apiKey) {
    if (!jobPostingText) {
      alert('Please analyze a job posting first by clicking "Analyze Current Page for Job Posting"');
    } else {
      alert('Please upload your resume first');
    }
    return;
  }
  
  showLoading('Generating cover letter...');
  
  try {
    const themeFile = document.getElementById('themeUpload').files[0];
    let themeInstructions = '';
    
    if (themeFile) {
      // Extract theme from uploaded file
      themeInstructions = await extractThemeFromFile(themeFile);
    }
    
    const prompt = `Generate a professional, compelling cover letter based on this resume and job posting.
    
    Resume:
    ${resumeText.substring(0, 4000)}
    
    Job Posting:
    ${jobPostingText.substring(0, 4000)}
    
    ${themeInstructions ? `Theme/Format Guidelines:\n${themeInstructions}\n\n` : ''}
    
    Create a cover letter that:
    1. Highlights the most relevant skills and experience from the resume
    2. Shows clear understanding of the role and company needs
    3. Demonstrates genuine enthusiasm for the position
    4. Matches the tone and style appropriate for the job posting
    5. Is concise but impactful (ideally 3-4 paragraphs)
    ${themeInstructions ? '6. Follows the provided theme/format guidelines' : '6. Uses professional business letter format'}
    
    Respond with the cover letter text only, no additional commentary or markdown formatting.`;
    
    const coverLetter = await callOpenAI(prompt);
    
    // Display cover letter
    const coverLetterResult = document.getElementById('coverLetterResult');
    coverLetterResult.style.display = 'block';
    coverLetterResult.innerHTML = `
      <h3>Generated Cover Letter</h3>
      <div style="background: var(--bg-primary); padding: 16px; border-radius: 8px; margin: 12px 0; white-space: pre-wrap; line-height: 1.6; max-height: 400px; overflow-y: auto;">
        ${coverLetter.replace(/\n/g, '<br>')}
      </div>
      <button class="download-btn" onclick="window.downloadCoverLetterPDF()" style="width: 100%; margin-top: 12px; padding: 12px;">
        Download Cover Letter PDF
      </button>
    `;
    
    // Store cover letter for PDF download
    window.coverLetterText = coverLetter;
    window.coverLetterTheme = themeFile;
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error generating cover letter:', error);
    alert('Error generating cover letter: ' + error.message);
  }
}

// Extract theme from uploaded file
async function extractThemeFromFile(file) {
  // For DOCX files, we would need a library like mammoth.js
  // For PDF files, we can use pdf.js
  // For now, use OpenAI to extract formatting guidelines
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Use OpenAI to analyze the theme/format
        const prompt = `Analyze this cover letter file and extract formatting, style, and theme guidelines.
        Provide instructions on:
        1. Font style and size
        2. Paragraph spacing and structure
        3. Header/footer format if any
        4. Overall tone and writing style
        5. Any specific formatting conventions
        
        Since I cannot directly read the file, provide general guidelines for matching a professional cover letter theme.`;
        
        const themeInstructions = await callOpenAI(prompt);
        resolve(themeInstructions);
      } catch (error) {
        // Fallback: provide general instructions
        resolve('Match professional business letter formatting with clear structure and appropriate spacing.');
      }
    };
    reader.onerror = () => resolve('Match professional business letter formatting.');
    reader.readAsText(file);
  });
}

// Robust JSON extraction from OpenAI response
function extractJSON(response) {
  let cleaned = response.trim();
  
  // First, check if response is a double-encoded JSON string
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    try {
      const decoded = JSON.parse(cleaned);
      if (typeof decoded === 'string') {
        cleaned = decoded.trim();
      }
    } catch (e) {
      // Not double-encoded, continue
    }
  }
  
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/```json\s*\n?/gi, '');
  cleaned = cleaned.replace(/```[a-z]*\s*\n?/gi, '');
  cleaned = cleaned.replace(/```\s*\n?/g, '');
  
  // Find JSON object boundaries
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object found in response');
  }
  
  // Extract JSON by finding matching braces (handles nested objects/arrays)
  let braceCount = 0;
  let lastBrace = firstBrace;
  let inString = false;
  let escapeNext = false;
  
  for (let i = firstBrace; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }
    }
  }
  
  if (braceCount !== 0) {
    throw new Error('Unmatched braces in JSON response');
  }
  
  // Extract the JSON substring
  cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
  
  // Convert literal escape sequences (\n, \t, \r) to actual characters
  // ONLY when they appear outside of string values
  // This handles cases where OpenAI returns literal escape sequences
  let processed = '';
  inString = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = i < cleaned.length - 1 ? cleaned[i + 1] : null;
    const prevChar = i > 0 ? cleaned[i - 1] : null;
    
    // Handle quote toggling (but ignore escaped quotes)
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      processed += char;
      continue;
    }
    
    // Handle backslash
    if (char === '\\') {
      if (inString) {
        // Inside string - preserve as-is for JSON.parse
        processed += char;
        if (nextChar) {
          processed += nextChar;
          i++; // Skip next char
        }
      } else {
        // Outside string - convert literal escape sequences to actual chars
        if (nextChar === 'n') {
          processed += '\n';
          i++; // Skip 'n'
        } else if (nextChar === 't') {
          processed += '\t';
          i++;
        } else if (nextChar === 'r') {
          processed += '\r';
          i++;
        } else if (nextChar === '\\') {
          // Double backslash - preserve one
          processed += '\\';
          i++; // Skip next backslash
        } else {
          processed += char;
        }
      }
      continue;
    }
    
    // Regular character
    processed += char;
  }
  
  cleaned = processed;
  
  // Try parsing immediately - sometimes it just works
  try {
    return JSON.parse(cleaned);
  } catch (immediateError) {
    // Continue to fixes
  }
  
  // Fix common JSON issues before parsing
  // Replace smart quotes with regular quotes
  cleaned = cleaned.replace(/[""]/g, '"').replace(/['']/g, "'");
  
  // Fix trailing commas (which break JSON)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Try to parse after basic fixes
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // If first attempt fails, try fixing common issues
    
    // Fix unescaped quotes in string values
    // This regex is more careful about escaped quotes
    try {
      // Try to fix quotes in string values by being smarter about it
      let fixed = cleaned;
      
      // Replace unescaped quotes inside string values
      fixed = fixed.replace(/(:\s*")([^"]*?)(")/g, (match, prefix, content, suffix) => {
        // Only fix if there are unescaped quotes in content
        const needsFixing = content.includes('"') && !content.match(/\\"/);
        if (needsFixing) {
          const fixedContent = content.replace(/"/g, '\\"');
          return prefix + fixedContent + suffix;
        }
        return match;
      });
      
      try {
        return JSON.parse(fixed);
      } catch (secondError) {
        // Continue to more aggressive fixes
      }
    } catch (e) {
      // Continue
    }
    
    // If parsing still fails, log and try one more approach
    // Log detailed error information
    console.error('JSON parsing error:', firstError);
    console.error('Error at position:', firstError.message.match(/position (\d+)/)?.[1] || 'unknown');
    console.error('Response length:', cleaned.length);
    console.error('Response preview (first 200 chars):', cleaned.substring(0, 200));
    console.error('Response preview (last 200 chars):', cleaned.substring(Math.max(0, cleaned.length - 200)));
    
    // Show characters around error position for debugging
    const errorPosMatch = firstError.message.match(/position (\d+)/);
    if (errorPosMatch) {
      const errorPos = parseInt(errorPosMatch[1]);
      const start = Math.max(0, errorPos - 20);
      const end = Math.min(cleaned.length, errorPos + 20);
      console.error('Characters around error:', cleaned.substring(start, end));
      console.error('Error position char code:', cleaned.charCodeAt(errorPos));
    }
    
    // Try to fix array-specific issues (common source of position errors)
    // Fix unescaped quotes in array elements
    cleaned = cleaned.replace(/\[\s*"((?:[^"]|\\")*)"\s*,/g, (match, content) => {
      // Check if content has unescaped quotes
      if (content.includes('"') && !content.match(/\\"/)) {
        const fixed = content.replace(/"/g, '\\"');
        return match.replace(content, fixed);
      }
      return match;
    });
    
    // Fix missing commas between array elements
    cleaned = cleaned.replace(/\]\s*\[/g, '], [');
    
    // Try parsing again
    try {
      return JSON.parse(cleaned);
    } catch (secondError) {
      // Last attempt: try to extract and fix the problematic area
      const positionMatch = secondError.message.match(/position (\d+)/);
      if (positionMatch) {
        const errorPos = parseInt(positionMatch[1]);
        const before = cleaned.substring(Math.max(0, errorPos - 50), errorPos);
        const after = cleaned.substring(errorPos, Math.min(cleaned.length, errorPos + 50));
        console.error('Error context:', before + '>>>ERROR<<<' + after);
        
        // Try to fix common issues at the error position
        // If there's a quote issue, try to escape it
        if (cleaned[errorPos] === '"') {
          // Check if it's an unescaped quote in a string
          cleaned = cleaned.substring(0, errorPos) + '\\"' + cleaned.substring(errorPos + 1);
          try {
            return JSON.parse(cleaned);
          } catch (thirdError) {
            // Give up and show helpful error
          }
        }
      }
      
      // Final error message with helpful context
      const preview = cleaned.substring(0, 500);
      const errorPos = positionMatch ? parseInt(positionMatch[1]) : -1;
      let errorMsg = `Failed to parse JSON. ${error.message}`;
      if (errorPos > 0) {
        errorMsg += `\n\nError near position ${errorPos}.`;
      }
      errorMsg += `\n\nResponse preview:\n${preview}...`;
      throw new Error(errorMsg);
    }
  }
}

// Call OpenAI API
async function callOpenAI(prompt, model = 'gpt-4o') {
  if (!apiKey) {
    throw new Error('API key not set');
  }
  
  // Prepare request body
  const requestBody = {
    model: model,
    messages: [{
      role: 'system',
      content: 'You are a helpful assistant that always responds with valid JSON when requested. Do not include markdown code blocks or any text outside the JSON.'
    }, {
      role: 'user',
      content: prompt
    }],
    temperature: 0.7,
    max_tokens: 2000
  };
  
  // Add response_format for models that support it (gpt-4o, gpt-4-turbo, etc.)
  // This ensures JSON response
  if (model.includes('gpt-4') || model.includes('gpt-3.5')) {
    requestBody.response_format = { type: 'json_object' };
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Extract job posting content from page
function extractJobPostingContent() {
  // Try common job posting selectors
  const selectors = [
    '[data-job-id]',
    '.job-description',
    '.job-post',
    '[class*="job-description"]',
    '[class*="job-post"]',
    '[class*="job"]',
    '[class*="position"]',
    '[class*="description"]',
    '[id*="job"]',
    '[id*="position"]',
    'article',
    'main',
    '[role="main"]'
  ];
  
  let content = '';
  let maxLength = 0;
  
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = (el.innerText || el.textContent || '').trim();
        if (text.length > maxLength && text.length > 200) {
          maxLength = text.length;
          content = text;
        }
      });
    } catch (e) {
      // Continue
    }
  }
  
  // Fallback: get body content (remove scripts, styles, nav, etc.)
  if (content.length < 200) {
    const bodyClone = document.body.cloneNode(true);
    const unwanted = bodyClone.querySelectorAll('script, style, nav, header, footer, aside, [class*="nav"], [class*="menu"], [class*="sidebar"]');
    unwanted.forEach(el => el.remove());
    content = (bodyClone.innerText || bodyClone.textContent || '').trim();
  }
  
  return content.substring(0, 8000); // Limit to 8000 characters
}

// Download section PDF
window.downloadSectionPDF = async function(sectionName, index) {
  if (!window.analysisSections || !window.analysisSections[index]) {
    alert('Section data not available');
    return;
  }
  
  const section = window.analysisSections[index];
  const content = `
${sectionName} - Improvement Analysis

CURRENT CONTENT:
${section.currentContent}

SUGGESTIONS:
${section.suggestions}

IMPROVED CONTENT:
${section.improvedContent}
  `.trim();
  
  // Create and download PDF
  await generatePDF(content, `${sectionName.replace(/[^a-z0-9]/gi, '_')}_Improvements.pdf`);
};

// Download cover letter PDF
window.downloadCoverLetterPDF = async function() {
  if (!window.coverLetterText) {
    alert('Cover letter not available');
    return;
  }
  
  await generatePDF(window.coverLetterText, 'Cover_Letter.pdf');
};

// Generate PDF using browser print API
async function generatePDF(content, filename) {
  // Create a new window for PDF generation
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to download PDFs');
    return;
  }
  
  // Escape HTML but preserve line breaks
  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page {
              margin: 1in;
              size: letter;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          body {
            font-family: 'Times New Roman', 'Georgia', serif;
            font-size: 12pt;
            line-height: 1.6;
            padding: 1in;
            max-width: 8.5in;
            margin: 0 auto;
            color: #000;
            background: #fff;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Times New Roman', 'Georgia', serif;
            font-size: 12pt;
            line-height: 1.8;
          }
          .print-button {
            margin: 20px 0;
            padding: 10px 20px;
            background: #4a9eff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-button:hover {
            background: #357abd;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>
        <pre>${escapedContent}</pre>
        <script>
          // Auto-trigger print dialog after page loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Check resume status and enable/disable buttons
function checkResumeStatus() {
  const hasResume = !!resumeText;
  const hasApiKey = !!apiKey;
  
  document.getElementById('analyzeResume').disabled = !hasResume || !hasApiKey;
  document.getElementById('generateCoverLetter').disabled = !hasResume || !hasApiKey;
  document.getElementById('analyzeJob').disabled = !hasApiKey;
}

// Show/hide loading
function showLoading(text = 'Processing...') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 14px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
