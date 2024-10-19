/* global chrome */

// Ensure this runs only on external pages
if (window.location.hostname !== "localhost") {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const activityData = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      interactions: []
    };

    // Track click events
    document.addEventListener('click', function(event) {
      const data = {
        eventType: 'click',
        elementTag: event.target.tagName,
        timestamp: new Date().toISOString(),
      };

      chrome.runtime.sendMessage({ type: 'log', data }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Message send error:", chrome.runtime.lastError.message);
        } else {
          console.log("Response from background script:", response);
        }
      });
    });

    // Track scroll events
    window.addEventListener('scroll', function() {
      activityData.interactions.push({
        type: 'scroll',
        scrollY: window.scrollY,
        timestamp: new Date().toISOString()
      });
      console.log("Scroll event logged, position:", window.scrollY);
    });
  }
}
