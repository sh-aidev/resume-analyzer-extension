// Utility functions for the extension

// PDF text extraction using pdf.js (simplified version)
// Note: For production, you should include pdf.js library
async function extractTextFromPDFUsingPDFJS(file) {
  // This is a placeholder - you'll need to include pdf.js library
  // Example: https://mozilla.github.io/pdf.js/
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // If pdf.js is loaded, use it here
        // const pdf = await pdfjsLib.getDocument(e.target.result).promise;
        // ... extract text from pages
        
        // For now, return a placeholder
        resolve('PDF text extraction requires pdf.js library integration');
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// Helper function to validate OpenAI API key format
function isValidApiKey(key) {
  return key && key.startsWith('sk-') && key.length > 20;
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

