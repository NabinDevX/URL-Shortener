// Content script for URL Shortener extension
// This script runs in the context of web pages

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "getCurrentUrl":
      sendResponse({ url: window.location.href });
      break;

    case "getPageInfo":
      sendResponse({
        url: window.location.href,
        title: document.title,
        description:
          document.querySelector('meta[name="description"]')?.content || "",
      });
      break;

    case "getSelectedText":
      const selectedText = window.getSelection()?.toString() || "";
      sendResponse({ selectedText });
      break;

    case "copyToClipboard":
      navigator.clipboard
        .writeText(request.text)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // Keep the message channel open for async response

    case "showNotification":
      showNotification(request.message, request.type);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: "Unknown action" });
  }

  return true; // Keep the message channel open for async responses
});

// Show a notification toast on the page
function showNotification(message, type = "success") {
  // Remove existing notification if any
  const existingNotification = document.getElementById(
    "url-shortener-notification"
  );
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.id = "url-shortener-notification";
  notification.textContent = message;

  // Apply styles
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 24px",
    borderRadius: "8px",
    backgroundColor:
      type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3",
    color: "white",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: "2147483647",
    transition: "opacity 0.3s ease-in-out",
    opacity: "0",
  });

  document.body.appendChild(notification);

  // Fade in
  requestAnimationFrame(() => {
    notification.style.opacity = "1";
  });

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize content script
console.log("URL Shortener content script loaded");

// Export a React component if needed for UI injection
export default function ContentPage() {
  return null; // Content script UI can be added here if needed
}
