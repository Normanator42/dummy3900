/* global chrome */

const YOUR_WEBPAGE_URL = 'http://localhost:3000'; // Replace with your webpage URL
const TRACKED_DOMAIN = 'www.nasa.gov'; // Domain to track
let trackedTabId = null; // Variable to store the tracked tab ID

// Listen for when a navigation event creates a new tab
chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
  chrome.tabs.get(details.sourceTabId, (sourceTab) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting source tab:', chrome.runtime.lastError);
      return;
    }

    // Check if the source tab is your webpage
    if (sourceTab.url && sourceTab.url.startsWith(YOUR_WEBPAGE_URL)) {
      trackedTabId = details.tabId; // Store the tab ID

      // Inject content script into the newly created tab
      chrome.scripting.executeScript(
        {
          target: { tabId: details.tabId },
          files: ['content.js'],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('Script injection failed:', chrome.runtime.lastError);
          } else {
            console.log('Content script injected into tab:', details.tabId);
          }
        }
      );
    }
  });
});

// Listen for navigation events in the tracked tab
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.tabId === trackedTabId) {
    const url = new URL(details.url);
    if (url.hostname === TRACKED_DOMAIN) {
      // Re-inject content script into the tab
      chrome.scripting.executeScript(
        {
          target: { tabId: details.tabId },
          files: ['content.js'],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('Script re-injection failed:', chrome.runtime.lastError);
          } else {
            console.log('Content script re-injected into tab:', details.tabId);
          }
        }
      );
    } else {
      // If navigated away from the tracked domain, stop tracking
      console.log(`Navigated away from ${TRACKED_DOMAIN}. Stopping tracking on tab ${details.tabId}.`);
      trackedTabId = null;
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'log') {
    // Your existing code to handle log messages from content.js
    // Prepare data in the format expected by the server
    const activityData = {
      eventType: message.data.eventType,
      elementTag: message.data.elementTag || '',
      elementText: message.data.elementText || '',
      url: message.data.url || '',
      timestamp: message.data.timestamp,
      scrollY: message.data.scrollY || 0,
    };

    fetch('http://localhost:5002/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        console.log('Data successfully sent to server');
        sendResponse({ status: 'success' });
      })
      .catch((error) => {
        console.error('Error sending data to the server:', error);
        sendResponse({ status: 'error', message: error.message });
      });

    return true; // Indicate that the response will be sent asynchronously
  }
});

// Clean up when the tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === trackedTabId) {
    console.log(`Tab ${tabId} closed. Stopping tracking.`);
    trackedTabId = null;
  }
});
