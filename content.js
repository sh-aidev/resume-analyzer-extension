// Content script for job posting detection and text selection

let isSelectionMode = false;
let selectionPopup = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobPosting') {
    const jobContent = extractJobPostingContent();
    sendResponse({ content: jobContent });
  } else if (request.action === 'enableTextSelection') {
    enableTextSelection();
    sendResponse({ success: true });
  } else if (request.action === 'disableTextSelection') {
    disableTextSelection();
    sendResponse({ success: true });
  } else if (request.action === 'showNotification') {
    // Show a temporary notification on the page
    showPageNotification(request.message);
    sendResponse({ success: true });
  }
  return true;
});

// Enable text selection mode
function enableTextSelection() {
  if (isSelectionMode) return;
  
  isSelectionMode = true;
  document.body.style.cursor = 'text';
  document.body.style.userSelect = 'text';
  
  // Add event listeners
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keydown', handleEscapeKey);
  
  // Show instruction overlay
  showSelectionInstruction();
}

// Disable text selection mode
function disableTextSelection() {
  if (!isSelectionMode) return;
  
  isSelectionMode = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // Remove event listeners
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('keydown', handleEscapeKey);
  
  // Remove popup if exists
  if (selectionPopup) {
    selectionPopup.remove();
    selectionPopup = null;
  }
  
  // Remove instruction overlay
  const instruction = document.getElementById('resume-analyzer-instruction');
  if (instruction) instruction.remove();
}

// Handle text selection
function handleTextSelection(e) {
  // Use setTimeout to ensure selection is fully captured
  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Remove popup if no selection
      if (selectionPopup) {
        selectionPopup.remove();
        selectionPopup = null;
      }
      return;
    }
    
    const selectedText = selection.toString().trim();
    console.log('Text selected:', selectedText.length, 'characters');
    
    if (selectedText.length > 20) {
      // Show popup near selection
      showSelectionPopup(selectedText, e);
    } else if (selectionPopup) {
      selectionPopup.remove();
      selectionPopup = null;
    }
  }, 50); // Small delay to ensure selection is captured
}

// Show selection popup
function showSelectionPopup(text, event) {
  // Remove existing popup
  if (selectionPopup) {
    selectionPopup.remove();
  }
  
  // Get selection range
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Calculate popup position (try to keep it on screen)
  let popupTop = rect.bottom + window.scrollY + 10;
  let popupLeft = rect.left + window.scrollX;
  
  // Adjust if popup would go off screen
  const popupWidth = 320;
  const popupHeight = 200;
  
  // Adjust horizontal position
  if (popupLeft + popupWidth > window.innerWidth + window.scrollX) {
    popupLeft = window.innerWidth + window.scrollX - popupWidth - 10;
  }
  if (popupLeft < window.scrollX + 10) {
    popupLeft = window.scrollX + 10;
  }
  
  // Adjust vertical position
  if (popupTop + popupHeight > window.innerHeight + window.scrollY) {
    popupTop = rect.top + window.scrollY - popupHeight - 10;
  }
  if (popupTop < window.scrollY + 10) {
    popupTop = window.scrollY + 10;
  }
  
  console.log('Showing popup at:', popupTop, popupLeft, 'for text length:', text.length);
  
  // Create popup element
  selectionPopup = document.createElement('div');
  selectionPopup.id = 'resume-analyzer-popup';
  selectionPopup.style.cssText = `
    position: fixed;
    top: ${popupTop}px;
    left: ${popupLeft}px;
    background: white;
    color: #333;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    border: 1px solid #e0e0e0;
  `;
  
  selectionPopup.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 12px; color: #333; font-size: 15px;">📋 Selected Text</div>
    <div style="font-size: 12px; color: #666; margin-bottom: 16px; max-height: 60px; overflow: hidden; text-overflow: ellipsis;">
      ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}
    </div>
    <div style="display: flex; gap: 8px; flex-direction: column;">
      <button id="analyze-btn" style="
        background: linear-gradient(135deg, #4a9eff, #6c5ce7);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: transform 0.2s, box-shadow 0.2s;
        width: 100%;
      " onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(74, 158, 255, 0.4)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
        📊 Get ATS Score for This Job
      </button>
      <button id="cover-letter-btn" style="
        background: linear-gradient(135deg, #00b894, #00cec9);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: transform 0.2s, box-shadow 0.2s;
        width: 100%;
      " onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(0, 184, 148, 0.4)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
        ✉️ Generate Cover Letter
      </button>
      <button id="cancel-btn" style="
        background: #f5f5f5;
        color: #666;
        border: 1px solid #e0e0e0;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
        width: 100%;
      " onmouseover="this.style.background='#e8e8e8';" onmouseout="this.style.background='#f5f5f5';">
        Cancel
      </button>
    </div>
  `;
  
  // Add event listeners for buttons
  const analyzeBtn = selectionPopup.querySelector('#analyze-btn');
  const coverLetterBtn = selectionPopup.querySelector('#cover-letter-btn');
  const cancelBtn = selectionPopup.querySelector('#cancel-btn');
  
  analyzeBtn.addEventListener('click', () => {
    sendSelectedTextToExtension(text, 'analyze');
    disableTextSelection();
  });
  
  coverLetterBtn.addEventListener('click', () => {
    sendSelectedTextToExtension(text, 'coverLetter');
    disableTextSelection();
  });
  
  cancelBtn.addEventListener('click', () => {
    disableTextSelection();
  });
  
  document.body.appendChild(selectionPopup);
  console.log('Popup added to DOM');
  
  // Ensure popup is visible
  setTimeout(() => {
    if (selectionPopup && selectionPopup.parentNode) {
      selectionPopup.style.display = 'block';
      selectionPopup.style.visibility = 'visible';
      selectionPopup.style.opacity = '1';
      console.log('Popup should be visible now');
    }
  }, 10);
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (selectionPopup) {
      selectionPopup.remove();
      selectionPopup = null;
    }
  }, 15000);
}

// Send selected text to extension
function sendSelectedTextToExtension(text, actionType = 'analyze') {
  chrome.runtime.sendMessage({
    action: 'selectedText',
    text: text,
    actionType: actionType // 'analyze' or 'coverLetter'
  });
}

// Show instruction overlay
function showSelectionInstruction() {
  const instruction = document.createElement('div');
  instruction.id = 'resume-analyzer-instruction';
  instruction.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 16px;
    border-radius: 8px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  `;
  
  instruction.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px;">📋 Text Selection Mode Active</div>
    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
      Select any text on this page to analyze it as a job description.
    </div>
    <div style="font-size: 11px; opacity: 0.7;">
      Press ESC to cancel
    </div>
  `;
  
  document.body.appendChild(instruction);
}

// Handle escape key
function handleEscapeKey(e) {
  if (e.key === 'Escape' && isSelectionMode) {
    disableTextSelection();
  }
}

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

// Show notification on the page
function showPageNotification(message) {
  // Remove existing notification if any
  const existing = document.getElementById('resume-analyzer-page-notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.id = 'resume-analyzer-page-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4a9eff, #6c5ce7);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 100000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    max-width: 350px;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
        if (style.parentNode) {
          style.remove();
        }
      }, 300);
    }
  }, 3000);
}
