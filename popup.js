// Popup script for Resume Analyzer Extension

let apiKey = '';
let aiProvider = 'openai'; // 'openai' or 'gemini'
let selectedModel = 'gpt-5-mini'; // Default model
let resumeData = null;
let resumeText = '';
let jobPostingText = '';
let prompts = {
  atsScore: '',
  resumeAnalysis: '',
  sectionImprovements: '',
  coverLetter: ''
};

// Available models for each provider
const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'gpt-4o' },
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
  { value: 'gpt-4.1', label: 'gpt-4.1' },
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
  { value: 'gpt-4.1-nano', label: 'gpt-4.1-nano' },
  { value: 'gpt-4.5-preview-2025-02-27', label: 'gpt-4.5-preview-2025-02-27' },
  { value: 'gpt-4.5-preview', label: 'gpt-4.5-preview' },
  { value: 'o1', label: 'o1' },
  { value: 'o1-2024-12-17', label: 'o1-2024-12-17' },
  { value: 'o1-preview', label: 'o1-preview' },
  { value: 'o1-mini', label: 'o1-mini' },
  { value: 'o3-mini', label: 'o3-mini' },
  { value: 'o3', label: 'o3' },
  { value: 'o4-mini', label: 'o4-mini' },
  { value: 'gpt-5', label: 'gpt-5' },
  { value: 'gpt-5-mini', label: 'gpt-5-mini' },
  { value: 'gpt-5-nano', label: 'gpt-5-nano' },
  { value: 'gpt-5-2025-08-07', label: 'gpt-5-2025-08-07' },
  { value: 'gpt-5-mini-2025-08-07', label: 'gpt-5-mini-2025-08-07' },
  { value: 'gpt-5-nano-2025-08-07', label: 'gpt-5-nano-2025-08-07' },
  { value: 'gpt-5.1', label: 'gpt-5.1' },
  { value: 'gpt-5.1-chat-latest', label: 'gpt-5.1-chat-latest' },
  { value: 'gpt-5.2', label: 'gpt-5.2' },
  { value: 'gpt-5.2-chat-latest', label: 'gpt-5.2-chat-latest' }
];

const GEMINI_MODELS = [
  { value: 'gemini-3-pro-preview', label: 'gemini-3-pro-preview' },
  { value: 'gemini-3-flash-preview', label: 'gemini-3-flash-preview' },
  { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
  { value: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
  { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro' }
];

// Load prompts from files
async function loadPrompts() {
  try {
    const promptFiles = [
      { key: 'atsScore', file: 'prompts/ats-score-system.txt' },
      { key: 'resumeAnalysis', file: 'prompts/resume-analysis.txt' },
      { key: 'sectionImprovements', file: 'prompts/section-improvements.txt' },
      { key: 'coverLetter', file: 'prompts/cover-letter-generation.txt' }
    ];
    
    for (const { key, file } of promptFiles) {
      try {
        const response = await fetch(chrome.runtime.getURL(file));
        if (response.ok) {
          prompts[key] = await response.text();
        } else {
          console.warn(`Failed to load prompt: ${file}`);
        }
      } catch (error) {
        console.error(`Error loading prompt ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading prompts:', error);
  }
}

// Initialize when DOM is ready
async function initializeExtension() {
  // Prevent duplicate initialization
  if (window.extensionInitialized) {
    console.log('Extension already initialized, skipping...');
    return;
  }
  
  try {
    console.log('Initializing extension...');
    console.log('Document ready state:', document.readyState);
    
    await loadPrompts();
    await loadApiKey();
    await loadResumeData(); // Load saved resume data
    setupEventListeners();
    checkResumeStatus();
    setupMessageListener();
    
    // Initialize model dropdown if not already done
    if (document.getElementById('modelSelect') && document.getElementById('modelSelect').options.length === 0) {
      updateModelDropdown();
    }
    
    window.extensionInitialized = true;
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

// Also try on window load as backup (but only if not already initialized)
let isInitialized = false;
window.addEventListener('load', function() {
  if (!isInitialized) {
    console.log('Window load fired - re-checking');
    setupEventListeners();
  }
}, { once: true });

// Load saved API key, provider, and model
async function loadApiKey() {
  const result = await chrome.storage.local.get(['apiKey', 'aiProvider', 'selectedModel']);
  
  // Load provider (default to OpenAI)
  if (result.aiProvider) {
    aiProvider = result.aiProvider;
  } else {
    aiProvider = 'openai'; // Default to OpenAI
  }
  
  // Set provider radio button
  const providerId = aiProvider === 'openai' ? 'providerOpenAI' : 'providerGemini';
  const providerRadio = document.getElementById(providerId);
  if (providerRadio) {
    providerRadio.checked = true;
  }
  
  // Update model dropdown based on provider
  updateModelDropdown();
  
  // Load selected model (default based on provider)
  if (result.selectedModel) {
    selectedModel = result.selectedModel;
  } else {
    selectedModel = aiProvider === 'openai' ? 'gpt-5-mini' : 'gemini-2.5-flash';
  }
  
  // Set model dropdown value
  const modelSelect = document.getElementById('modelSelect');
  if (modelSelect) {
    modelSelect.value = selectedModel;
  }
  
  // Load API key
  if (result.apiKey) {
    apiKey = result.apiKey;
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
      apiKeyInput.value = '•'.repeat(20);
    }
  }
}

// Update model dropdown based on selected provider
function updateModelDropdown() {
  const modelSelect = document.getElementById('modelSelect');
  if (!modelSelect) return;
  
  const models = aiProvider === 'openai' ? OPENAI_MODELS : GEMINI_MODELS;
  
  // Clear existing options
  modelSelect.innerHTML = '';
  
  // Add new options
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.value;
    option.textContent = model.label;
    // Set selected attribute if this is the default model
    if (model.value === selectedModel) {
      option.selected = true;
    }
    modelSelect.appendChild(option);
  });
  
  // Set default model if current selection is not available in new provider's models
  const currentModelExists = models.find(m => m.value === selectedModel);
  if (!currentModelExists) {
    // Use default for the provider
    selectedModel = aiProvider === 'openai' ? 'gpt-5-mini' : 'gemini-2.5-flash';
  }
  
  // Ensure the dropdown value is set and visible
  modelSelect.value = selectedModel;
  
  // Force a re-render by dispatching a change event (helps with some browsers)
  modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Update API key placeholder based on provider
  const apiKeyInput = document.getElementById('apiKey');
  if (apiKeyInput) {
    if (aiProvider === 'openai') {
      apiKeyInput.placeholder = 'Enter your OpenAI API key';
    } else {
      apiKeyInput.placeholder = 'Enter your Gemini API key';
    }
  }
}

// Save resume data to storage
async function saveResumeData(data) {
  try {
    await chrome.storage.local.set({ 
      resumeData: {
        text: data.text,
        name: data.name,
        size: data.size
      }
    });
    console.log('Resume data saved to storage');
  } catch (error) {
    console.error('Error saving resume data:', error);
  }
}

// Load resume data from storage
async function loadResumeData() {
  try {
    const result = await chrome.storage.local.get(['resumeData']);
    if (result.resumeData && result.resumeData.text) {
      resumeText = result.resumeData.text;
      resumeData = {
        text: result.resumeData.text,
        name: result.resumeData.name || 'Saved Resume',
        size: result.resumeData.size || result.resumeData.text.length
      };
      
      // Restore resume info display
      document.getElementById('resumeInfo').style.display = 'block';
      const sizeDisplay = result.resumeData.size 
        ? `${(result.resumeData.size / 1024).toFixed(2)} KB`
        : 'N/A';
      document.getElementById('resumeInfo').innerHTML = `
        <strong>Resume:</strong> ${result.resumeData.name}<br>
        <strong>Size:</strong> ${sizeDisplay}<br>
        <strong>Text Length:</strong> ${resumeText.length} characters
      `;
      
      // Show job description and cover letter sections
      document.getElementById('jobDescriptionSection').style.display = 'block';
      document.getElementById('coverLetterSection').style.display = 'block';
      
      console.log('Resume data loaded from storage');
    }
  } catch (error) {
    console.error('Error loading resume data:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Prevent duplicate event listener setup
  if (window.eventListenersSetup) {
    console.log('Event listeners already setup, skipping...');
    return;
  }
  
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
    
    // Provider radio buttons
    const providerOpenAI = document.getElementById('providerOpenAI');
    const providerGemini = document.getElementById('providerGemini');
    if (providerOpenAI) {
      providerOpenAI.addEventListener('change', function() {
        if (this.checked) {
          aiProvider = 'openai';
          // Set default model for OpenAI before updating dropdown
          selectedModel = 'gpt-5-mini';
          updateModelDropdown();
        }
      });
    }
    if (providerGemini) {
      providerGemini.addEventListener('change', function() {
        if (this.checked) {
          aiProvider = 'gemini';
          // Set default model for Gemini before updating dropdown
          selectedModel = 'gemini-2.5-flash';
          updateModelDropdown();
        }
      });
    }
    
    // Model dropdown
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
      modelSelect.addEventListener('change', function() {
        selectedModel = this.value;
      });
    }
    
    // Theme toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Resume upload - remove old listeners first
    const uploadArea = document.getElementById('uploadArea');
    const resumeUpload = document.getElementById('resumeUpload');
    if (uploadArea && resumeUpload) {
      // Clone elements to remove old listeners
      const newUploadArea = uploadArea.cloneNode(true);
      const newResumeUpload = resumeUpload.cloneNode(true);
      
      // Replace the upload area (which contains the input)
      uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
      
      // Find the input in the cloned area and replace it
      const oldInputInArea = newUploadArea.querySelector('input[type="file"]');
      if (oldInputInArea) {
        oldInputInArea.replaceWith(newResumeUpload);
      }
      
      newUploadArea.addEventListener('click', () => newResumeUpload.click());
      newUploadArea.addEventListener('dragover', handleDragOver);
      newUploadArea.addEventListener('drop', handleDrop);
      newResumeUpload.addEventListener('change', handleResumeUpload);
    }
    
    window.eventListenersSetup = true;
    
    // Manual text input
    const pasteBtn = document.getElementById('pasteTextBtn');
    const useTextBtn = document.getElementById('useTextBtn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', showTextInput);
    }
    if (useTextBtn) {
      useTextBtn.addEventListener('click', useTextInput);
    }
    
    // Job description buttons
    const selectTextBtn = document.getElementById('selectTextBtn');
    const analyzeJobDescBtn = document.getElementById('analyzeJobDescription');
    const jobDescInput = document.getElementById('jobDescriptionInput');
    if (selectTextBtn) {
      selectTextBtn.addEventListener('click', enableTextSelection);
    }
    if (analyzeJobDescBtn) {
      analyzeJobDescBtn.addEventListener('click', analyzeResumeForJob);
    }
    if (jobDescInput) {
      jobDescInput.addEventListener('input', () => {
        const hasJobDesc = jobDescInput.value.trim().length > 0;
        if (analyzeJobDescBtn) {
          analyzeJobDescBtn.disabled = !hasJobDesc || !resumeText || !apiKey;
        }
        // Show cover letter section when job description is available
        if (hasJobDesc && resumeText && apiKey) {
          document.getElementById('coverLetterSection').style.display = 'block';
        }
        checkResumeStatus();
      });
    }
    
    // Analysis buttons
    const analyzeResumeBtn = document.getElementById('analyzeResume');
    const generateCoverBtn = document.getElementById('generateCoverLetter');
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
    
    // Get selected provider and model
    const providerOpenAI = document.getElementById('providerOpenAI');
    const providerGemini = document.getElementById('providerGemini');
    const modelSelect = document.getElementById('modelSelect');
    
    if (providerOpenAI && providerOpenAI.checked) {
      aiProvider = 'openai';
    } else if (providerGemini && providerGemini.checked) {
      aiProvider = 'gemini';
    }
    
    if (modelSelect) {
      selectedModel = modelSelect.value;
    }
    
    // Validate API key format based on provider
    if (aiProvider === 'openai' && !key.startsWith('sk-')) {
      if (!confirm('OpenAI API key should start with "sk-". Continue anyway?')) {
        return;
      }
    } else if (aiProvider === 'gemini' && !key.startsWith('AIza')) {
      if (!confirm('Gemini API key should start with "AIza". Continue anyway?')) {
        return;
      }
    }
    
    console.log('Saving API key, provider, and model...');
    apiKey = key;
    await chrome.storage.local.set({ 
      apiKey: key,
      aiProvider: aiProvider,
      selectedModel: selectedModel
    });
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
    name: 'Pasted Resume Text',
    size: text.length
  };
  
  // Save resume data to storage
  await saveResumeData({
    text: resumeText,
    name: 'Pasted Resume Text',
    size: text.length
  });
  
  // Show resume info
  document.getElementById('resumeInfo').style.display = 'block';
  document.getElementById('resumeInfo').innerHTML = `
    <strong>Resume:</strong> Pasted Text<br>
    <strong>Text Length:</strong> ${resumeText.length} characters
  `;
  
  // Hide text input
  document.getElementById('textInputArea').style.display = 'none';
  document.getElementById('resumeTextInput').value = '';
  
  // Enable buttons and show job description section
  checkResumeStatus();
  document.getElementById('jobDescriptionSection').style.display = 'block';
  document.getElementById('coverLetterSection').style.display = 'block';
  
  showNotification('Resume text loaded successfully! Please provide a job description to analyze.');
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

// Flag to prevent duplicate processing
let isProcessingResume = false;

async function processResumeFile(file) {
  // Prevent duplicate processing
  if (isProcessingResume) {
    console.log('Resume already being processed, ignoring duplicate call');
    return;
  }
  
  if (!apiKey) {
    alert('Please enter and save your OpenAI API key first');
    return;
  }
  
  isProcessingResume = true;
  showLoading('Processing resume...');
  
  try {
    // Read PDF and extract text
    resumeText = await extractTextFromPDF(file);
    resumeData = {
      file: file,
      text: resumeText,
      name: file.name,
      size: file.size
    };
    
    // Save resume data to storage
    await saveResumeData({
      text: resumeText,
      name: file.name,
      size: file.size
    });
    
    // Show resume info
    document.getElementById('resumeInfo').style.display = 'block';
    document.getElementById('resumeInfo').innerHTML = `
      <strong>Resume:</strong> ${file.name}<br>
      <strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB<br>
      <strong>Text Length:</strong> ${resumeText.length} characters
    `;
    
    // Enable buttons and show job description section
    checkResumeStatus();
    document.getElementById('jobDescriptionSection').style.display = 'block';
    document.getElementById('coverLetterSection').style.display = 'block';
    
    hideLoading();
    showNotification('Resume uploaded successfully! Please provide a job description to analyze.');
    isProcessingResume = false;
  } catch (error) {
    hideLoading();
    console.error('Error processing resume:', error);
    alert('Error processing resume: ' + error.message + '\n\nNote: For better PDF extraction, you can also copy and paste your resume text manually.');
    isProcessingResume = false;
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

// Setup message listener for text selection
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'selectedText') {
      handleSelectedText(request.text, request.actionType || 'analyze');
      sendResponse({ success: true });
    }
    return true;
  });
  
  // Check for stored selected text when popup opens
  chrome.storage.local.get(['lastSelectedText', 'lastSelectedAction'], (result) => {
    if (result.lastSelectedText) {
      handleSelectedText(result.lastSelectedText, result.lastSelectedAction || 'analyze');
      // Clear stored text and badge
      chrome.storage.local.remove(['lastSelectedText', 'lastSelectedAction']);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.action.setBadgeText({ text: '', tabId: tabs[0].id });
        }
      });
    }
  });
}

// Handle selected text
async function handleSelectedText(text, actionType = 'analyze') {
  const jobDescInput = document.getElementById('jobDescriptionInput');
  if (jobDescInput && text) {
    jobDescInput.value = text;
    jobPostingText = text;
    document.getElementById('jobDescriptionInfo').style.display = 'block';
    document.getElementById('jobDescriptionInfo').innerHTML = `
      <strong>Job Description:</strong> ${text.length} characters loaded from page selection
    `;
    document.getElementById('analyzeJobDescription').disabled = !resumeText || !apiKey;
    document.getElementById('coverLetterSection').style.display = 'block';
    checkResumeStatus();
    
    // Trigger the appropriate action based on actionType
    if (actionType === 'coverLetter') {
      showNotification('Job description loaded! Generating cover letter...');
      // Wait a bit for UI to update, then generate cover letter
      setTimeout(() => {
        generateCoverLetter();
      }, 500);
    } else if (actionType === 'analyze') {
      // Automatically start analysis
      showNotification('Job description loaded! Analyzing resume...');
      // Wait a bit for UI to update, then analyze
      setTimeout(() => {
        analyzeResumeForJob();
      }, 500);
    } else if (actionType === 'atsScore') {
      // Automatically get ATS score
      showNotification('Job description loaded! Getting ATS score...');
      // Wait a bit for UI to update, then get ATS score
      setTimeout(() => {
        analyzeResumeMatch();
      }, 500);
    } else if (actionType === 'resumeAnalysis') {
      // Automatically do resume analysis
      showNotification('Job description loaded! Analyzing resume...');
      // Wait a bit for UI to update, then analyze
      setTimeout(() => {
        analyzeResume();
      }, 500);
    } else {
      // Default: just load the text
      showNotification('Job description loaded from page selection!');
    }
  }
}

// Enable text selection mode
async function enableTextSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if tab URL is valid (not chrome://, chrome-extension://, file://, etc.)
    if (!tab.url || 
        tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('moz-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('file://')) {
      alert('Text selection is not available on this page. Please navigate to a regular webpage (like a job posting site) and try again.');
      return;
    }
    
    // Try to send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'enableTextSelection' });
      
      // Close the popup so user can select text on the page
      window.close();
      
      // Disable after 30 seconds
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'disableTextSelection' });
        } catch (e) {
          // Tab might be closed or content script not available
        }
      }, 30000);
    } catch (messageError) {
      // Content script might not be loaded, try to inject it
      console.log('Content script not responding, attempting to inject...', messageError);
      
      try {
        // Inject content script manually
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Wait a bit for script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try sending message again
        await chrome.tabs.sendMessage(tab.id, { action: 'enableTextSelection' });
        
        // Close the popup so user can select text on the page
        window.close();
        
        // Disable after 30 seconds
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'disableTextSelection' });
          } catch (e) {
            // Tab might be closed
          }
        }, 30000);
      } catch (injectError) {
        console.error('Error injecting content script:', injectError);
        alert('Could not enable text selection on this page. The page may have restrictions. Please try:\n\n1. Refreshing the page\n2. Using a different webpage\n3. Using the text input field instead');
      }
    }
  } catch (error) {
    console.error('Error enabling text selection:', error);
    alert('Could not enable text selection. Please make sure you are on a webpage and refresh if needed.');
  }
}

// Analyze resume for specific job
async function analyzeResumeForJob() {
  const jobDescInput = document.getElementById('jobDescriptionInput');
  const jobText = jobDescInput ? jobDescInput.value.trim() : '';
  
  if (!jobText || jobText.length < 50) {
    alert('Please provide a job description (at least 50 characters). You can paste it or select text on the current page.');
    return;
  }
  
  if (!resumeText) {
    alert('Please upload your resume first');
    return;
  }
  
  if (!apiKey) {
    alert('Please enter and save your OpenAI API key first');
    return;
  }
  
  jobPostingText = jobText;
  
  // Show job description info
  document.getElementById('jobDescriptionInfo').style.display = 'block';
  document.getElementById('jobDescriptionInfo').innerHTML = `
    <strong>Job Description:</strong> ${jobText.length} characters
  `;
  
  // Calculate ATS score for this job
  await calculateATSScore();
  
  // Analyze resume match
  await analyzeResumeMatch();
}

// Calculate ATS Score for specific job
async function calculateATSScore() {
  if (!resumeText || !jobPostingText || !apiKey) return;
  
  showLoading('Calculating ATS score for this job...');
  
  try {
    const systemPrompt = prompts.atsScore || 'You are an expert ATS analyst. Analyze resumes based on industry-standard ATS scoring criteria.';
    
    const userPrompt = `Analyze this resume against the provided job description and calculate an ATS score from 0-100.

Job Description:
${jobPostingText.substring(0, 4000)}

Resume Text:
${resumeText.substring(0, 4000)}

Consider the following criteria:
1. Keyword match with job description (25 points)
2. Formatting and structure (20 points)
3. Contact information completeness (10 points)
4. Work experience quality and relevance (20 points)
5. Skills section quality and match (15 points)
6. Education details (10 points)
7. ATS-friendly formatting (15 points)

Analyze each section of the resume and identify specific issues. For each section, provide:
1. Whether it has issues (hasIssues: true/false)
2. Count of issues found (issueCount: number)
3. List of specific improvement points as concise bullet points (improvements: array of strings)
4. Detailed explanation of how to fix the issues (details: string)
5. Example of improved content (exampleContent: string) - Show what the section should look like after applying the fixes

Sections to analyze:
- Contact: Check for missing email, phone, address, LinkedIn profile
- Professional Summary: Check for quality, relevance, keyword usage, length
- Skills: Check for missing relevant skills from job description, keyword match, organization
- Work History: Check for missing dates, job descriptions, achievements, quantifiable results, relevance to job
- Education: Check for completeness, relevance, dates, degrees

IMPORTANT: 
- Only mark sections as having issues if there are actual problems to fix
- Each improvement point should be a concise, actionable statement
- Improvement points should be specific and directly related to the job description
- The exampleContent should show a complete, improved version of the section that incorporates all the fixes
- Example content should be realistic and match the resume's style and the job requirements
- If a section has no issues, set hasIssues: false, issueCount: 0, and provide exampleContent showing the current good content

Respond ONLY in valid JSON format with no markdown code blocks:
{
  "score": <number 0-100>,
  "strength": "<EXCELLENT|GOOD|AVERAGE|POOR>",
  "sections": [
    {
      "name": "Contact",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    },
    {
      "name": "Professional Summary",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    },
    {
      "name": "Skills",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    },
    {
      "name": "Work History",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    },
    {
      "name": "Education",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    }
  ]
}`;
    
    const response = await callOpenAI(userPrompt, null, systemPrompt);
    
    // Use robust JSON extraction
    const result = extractJSON(response);
    
    // Display score with new design
    displayATSScore(result);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error calculating ATS score:', error);
    
    let errorMsg = 'Error calculating ATS score: ' + error.message;
    if (error.message.includes('JSON')) {
      errorMsg += '\n\nThe AI response could not be parsed as JSON. Please try again.';
    }
    
    alert(errorMsg);
  }
}

// Display ATS Score with new design matching screenshot
function displayATSScore(result) {
  const section = document.getElementById('atsScoreSection');
  section.style.display = 'block';
  
  // Determine strength label and color
  const strength = result.strength || (result.score >= 80 ? 'EXCELLENT' : result.score >= 60 ? 'GOOD' : result.score >= 40 ? 'AVERAGE' : 'POOR');
  const strengthColor = result.score >= 80 ? '#00b894' : result.score >= 60 ? '#4a9eff' : result.score >= 40 ? '#f39c12' : '#e74c3c';
  
  // Calculate percentage for circular progress
  const percentage = result.score;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (percentage / 100) * circumference;
  
  // Get theme-aware colors
  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? 'var(--text-primary)' : '#2c3e50';
  const textSecondary = isDark ? 'var(--text-secondary)' : '#666';
  const borderColor = isDark ? 'var(--border-color)' : '#e0e0e0';
  const bgSecondary = isDark ? 'var(--bg-secondary)' : '#f5f5f5';
  
  const html = `
    <div class="ats-score-container">
      <h2 style="color: ${textColor}; margin-bottom: 20px; font-size: 24px; font-weight: 600;">Your Resume Check Score</h2>
      
      <div class="ats-score-header" style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
        <div class="ats-score-circle-wrapper" style="position: relative; width: 120px; height: 120px;">
          <svg class="ats-score-circle" width="120" height="120" style="transform: rotate(-90deg);">
            <circle cx="60" cy="60" r="45" stroke="${borderColor}" stroke-width="8" fill="none"></circle>
            <circle cx="60" cy="60" r="45" stroke="${strengthColor}" stroke-width="8" fill="none" 
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${offset}"
                    stroke-linecap="round"
                    style="transition: stroke-dashoffset 1s ease-in-out;"></circle>
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <div style="font-size: 36px; font-weight: 700; color: ${textColor}; line-height: 1;">${result.score}</div>
          </div>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 32px; font-weight: 700; color: ${textColor}; margin-bottom: 8px;">${strength}</div>
          <div class="resume-strength-badge" style="
            display: inline-block;
            background: ${isDark ? '#1e3a1e' : '#e8f5e9'};
            color: ${isDark ? '#81c784' : '#2e7d32'};
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">RESUME STRENGTH</div>
        </div>
      </div>
      
      <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 30px 0;">
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: ${textColor}; font-size: 16px; font-weight: 600; margin-bottom: 16px;">
          Review our suggestions to see what you can fix.
        </h3>
        
        <div class="ats-sections-list">
          ${(result.sections || []).map((section, index) => {
            const hasIssues = section.hasIssues && section.issueCount > 0;
            const icon = hasIssues 
              ? '<span style="color: #e74c3c; font-size: 18px; font-weight: bold;">⚠</span>'
              : '<span style="color: #00b894; font-size: 18px;">✓</span>';
            // Theme-aware colors for sections
            const sectionBgColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5') 
              : 'transparent';
            const sectionBorderColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc') 
              : borderColor;
            const iconBgColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.2)' : '#fee') 
              : (isDark ? 'rgba(0, 184, 148, 0.2)' : '#e8f5e9');
            
            const sectionId = `ats-section-${index}`;
            const detailsId = `ats-section-details-${index}`;
            
            return `
              <div class="ats-section-item" id="${sectionId}" data-section-index="${index}" style="
                background: ${sectionBgColor};
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 8px;
                transition: background 0.2s, border-color 0.2s;
                border: 1px solid ${sectionBorderColor};
              ">
                <div class="ats-section-header" id="ats-section-header-${index}" style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  cursor: ${hasIssues ? 'pointer' : 'default'};
                ">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: ${iconBgColor};
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">${icon}</div>
                    <span style="color: ${textColor}; font-size: 15px; font-weight: 500;">${section.name}</span>
                  </div>
                  ${hasIssues ? `
                    <div style="
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #e74c3c;
                      color: white;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 12px;
                      font-weight: 600;
                    ">${section.issueCount || 0}</div>
                  ` : ''}
                </div>
                ${hasIssues ? `
                <div class="ats-section-details" id="${detailsId}" style="
                  display: none;
                  margin-top: 16px;
                  padding-top: 16px;
                  border-top: 1px solid ${borderColor};
                  user-select: text;
                  -webkit-user-select: text;
                  -moz-user-select: text;
                  -ms-user-select: text;
                ">
                  <div style="color: ${textSecondary}; font-size: 14px; line-height: 1.6;" onclick="event.stopPropagation();">
                    <strong style="color: ${textColor}; display: block; margin-bottom: 12px; font-size: 15px;">Improvement Points:</strong>
                    <ul style="margin-left: 20px; margin-bottom: 16px; list-style: none; padding: 0;">
                      ${(section.improvements || []).length > 0 ? (section.improvements || []).map(improvement => `
                        <li style="margin-bottom: 10px; padding-left: 20px; position: relative;">
                          <span style="position: absolute; left: 0; color: #e74c3c; font-weight: bold; font-size: 18px;">•</span>
                          <span style="color: #e74c3c; display: inline-block; margin-left: 8px;">${improvement}</span>
                        </li>
                      `).join('') : `<li style="color: ${textSecondary};">No specific improvement points identified.</li>`}
                    </ul>
                    <strong style="color: ${textColor}; display: block; margin-bottom: 8px; margin-top: 16px; font-size: 15px;">How to Fix:</strong>
                    <p style="color: ${textSecondary}; line-height: 1.6; margin-bottom: 16px;">${section.details || 'No specific details available.'}</p>
                    ${section.exampleContent ? `
                    <strong style="color: ${textColor}; display: block; margin-bottom: 8px; margin-top: 16px; font-size: 15px;">Example Content:</strong>
                    <div style="
                      background: ${isDark ? 'var(--bg-secondary)' : '#f8f9fa'};
                      border: 1px solid ${borderColor};
                      border-left: 3px solid ${strengthColor};
                      padding: 12px 16px;
                      border-radius: 6px;
                      margin-top: 8px;
                      font-family: 'Courier New', monospace;
                      font-size: 13px;
                      line-height: 1.6;
                      color: ${textColor};
                      white-space: pre-wrap;
                      word-wrap: break-word;
                    ">${section.exampleContent}</div>
                    ` : ''}
                  </div>
                </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  
  section.innerHTML = html;
  
  // Store result for toggle function
  window.atsScoreResult = result;
  
  // Attach click event listeners to section headers only (not the entire section)
  setTimeout(() => {
    (result.sections || []).forEach((section, index) => {
      if (section.hasIssues && section.issueCount > 0) {
        const sectionElement = document.getElementById(`ats-section-${index}`);
        const headerElement = document.getElementById(`ats-section-header-${index}`);
        const detailsElement = document.getElementById(`ats-section-details-${index}`);
        
        if (sectionElement && headerElement) {
          // Only attach click handler to the header, not the entire section
          headerElement.addEventListener('click', function(e) {
            e.stopPropagation();
            if (detailsElement) {
              const isVisible = detailsElement.style.display !== 'none';
              detailsElement.style.display = isVisible ? 'none' : 'block';
              
              // Add visual feedback with theme awareness
              const isDark = document.body.classList.contains('dark-theme');
              if (isVisible) {
                sectionElement.style.background = isDark ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5';
                sectionElement.style.borderColor = isDark ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc';
              } else {
                sectionElement.style.background = isDark ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
                sectionElement.style.borderColor = isDark ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
              }
            }
          });
          
          // Prevent clicks inside details from collapsing
          if (detailsElement) {
            detailsElement.addEventListener('click', function(e) {
              e.stopPropagation();
            });
          }
          
          // Add hover effects with theme awareness (only on header)
          headerElement.addEventListener('mouseenter', function() {
            if (section.hasIssues) {
              const isDarkTheme = document.body.classList.contains('dark-theme');
              sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
              sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
            }
          });
          
          headerElement.addEventListener('mouseleave', function() {
            const details = document.getElementById(`ats-section-details-${index}`);
            const isExpanded = details && details.style.display !== 'none';
            if (section.hasIssues) {
              const isDarkTheme = document.body.classList.contains('dark-theme');
              if (isExpanded) {
                sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
                sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
              } else {
                sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5';
                sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc';
              }
            }
          });
        }
      }
    });
  }, 100);
}

// Display Match Score with same format as ATS Score
function displayMatchScore(result) {
  const section = document.getElementById('jobMatchSection');
  section.style.display = 'block';
  document.getElementById('coverLetterSection').style.display = 'block';
  
  // Determine strength label and color
  const strength = result.strength || (result.score >= 80 ? 'EXCELLENT' : result.score >= 60 ? 'GOOD' : result.score >= 40 ? 'AVERAGE' : 'POOR');
  const strengthColor = result.score >= 80 ? '#00b894' : result.score >= 60 ? '#4a9eff' : result.score >= 40 ? '#f39c12' : '#e74c3c';
  
  // Calculate percentage for circular progress
  const percentage = result.score;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Get theme-aware colors
  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? 'var(--text-primary)' : '#2c3e50';
  const textSecondary = isDark ? 'var(--text-secondary)' : '#666';
  const borderColor = isDark ? 'var(--border-color)' : '#e0e0e0';
  
  const html = `
    <div class="match-score-container">
      <h2 style="color: ${textColor}; margin-bottom: 20px; font-size: 24px; font-weight: 600;">Your Resume Match Score</h2>
      
      <div class="match-score-header" style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
        <div class="match-score-circle-wrapper" style="position: relative; width: 120px; height: 120px;">
          <svg class="match-score-circle" width="120" height="120" style="transform: rotate(-90deg);">
            <circle cx="60" cy="60" r="45" stroke="${borderColor}" stroke-width="8" fill="none"></circle>
            <circle cx="60" cy="60" r="45" stroke="${strengthColor}" stroke-width="8" fill="none" 
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${offset}"
                    stroke-linecap="round"
                    style="transition: stroke-dashoffset 1s ease-in-out;"></circle>
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <div style="font-size: 36px; font-weight: 700; color: ${textColor}; line-height: 1;">${result.score}</div>
          </div>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 32px; font-weight: 700; color: ${textColor}; margin-bottom: 8px;">${strength}</div>
          <div class="resume-strength-badge" style="
            display: inline-block;
            background: ${isDark ? '#1e3a1e' : '#e8f5e9'};
            color: ${isDark ? '#81c784' : '#2e7d32'};
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">RESUME MATCH</div>
        </div>
      </div>
      
      <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 30px 0;">
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: ${textColor}; font-size: 16px; font-weight: 600; margin-bottom: 16px;">
          Review our suggestions to see what you can fix.
        </h3>
        
        <div class="match-sections-list">
          ${(result.sections || []).map((section, index) => {
            const hasIssues = section.hasIssues && section.issueCount > 0;
            const icon = hasIssues 
              ? '<span style="color: #e74c3c; font-size: 18px; font-weight: bold;">⚠</span>'
              : '<span style="color: #00b894; font-size: 18px;">✓</span>';
            
            const sectionBgColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5') 
              : 'transparent';
            const sectionBorderColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc') 
              : borderColor;
            const iconBgColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.2)' : '#fee') 
              : (isDark ? 'rgba(0, 184, 148, 0.2)' : '#e8f5e9');
            
            const sectionId = `match-section-${index}`;
            const detailsId = `match-section-details-${index}`;
            
            return `
              <div class="match-section-item" id="${sectionId}" data-section-index="${index}" style="
                background: ${sectionBgColor};
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 8px;
                transition: background 0.2s, border-color 0.2s;
                border: 1px solid ${sectionBorderColor};
              ">
                <div class="match-section-header" id="match-section-header-${index}" style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  cursor: ${hasIssues ? 'pointer' : 'default'};
                ">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: ${iconBgColor};
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">${icon}</div>
                    <span style="color: ${textColor}; font-size: 15px; font-weight: 500;">${section.name}</span>
                  </div>
                  ${hasIssues ? `
                    <div style="
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #e74c3c;
                      color: white;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 12px;
                      font-weight: 600;
                    ">${section.issueCount || 0}</div>
                  ` : ''}
                </div>
                ${hasIssues ? `
                <div class="match-section-details" id="${detailsId}" style="
                  display: none;
                  margin-top: 16px;
                  padding-top: 16px;
                  border-top: 1px solid ${borderColor};
                  user-select: text;
                  -webkit-user-select: text;
                  -moz-user-select: text;
                  -ms-user-select: text;
                ">
                  <div style="color: ${textSecondary}; font-size: 14px; line-height: 1.6;" onclick="event.stopPropagation();">
                    <strong style="color: ${textColor}; display: block; margin-bottom: 12px; font-size: 15px;">Mismatch Points:</strong>
                    <ul style="margin-left: 20px; margin-bottom: 16px; list-style: none; padding: 0;">
                      ${(section.improvements || []).length > 0 ? (section.improvements || []).map(improvement => `
                        <li style="margin-bottom: 10px; padding-left: 20px; position: relative;">
                          <span style="position: absolute; left: 0; color: #e74c3c; font-weight: bold; font-size: 18px;">•</span>
                          <span style="color: #e74c3c; display: inline-block; margin-left: 8px;">${improvement}</span>
                        </li>
                      `).join('') : `<li style="color: ${textSecondary};">No specific mismatch points identified.</li>`}
                    </ul>
                    <strong style="color: ${textColor}; display: block; margin-bottom: 8px; margin-top: 16px; font-size: 15px;">How to Fix:</strong>
                    <p style="color: ${textSecondary}; line-height: 1.6; margin-bottom: 16px;">${section.details || 'No specific details available.'}</p>
                    ${section.exampleContent ? `
                    <strong style="color: ${textColor}; display: block; margin-bottom: 8px; margin-top: 16px; font-size: 15px;">Example Content:</strong>
                    <div style="
                      background: ${isDark ? 'var(--bg-secondary)' : '#f8f9fa'};
                      border: 1px solid ${borderColor};
                      border-left: 3px solid ${strengthColor};
                      padding: 12px 16px;
                      border-radius: 6px;
                      margin-top: 8px;
                      font-family: 'Courier New', monospace;
                      font-size: 13px;
                      line-height: 1.6;
                      color: ${textColor};
                      white-space: pre-wrap;
                      word-wrap: break-word;
                    ">${section.exampleContent}</div>
                    ` : ''}
                  </div>
                </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  
  section.innerHTML = html;
  
  window.matchScoreResult = result;
  
  setTimeout(() => {
    (result.sections || []).forEach((section, index) => {
      if (section.hasIssues && section.issueCount > 0) {
        const sectionElement = document.getElementById(`match-section-${index}`);
        const headerElement = document.getElementById(`match-section-header-${index}`);
        const detailsElement = document.getElementById(`match-section-details-${index}`);
        
        if (sectionElement && headerElement) {
          headerElement.addEventListener('click', function(e) {
            e.stopPropagation();
            if (detailsElement) {
              const isVisible = detailsElement.style.display !== 'none';
              detailsElement.style.display = isVisible ? 'none' : 'block';
              
              const isDark = document.body.classList.contains('dark-theme');
              if (isVisible) {
                sectionElement.style.background = isDark ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5';
                sectionElement.style.borderColor = isDark ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc';
              } else {
                sectionElement.style.background = isDark ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
                sectionElement.style.borderColor = isDark ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
              }
            }
          });
          
          if (detailsElement) {
            detailsElement.addEventListener('click', function(e) {
              e.stopPropagation();
            });
          }
          
          headerElement.addEventListener('mouseenter', function() {
            if (section.hasIssues) {
              const isDarkTheme = document.body.classList.contains('dark-theme');
              sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
              sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
            }
          });
          
          headerElement.addEventListener('mouseleave', function() {
            const details = document.getElementById(`match-section-details-${index}`);
            const isExpanded = details && details.style.display !== 'none';
            if (section.hasIssues) {
              const isDarkTheme = document.body.classList.contains('dark-theme');
              if (isExpanded) {
                sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
                sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
              } else {
                sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5';
                sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc';
              }
            }
          });
        }
      }
    });
  }, 100);
}

// Toggle ATS section details (kept for backward compatibility)
window.toggleATSSection = function(index) {
  const details = document.getElementById(`ats-section-details-${index}`);
  const sectionElement = document.getElementById(`ats-section-${index}`);
  if (details && sectionElement) {
    const isVisible = details.style.display !== 'none';
    details.style.display = isVisible ? 'none' : 'block';
    
    // Update background color with theme awareness
    const isDark = document.body.classList.contains('dark-theme');
    if (isVisible) {
      sectionElement.style.background = isDark ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5';
      sectionElement.style.borderColor = isDark ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc';
    } else {
      sectionElement.style.background = isDark ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
      sectionElement.style.borderColor = isDark ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
    }
  }
};

// Analyze resume match with job
async function analyzeResumeMatch() {
  if (!resumeText || !jobPostingText || !apiKey) return;
  
  showLoading('Analyzing resume match...');
  
  try {
    const systemPrompt = prompts.resumeAnalysis || 'You are a professional resume analyst.';
    
    const userPrompt = `Compare this resume with the job description and calculate a comprehensive match score from 0-100.

Job Description:
${jobPostingText.substring(0, 4000)}

Resume:
${resumeText.substring(0, 4000)}

Perform a DEEP, DETAILED analysis of each section of the resume against the job description. Identify ALL mismatches, gaps, and areas for improvement. For each section, provide:

1. Whether it has mismatches (hasIssues: true/false)
2. Count of ALL mismatches found (issueCount: number) - be thorough and count every mismatch
3. List of SPECIFIC, DETAILED mismatches as bullet points (improvements: array of strings) - each point should clearly state:
   - What specific requirement from the job is missing
   - What keyword or skill is not present
   - What experience or qualification doesn't align
   - Be very specific and reference exact job requirements
4. COMPREHENSIVE explanation of how to fix ALL mismatches (details: string) - should be 3-5 sentences explaining:
   - Why these mismatches matter for this specific job
   - Step-by-step guidance on how to address each issue
   - How to incorporate job-specific keywords and requirements
   - Best practices for this section to match the job
5. COMPLETE, DETAILED example of improved content (exampleContent: string) - This should be:
   - A FULL, REALISTIC example of the entire section as it should appear in a resume
   - Incorporate ALL job-relevant keywords naturally
   - Match the tone and style of the job description
   - Include specific examples, achievements, and metrics that align with job requirements
   - Be 2-3 times longer than typical examples - show complete sentences, full descriptions
   - Format it exactly as it would appear in a professional resume

Sections to analyze in DETAIL:

- Contact: 
  * Check if location matches job location requirements
  * Verify LinkedIn profile is mentioned (if job requires it)
  * Check if contact format is professional
  * Identify any missing contact methods mentioned in job

- Professional Summary:
  * Analyze if summary mentions key job requirements
  * Check for presence of critical keywords from job description
  * Verify if years of experience match job requirements
  * Check if summary highlights relevant achievements mentioned in job
  * Identify if summary tone matches job level (entry/mid/senior)
  * Check if summary mentions specific technologies/tools from job
  * Verify if summary addresses job's main responsibilities

- Skills:
  * List ALL required skills from job description that are missing
  * Identify soft skills mentioned in job that aren't in resume
  * Check for technical skills/tools/software mentioned in job
  * Verify if skills are organized in a way that matches job priorities
  * Identify if skill levels match job requirements (e.g., "expert" vs "proficient")
  * Check for certifications mentioned in job that are missing
  * Verify if industry-specific skills are present

- Work History:
  * For EACH work experience, check if it demonstrates job requirements
  * Identify missing quantifiable achievements that match job needs
  * Check if job titles/responsibilities align with job description
  * Verify if technologies used match job requirements
  * Identify missing accomplishments that would be relevant to this job
  * Check if work history shows progression relevant to job level
  * Verify if industry experience matches job requirements
  * Identify if leadership/teamwork examples match job needs
  * Check for missing metrics/results that job description values

- Education:
  * Verify if degree level matches job requirements
  * Check if field of study aligns with job
  * Identify missing certifications mentioned in job
  * Verify if GPA or honors are mentioned (if relevant to job)
  * Check if education dates are present and appropriate
  * Identify if continuing education or courses match job needs

IMPORTANT REQUIREMENTS: 
- Be EXTREMELY thorough - identify EVERY mismatch, no matter how small
- Each improvement point should be SPECIFIC and reference exact job requirements
- The details explanation should be COMPREHENSIVE (at least 100-150 words per section with issues)
- The exampleContent should be COMPLETE and DETAILED - show full sentences, complete descriptions, realistic examples
- Example content should be 2-3 paragraphs or full bullet points, not just snippets
- Incorporate job-specific language, keywords, and requirements naturally throughout examples
- If a section has no mismatches, set hasIssues: false, issueCount: 0, and provide exampleContent showing the current good content with explanation of why it matches

Respond ONLY in valid JSON format with no markdown code blocks:
{
  "score": <number 0-100>,
  "strength": "<EXCELLENT|GOOD|AVERAGE|POOR>",
  "sections": [
    {
      "name": "Contact",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<mismatch point 1>", "<mismatch point 2>"],
      "details": "<detailed explanation of how to fix mismatches in this section>",
      "exampleContent": "<complete example of how this section should look after fixes to match the job, formatted as it would appear in a resume>"
    },
    {
      "name": "Professional Summary",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<mismatch point 1>", "<mismatch point 2>"],
      "details": "<detailed explanation of how to fix mismatches in this section>",
      "exampleContent": "<complete example of how this section should look after fixes to match the job, formatted as it would appear in a resume>"
    },
    {
      "name": "Skills",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<mismatch point 1>", "<mismatch point 2>"],
      "details": "<detailed explanation of how to fix mismatches in this section>",
      "exampleContent": "<complete example of how this section should look after fixes to match the job, formatted as it would appear in a resume>"
    },
    {
      "name": "Work History",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<mismatch point 1>", "<mismatch point 2>"],
      "details": "<detailed explanation of how to fix mismatches in this section>",
      "exampleContent": "<complete example of how this section should look after fixes to match the job, formatted as it would appear in a resume>"
    },
    {
      "name": "Education",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<mismatch point 1>", "<mismatch point 2>"],
      "details": "<detailed explanation of how to fix mismatches in this section>",
      "exampleContent": "<complete example of how this section should look after fixes to match the job, formatted as it would appear in a resume>"
    }
  ]
}`;
    
    const response = await callOpenAI(userPrompt, null, systemPrompt);
    const result = extractJSON(response);
    
    // Display match score with same format as ATS score
    displayMatchScore(result);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error analyzing resume match:', error);
    alert('Error analyzing resume match: ' + error.message);
  }
}


// Analyze resume for improvements
async function analyzeResume() {
  if (!resumeText || !apiKey) return;
  
  showLoading('Analyzing resume for improvements...');
  
  try {
    const systemPrompt = prompts.sectionImprovements || 'You are a resume optimization expert.';
    
    const userPrompt = `Perform a COMPREHENSIVE, IN-DEPTH analysis of this resume and provide detailed improvement suggestions organized by section.

Resume:
${resumeText.substring(0, 4000)}

${jobPostingText ? `Job Description (for context):
${jobPostingText.substring(0, 2000)}` : ''}

Analyze each section of the resume in DETAIL. For each section, provide:

1. Whether it has issues (hasIssues: true/false)
2. Count of ALL issues found (issueCount: number) - be thorough
3. List of SPECIFIC, DETAILED improvement points as bullet points (improvements: array of strings) - each point should clearly state:
   - What specific problem exists
   - What best practice is missing
   - What could be improved
   - Be very specific and actionable
4. COMPREHENSIVE explanation of how to fix ALL issues (details: string) - should be 3-5 sentences explaining:
   - Why these improvements matter
   - Step-by-step guidance on how to address each issue
   - Best practices for this section
   - Industry standards and recommendations
5. COMPLETE, DETAILED example of improved content (exampleContent: string) - This should be:
   - A FULL, REALISTIC example of the entire section as it should appear in a professional resume
   - Show complete sentences, full descriptions, realistic examples
   - Be 2-3 times longer than typical examples
   - Format it exactly as it would appear in a professional resume
   - Include specific examples, achievements, and metrics

Sections to analyze:
- Contact: Professional format, completeness, LinkedIn, location
- Professional Summary: Quality, length, keyword usage, impact, clarity
- Skills: Organization, relevance, categorization, keyword optimization
- Work History: Achievement descriptions, quantifiable results, action verbs, relevance
- Education: Completeness, formatting, relevance, certifications

IMPORTANT REQUIREMENTS: 
- Be EXTREMELY thorough - identify EVERY issue, no matter how small
- Each improvement point should be SPECIFIC and actionable
- The details explanation should be COMPREHENSIVE (at least 100-150 words per section with issues)
- The exampleContent should be COMPLETE and DETAILED - show full sentences, complete descriptions
- Example content should be 2-3 paragraphs or full bullet points, not just snippets
- If a section has no issues, set hasIssues: false, issueCount: 0, and provide exampleContent showing the current good content

Respond ONLY in valid JSON format with no markdown code blocks:
{
  "sections": [
    {
      "name": "Contact",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    },
    {
      "name": "Professional Summary",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    },
    {
      "name": "Skills",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    },
    {
      "name": "Work History",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    },
    {
      "name": "Education",
      "hasIssues": true/false,
      "issueCount": <number>,
      "improvements": ["<improvement point 1>", "<improvement point 2>"],
      "details": "<detailed explanation of how to fix all issues in this section>",
      "exampleContent": "<complete example of how this section should look after fixes, formatted as it would appear in a resume>"
    }
  ]
}`;
    
    const response = await callOpenAI(userPrompt, null, systemPrompt);
    const result = extractJSON(response);
    
    // Display analysis results with same format as ATS Score and Match Score
    displayInDepthAnalysis(result);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error analyzing resume:', error);
    alert('Error analyzing resume: ' + error.message);
  }
}

// Display In-depth Resume Analysis with same format as ATS Score and Match Score
function displayInDepthAnalysis(result) {
  const section = document.getElementById('analysisResults');
  section.style.display = 'block';
  
  // Get theme-aware colors
  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? 'var(--text-primary)' : '#2c3e50';
  const textSecondary = isDark ? 'var(--text-secondary)' : '#666';
  const borderColor = isDark ? 'var(--border-color)' : '#e0e0e0';
  const accentColor = isDark ? 'var(--accent-primary)' : '#4a9eff';
  
  const html = `
    <div class="in-depth-analysis-container" style="margin-top: 20px;">
      <h3 style="color: ${textColor}; margin-bottom: 20px; font-size: 20px; font-weight: 600;">In-depth Resume Analysis</h3>
      
      <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 20px 0;">
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: ${textColor}; font-size: 16px; font-weight: 600; margin-bottom: 16px;">
          Review our suggestions to improve your resume.
        </h4>
        
        <div class="analysis-sections-list">
          ${(result.sections || []).map((section, index) => {
            const hasIssues = section.hasIssues && section.issueCount > 0;
            const icon = hasIssues 
              ? '<span style="color: #e74c3c; font-size: 18px; font-weight: bold;">⚠</span>'
              : '<span style="color: #00b894; font-size: 18px;">✓</span>';
            
            // Theme-aware colors for sections
            const sectionBgColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5') 
              : 'transparent';
            const sectionBorderColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc') 
              : borderColor;
            const iconBgColor = hasIssues 
              ? (isDark ? 'rgba(231, 76, 60, 0.2)' : '#fee') 
              : (isDark ? 'rgba(0, 184, 148, 0.2)' : '#e8f5e9');
            
            const sectionId = `analysis-section-${index}`;
            const detailsId = `analysis-section-details-${index}`;
            
            return `
              <div class="analysis-section-item" id="${sectionId}" data-section-index="${index}" style="
                background: ${sectionBgColor};
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 8px;
                transition: background 0.2s, border-color 0.2s;
                border: 1px solid ${sectionBorderColor};
              ">
                <div class="analysis-section-header" id="analysis-section-header-${index}" style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  cursor: ${hasIssues ? 'pointer' : 'default'};
                ">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      background: ${iconBgColor};
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">${icon}</div>
                    <span style="color: ${textColor}; font-size: 15px; font-weight: 500;">${section.name}</span>
                  </div>
                  ${hasIssues ? `
                    <div style="
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #e74c3c;
                      color: white;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 12px;
                      font-weight: 600;
                    ">${section.issueCount || 0}</div>
                  ` : ''}
                </div>
                ${hasIssues ? `
                <div class="analysis-section-details" id="${detailsId}" style="
                  display: none;
                  margin-top: 16px;
                  padding-top: 16px;
                  border-top: 1px solid ${borderColor};
                  user-select: text;
                  -webkit-user-select: text;
                  -moz-user-select: text;
                  -ms-user-select: text;
                ">
                  <div style="color: ${textSecondary}; font-size: 14px; line-height: 1.6;" onclick="event.stopPropagation();">
                    <strong style="color: ${textColor}; display: block; margin-bottom: 12px; font-size: 15px;">Improvement Points:</strong>
                    <ul style="margin-left: 20px; margin-bottom: 16px; list-style: none; padding: 0;">
                      ${(section.improvements || []).length > 0 ? (section.improvements || []).map(improvement => `
                        <li style="margin-bottom: 10px; padding-left: 20px; position: relative;">
                          <span style="position: absolute; left: 0; color: #e74c3c; font-weight: bold; font-size: 18px;">•</span>
                          <span style="color: #e74c3c; display: inline-block; margin-left: 8px;">${improvement}</span>
                        </li>
                      `).join('') : `<li style="color: ${textSecondary};">No specific improvement points identified.</li>`}
                    </ul>
                    <strong style="color: ${textColor}; display: block; margin-bottom: 8px; margin-top: 16px; font-size: 15px;">How to Fix:</strong>
                    <p style="color: ${textSecondary}; line-height: 1.6; margin-bottom: 16px;">${section.details || 'No specific details available.'}</p>
                    ${section.exampleContent ? `
                    <strong style="color: ${textColor}; display: block; margin-bottom: 8px; margin-top: 16px; font-size: 15px;">Example Content:</strong>
                    <div style="
                      background: ${isDark ? 'var(--bg-secondary)' : '#f8f9fa'};
                      border: 1px solid ${borderColor};
                      border-left: 3px solid ${accentColor};
                      padding: 12px 16px;
                      border-radius: 6px;
                      margin-top: 8px;
                      font-family: 'Courier New', monospace;
                      font-size: 13px;
                      line-height: 1.6;
                      color: ${textColor};
                      white-space: pre-wrap;
                      word-wrap: break-word;
                    ">${section.exampleContent}</div>
                    ` : ''}
                  </div>
                </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  
  section.innerHTML = html;
  
  // Store result for toggle function
  window.inDepthAnalysisResult = result;
  
  // Attach click event listeners to section headers only
  setTimeout(() => {
    (result.sections || []).forEach((section, index) => {
      if (section.hasIssues && section.issueCount > 0) {
        const sectionElement = document.getElementById(`analysis-section-${index}`);
        const headerElement = document.getElementById(`analysis-section-header-${index}`);
        const detailsElement = document.getElementById(`analysis-section-details-${index}`);
        
        if (sectionElement && headerElement) {
          headerElement.addEventListener('click', function(e) {
            e.stopPropagation();
            if (detailsElement) {
              const isVisible = detailsElement.style.display !== 'none';
              detailsElement.style.display = isVisible ? 'none' : 'block';
              
              const isDark = document.body.classList.contains('dark-theme');
              if (isVisible) {
                sectionElement.style.background = isDark ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5';
                sectionElement.style.borderColor = isDark ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc';
              } else {
                sectionElement.style.background = isDark ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
                sectionElement.style.borderColor = isDark ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
              }
            }
          });
          
          if (detailsElement) {
            detailsElement.addEventListener('click', function(e) {
              e.stopPropagation();
            });
          }
          
          headerElement.addEventListener('mouseenter', function() {
            if (section.hasIssues) {
              const isDarkTheme = document.body.classList.contains('dark-theme');
              sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
              sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
            }
          });
          
          headerElement.addEventListener('mouseleave', function() {
            const details = document.getElementById(`analysis-section-details-${index}`);
            const isExpanded = details && details.style.display !== 'none';
            if (section.hasIssues) {
              const isDarkTheme = document.body.classList.contains('dark-theme');
              if (isExpanded) {
                sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.15)' : '#ffe8e8';
                sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.4)' : '#ffaaaa';
              } else {
                sectionElement.style.background = isDarkTheme ? 'rgba(231, 76, 60, 0.1)' : '#fff5f5';
                sectionElement.style.borderColor = isDarkTheme ? 'rgba(231, 76, 60, 0.3)' : '#ffcccc';
              }
            }
          });
        }
      }
    });
  }, 100);
}

// Get current date in dd-MMM-yyyy format
function getCurrentDateFormatted() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

// Generate cover letter
async function generateCoverLetter() {
  if (!resumeText || !apiKey) {
    alert('Please upload your resume first');
    return;
  }
  
  if (!jobPostingText) {
    const jobDescInput = document.getElementById('jobDescriptionInput');
    if (jobDescInput && jobDescInput.value.trim()) {
      jobPostingText = jobDescInput.value.trim();
    } else {
      alert('Please provide a job description first. You can paste it in the job description field or select text on a webpage.');
      return;
    }
  }
  
  showLoading('Generating cover letter...');
  
  try {
    // Get current date in dd-MMM-yyyy format
    const currentDate = getCurrentDateFormatted();
    
    const systemPrompt = prompts.coverLetter || 'You are an expert cover letter writer.';
    
    const userPrompt = `Generate a professional, compelling cover letter based on this resume and job posting.

Resume:
${resumeText.substring(0, 4000)}

Job Posting:
${jobPostingText.substring(0, 4000)}

Current Date: ${currentDate}

IMPORTANT - EXTRACT INFORMATION FROM JOB POSTING:
1. **Hiring Manager Name**: Look for names in sections like "Meet the hiring team", "Job poster", "HR Professional", "Recruiter", "Hiring Manager", "Contact", etc. Extract the actual person's name (e.g., "Hari Baskar"). 
   - For the recipient address section, use the FULL name (e.g., "Hari Baskar")
   - For the salutation (Dear...), use ONLY the FIRST NAME (e.g., "Dear Hari," not "Dear Hari Baskar,")
   - If multiple names appear, use the primary hiring manager/recruiter name
   - If no name is found, use "Hiring Manager" for both address and salutation
2. **Company Address**: Extract the company's address if mentioned in the job posting. If not available, use "[Company Name]" only.
3. **Company Name**: Extract the exact company name from the job posting.

Create a cover letter that:
1. Highlights the most relevant skills and experience from the resume
2. Shows clear understanding of the role and company needs
3. Demonstrates genuine enthusiasm for the position
4. Is crisp, concise, and fits on a single page (200-250 words)
5. Uses the ACTUAL hiring manager name if found in the job posting (not just "Hiring Manager")
6. Uses the ACTUAL company address if available

STRUCTURE YOUR RESPONSE AS:
[Your Name]
[Your Address]
[Your Phone Number]
[Your Email Address]

${currentDate}

[Full Hiring Manager Name if found, otherwise "Hiring Manager"]
[Company Name]
[Company Address if available, otherwise just company name]

Dear [FIRST NAME ONLY if found, otherwise "Hiring Manager"],

[Body paragraph 1 - 3-4 sentences]

[Body paragraph 2 - 3-4 sentences]

[Body paragraph 3 - 2-3 sentences]

Sincerely,
[Your Name]

CRITICAL: 
- Search the job posting carefully for hiring manager/recruiter names (look for sections like "Meet the hiring team", "Job poster", "Contact", "HR", etc.)
- For recipient address: Use FULL name if found (e.g., "Hari Baskar")
- For salutation: Use ONLY FIRST NAME (e.g., "Dear Hari," NOT "Dear Hari Baskar,")
- Extract company address if mentioned
- Only use "Hiring Manager" as a fallback if no name is found
- Use the EXACT current date provided: ${currentDate} (format: dd-MMM-yyyy)

Respond with the complete cover letter text only, formatted as a professional business letter. Use line breaks between sections. Do not include markdown formatting, code blocks, or additional commentary.`;
    
    const coverLetter = await callOpenAI(userPrompt, 'gpt-4o', systemPrompt);
    
    // Display cover letter
    const coverLetterResult = document.getElementById('coverLetterResult');
    document.getElementById('coverLetterSection').style.display = 'block';
    coverLetterResult.style.display = 'block';
    coverLetterResult.innerHTML = `
      <h3>Generated Cover Letter</h3>
      <div style="background: var(--bg-primary); padding: 16px; border-radius: 8px; margin: 12px 0; white-space: pre-wrap; line-height: 1.6; max-height: 400px; overflow-y: auto; font-family: 'Times New Roman', serif;">
        ${coverLetter.replace(/\n/g, '<br>')}
      </div>
      <button id="downloadCoverLetterBtn" class="btn btn-primary" style="width: 100%; margin-top: 12px; padding: 12px;">
        📥 Download Cover Letter as PDF
      </button>
    `;
    
    // Store cover letter for PDF download
    window.coverLetterText = coverLetter;
    
    // Attach download button event listener
    setTimeout(() => {
      const downloadBtn = document.getElementById('downloadCoverLetterBtn');
      if (downloadBtn) {
        // Remove any existing listeners
        const newBtn = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
        newBtn.addEventListener('click', window.downloadCoverLetterPDF);
        console.log('Download button event listener attached');
      }
    }, 100);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error generating cover letter:', error);
    alert('Error generating cover letter: ' + error.message);
  }
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
async function callOpenAI(prompt, model = null, systemPrompt = null) {
  if (!apiKey) {
    throw new Error('API key not set');
  }
  
  // Use selected model if not provided
  const useModel = model || selectedModel;
  
  if (aiProvider === 'openai') {
    // OpenAI API call
    const messages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    } else {
      messages.push({
        role: 'system',
        content: 'You are a helpful assistant that always responds with valid JSON when requested. Do not include markdown code blocks or any text outside the JSON.'
      });
    }
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt
    });
    
    // Prepare request body
    const requestBody = {
      model: useModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    };
    
    // Add response_format for JSON responses (when system prompt indicates JSON)
    if (systemPrompt && (systemPrompt.includes('JSON') || prompt.includes('JSON'))) {
      if (useModel.includes('gpt-4') || useModel.includes('gpt-3.5')) {
        requestBody.response_format = { type: 'json_object' };
      }
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
  } else {
    // Gemini API call
    const contents = [];
    
    // Gemini uses parts instead of role/content
    // Combine system prompt and user prompt
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }
    
    contents.push({
      parts: [{ text: fullPrompt }]
    });
    
    // Prepare request body for Gemini
    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    };
    
    // Add JSON response format if needed
    if (systemPrompt && (systemPrompt.includes('JSON') || prompt.includes('JSON'))) {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
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
// Download cover letter PDF
window.downloadCoverLetterPDF = async function() {
  console.log('Download button clicked');
  console.log('Cover letter text available:', !!window.coverLetterText);
  
  if (!window.coverLetterText) {
    alert('Cover letter not available. Please generate a cover letter first.');
    return;
  }
  
  // Check if jsPDF is loaded
  if (typeof window.jspdf === 'undefined') {
    alert('PDF library not loaded. Please refresh the extension and try again.');
    return;
  }
  
  try {
    showLoading('Generating PDF file...');
    
    // Get jsPDF
    const { jsPDF } = window.jspdf;
    
    // Create new PDF document (Letter size: 8.5 x 11 inches)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    // Set font to Times New Roman
    doc.setFont('times', 'normal');
    doc.setFontSize(11); // Slightly smaller font to fit on one page
    
    // Page dimensions in mm (Letter: 215.9 x 279.4 mm)
    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const margin = 25.4; // 1 inch = 25.4mm
    const maxWidth = pageWidth - (2 * margin);
    const maxHeight = pageHeight - (2 * margin);
    
    let yPosition = margin;
    let lineHeight = 6; // Tighter line spacing
    let paragraphSpacing = 4; // Reduced paragraph spacing
    
    // Split content into paragraphs
    const paragraphs = window.coverLetterText.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Pre-calculate all lines to check if they fit on one page
    let totalHeight = 0;
    const allLines = [];
    
    paragraphs.forEach((paragraph) => {
      const text = paragraph.trim();
      const lines = doc.splitTextToSize(text, maxWidth);
      allLines.push(lines);
      totalHeight += (lines.length * lineHeight);
    });
    
    // Add paragraph spacing
    totalHeight += (paragraphs.length - 1) * paragraphSpacing;
    
    // If content is too long, reduce font size and spacing
    if (totalHeight > maxHeight) {
      doc.setFontSize(10.5);
      lineHeight = 5.5;
      paragraphSpacing = 3;
      
      // Recalculate with adjusted spacing
      totalHeight = 0;
      allLines.length = 0;
      paragraphs.forEach((paragraph) => {
        const text = paragraph.trim();
        const lines = doc.splitTextToSize(text, maxWidth);
        allLines.push(lines);
        totalHeight += (lines.length * lineHeight);
      });
      totalHeight += (paragraphs.length - 1) * paragraphSpacing;
    }
    
    // Add content to PDF (ensuring it fits on one page)
    paragraphs.forEach((paragraph, index) => {
      const lines = allLines[index];
      
      // Add each line of the paragraph
      lines.forEach((line) => {
        // Safety check - don't exceed page height
        if (yPosition + lineHeight > pageHeight - margin) {
          console.warn('Cover letter content exceeds one page. The prompt should ensure single-page length.');
          return; // Stop adding content if it exceeds one page
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      
      // Add spacing between paragraphs (except after last paragraph)
      if (index < paragraphs.length - 1) {
        yPosition += paragraphSpacing;
      }
    });
    
    // Generate PDF blob
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Convert blob to data URL for download
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      
      // Download using Chrome Downloads API
      chrome.downloads.download({
        url: dataUrl,
        filename: 'Cover_Letter.pdf',
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          hideLoading();
          
          // Fallback: create download link
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = 'Cover_Letter.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showNotification('Cover letter PDF downloaded!');
        } else {
          console.log('PDF downloaded with ID:', downloadId);
          hideLoading();
          showNotification('Cover letter PDF downloaded successfully!');
        }
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 2000);
      });
    };
    
    reader.onerror = function(error) {
      hideLoading();
      console.error('FileReader error:', error);
      alert('Error creating PDF file: ' + error.message);
    };
    
    reader.readAsDataURL(pdfBlob);
    
  } catch (error) {
    hideLoading();
    console.error('Error generating PDF:', error);
    alert('Error generating PDF: ' + error.message);
  }
};

// Fallback function for section downloads (HTML format)
async function generatePDFFallback(content, filename) {
  try {
    const htmlContent = formatCoverLetterHTML(content);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    chrome.tabs.create({
      url: url,
      active: true
    });
    
    showNotification('Section opened in new tab. Press Ctrl/Cmd+P to save as PDF');
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (error) {
    console.error('Fallback error:', error);
    throw error;
  }
}

// Format cover letter as HTML
function formatCoverLetterHTML(content) {
  // Preserve the original formatting - split by paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Format each paragraph
  const formattedParagraphs = paragraphs.map(para => {
    // Clean up the paragraph
    const cleaned = para.trim().replace(/\n/g, ' ');
    return `<p style="margin-bottom: 1em; text-align: justify;">${escapeHTML(cleaned)}</p>`;
  }).join('\n');
  
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Cover Letter</title>
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
        .print-instructions {
          display: none !important;
        }
      }
      body {
        font-family: 'Times New Roman', 'Georgia', serif;
        font-size: 12pt;
        line-height: 1.8;
        padding: 1in;
        max-width: 8.5in;
        margin: 0 auto;
        color: #000;
        background: #fff;
      }
      .cover-letter-content {
        margin: 0;
      }
      .cover-letter-content p {
        margin-bottom: 1em;
        text-align: justify;
      }
      .print-instructions {
        background: linear-gradient(135deg, #f0f7ff, #e8f4ff);
        border: 2px solid #4a9eff;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .print-instructions h3 {
        margin-top: 0;
        color: #4a9eff;
        font-size: 18px;
      }
      .print-instructions ol {
        margin: 10px 0;
        padding-left: 25px;
      }
      .print-instructions li {
        margin-bottom: 8px;
      }
      .print-instructions kbd {
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 3px;
        padding: 2px 6px;
        font-family: monospace;
        font-size: 12px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      .print-button {
        margin: 15px 0 0 0;
        padding: 12px 24px;
        background: #4a9eff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: background 0.3s;
      }
      .print-button:hover {
        background: #357abd;
      }
      .print-button:active {
        transform: scale(0.98);
      }
    </style>
  </head>
  <body>
    <div class="print-instructions">
      <h3>📄 Cover Letter - Ready to Download as PDF</h3>
      <p><strong>To save as PDF:</strong></p>
      <ol>
        <li>Click the button below to open the print dialog, OR</li>
        <li>Press <kbd>Ctrl+P</kbd> (Windows/Linux) or <kbd>Cmd+P</kbd> (Mac)</li>
        <li>In the print dialog, select <strong>"Save as PDF"</strong> or <strong>"Microsoft Print to PDF"</strong> as the destination</li>
        <li>Click <strong>"Save"</strong> or <strong>"Print"</strong></li>
      </ol>
      <button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
    <div class="cover-letter-content">
      ${formattedParagraphs}
    </div>
    <script>
      // Auto-trigger print dialog after a short delay
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 300);
      };
    </script>
  </body>
</html>`;
}

// Escape HTML characters
function escapeHTML(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Check resume status and enable/disable buttons
function checkResumeStatus() {
  const hasResume = !!resumeText;
  const hasApiKey = !!apiKey;
  const hasJobDesc = !!jobPostingText || (document.getElementById('jobDescriptionInput')?.value.trim() || '').length > 0;
  
  const analyzeResumeBtn = document.getElementById('analyzeResume');
  const generateCoverBtn = document.getElementById('generateCoverLetter');
  const analyzeJobDescBtn = document.getElementById('analyzeJobDescription');
  
  if (analyzeResumeBtn) {
    analyzeResumeBtn.disabled = !hasResume || !hasApiKey;
  }
  if (generateCoverBtn) {
    generateCoverBtn.disabled = !hasResume || !hasApiKey;
  }
  if (analyzeJobDescBtn) {
    analyzeJobDescBtn.disabled = !hasResume || !hasApiKey || !hasJobDesc;
  }
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
