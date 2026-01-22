// Background service worker for Chrome extension

// Create context menu items when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Resume Analyzer extension installed');
  
  // Remove old context menu items if they exist
  chrome.contextMenus.removeAll(() => {
    // Create parent menu item
    chrome.contextMenus.create({
      id: 'resume-analyzer-parent',
      title: 'Resume Analyzer',
      contexts: ['selection'] // Only show when text is selected
    });
    
    // Create "Get ATS Score for This Job" option under parent
    chrome.contextMenus.create({
      id: 'analyze-resume',
      parentId: 'resume-analyzer-parent',
      title: '📊 Get ATS Score for This Job',
      contexts: ['selection']
    });
    
    // Create "Generate Cover Letter" option under parent
    chrome.contextMenus.create({
      id: 'generate-cover-letter',
      parentId: 'resume-analyzer-parent',
      title: '✉️ Generate Cover Letter',
      contexts: ['selection']
    });
    
    // Create "In-depth Resume Analysis" option under parent
    chrome.contextMenus.create({
      id: 'resume-analysis',
      parentId: 'resume-analyzer-parent',
      title: '📝 In-depth Resume Analysis',
      contexts: ['selection']
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  
  if (!selectedText || selectedText.trim().length < 20) {
    console.log('Selected text too short or empty');
    return;
  }
  
  if (info.menuItemId === 'analyze-resume') {
    // Store selected text and action type
    chrome.storage.local.set({
      lastSelectedText: selectedText,
      lastSelectedAction: 'analyze'
    }, () => {
      // Show notification on page
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: 'Job description selected! Click the extension icon to get ATS score.'
      }).catch(() => {
        // Content script might not be available, that's okay
      });
      
      // Set badge to indicate action is ready
      chrome.action.setBadgeText({
        text: '!',
        tabId: tab.id
      });
      chrome.action.setBadgeBackgroundColor({ color: '#4a9eff' });
    });
  } else if (info.menuItemId === 'generate-cover-letter') {
    // Store selected text and action type
    chrome.storage.local.set({
      lastSelectedText: selectedText,
      lastSelectedAction: 'coverLetter'
    }, () => {
      // Show notification on page
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: 'Job description selected! Click the extension icon to generate cover letter.'
      }).catch(() => {
        // Content script might not be available, that's okay
      });
      
      // Set badge to indicate action is ready
      chrome.action.setBadgeText({
        text: '!',
        tabId: tab.id
      });
      chrome.action.setBadgeBackgroundColor({ color: '#00b894' });
    });
  } else if (info.menuItemId === 'resume-analysis') {
    // Store selected text and action type
    chrome.storage.local.set({
      lastSelectedText: selectedText,
      lastSelectedAction: 'resumeAnalysis'
    }, () => {
      // Show notification on page
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: 'Job description selected! Click the extension icon for resume analysis.'
      }).catch(() => {
        // Content script might not be available, that's okay
      });
      
      // Set badge to indicate action is ready
      chrome.action.setBadgeText({
        text: '!',
        tabId: tab.id
      });
      chrome.action.setBadgeBackgroundColor({ color: '#9b59b6' });
    });
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeJobPosting') {
    // Handle job posting analysis
    sendResponse({ success: true });
  } else if (request.action === 'selectedText') {
    // Store selected text temporarily for popup to retrieve
    chrome.storage.local.set({ 
      lastSelectedText: request.text,
      lastSelectedAction: request.actionType || 'analyze'
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
  return true; // Keep message channel open for async response
});

