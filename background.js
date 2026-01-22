// Background service worker for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Resume ATS Scorer extension installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeJobPosting') {
    // Handle job posting analysis
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

