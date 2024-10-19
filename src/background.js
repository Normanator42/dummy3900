/* global chrome */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'log') {
    fetch('http://localhost:5002/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: message.data.eventType,
        data: message.data,
        timestamp: message.data.timestamp,
      }),
    })
    .then(() => {
      sendResponse({ status: 'success' });
    })
    .catch((error) => {
      console.error('Error sending data to the server:', error);
      sendResponse({ status: 'error' });
    });
    
    // Indicate that the response will be sent asynchronously
    return true; 
  }
});
