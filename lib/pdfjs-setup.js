// PDF.js setup script
// This will load pdf.js from CDN or use a local copy

// For Chrome extensions, we'll use the CDN version
// Make sure to update manifest.json to allow the CDN domain

// PDF.js worker URL (using CDN)
const PDFJS_VERSION = '4.0.379'; // Latest stable version
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/`;

// Set up PDF.js
if (typeof pdfjsLib === 'undefined') {
  // Dynamically load PDF.js if not already loaded
  const script = document.createElement('script');
  script.src = `${PDFJS_CDN}pdf.min.js`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
  
  script.onload = () => {
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}pdf.worker.min.js`;
      console.log('PDF.js loaded successfully');
    }
  };
  
  script.onerror = () => {
    console.error('Failed to load PDF.js from CDN. Using fallback method.');
  };
} else {
  // PDF.js already loaded, just set worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}pdf.worker.min.js`;
}

