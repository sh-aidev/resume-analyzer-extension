// Content script for job posting detection

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobPosting') {
    const jobContent = extractJobPostingContent();
    sendResponse({ content: jobContent });
  }
  return true;
});

// Extract job posting content
function extractJobPostingContent() {
  // Common job posting selectors
  const selectors = [
    '[data-job-id]',
    '.job-description',
    '.job-post',
    '.job-description-text',
    '.job-summary',
    '[class*="job-description"]',
    '[class*="job-post"]',
    '[class*="position"]',
    '[id*="job"]',
    '[id*="position"]',
    'article',
    'main'
  ];
  
  let bestContent = '';
  let maxLength = 0;
  
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = (el.innerText || el.textContent || '').trim();
        if (text.length > maxLength && text.length > 200) {
          maxLength = text.length;
          bestContent = text;
        }
      });
    } catch (e) {
      // Continue with next selector
    }
  }
  
  // Fallback: extract from body if no specific selector found
  if (bestContent.length < 200) {
    // Remove script and style tags
    const bodyClone = document.body.cloneNode(true);
    const scripts = bodyClone.querySelectorAll('script, style, nav, header, footer, aside');
    scripts.forEach(el => el.remove());
    
    bestContent = (bodyClone.innerText || bodyClone.textContent || '').trim();
  }
  
  return bestContent.substring(0, 10000); // Limit to 10k characters
}

