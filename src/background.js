/* global chrome */

const YOUR_WEBPAGE_URL = 'http://localhost:3000'; // Replace with your webpage URL
const TRACKED_DOMAIN = 'https://www.nasa.gov'; // Domain to track
const trackedTabs = new Set(); // Set to keep track of relevant tab IDs

// Listen for when a navigation event creates a new tab
chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
  chrome.tabs.get(details.sourceTabId, (sourceTab) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting source tab:', chrome.runtime.lastError);
      return;
    }

    // Check if the source tab is your webpage
    if (sourceTab.url && sourceTab.url.startsWith(YOUR_WEBPAGE_URL)) {
      // Add the new tab to tracked tabs
      trackedTabs.add(details.tabId);

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

// Listen for navigation events in tracked tabs
chrome.webNavigation.onCommitted.addListener((details) => {
  if (trackedTabs.has(details.tabId)) {
    if (details.url.startsWith(TRACKED_DOMAIN)) {
      // Re-inject content script into the tab
      chrome.scripting.executeScript(
        {
          target: { tabId: details.tabId },
          files: ['content.js'],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('Script injection failed on navigation:', chrome.runtime.lastError);
          } else {
            console.log('Content script re-injected into tab:', details.tabId);
          }
        }
      );
    } else {
      // If navigated away from the domain, stop tracking this tab
      trackedTabs.delete(details.tabId);
    }
  }
});

// Handle messages from content scripts (existing code)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'openAndTrack') {
    const url = message.url;

    // Request permissions for the target URL
    chrome.permissions.request(
      {
        origins: [new URL(url).origin + '/*']
      },
      (granted) => {
        if (granted) {
          // Open the new tab
          chrome.tabs.create({ url: url }, function(tab) {
            // Inject content script into the new tab
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                files: ['content.js'],
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error('Script injection failed:', chrome.runtime.lastError);
                } else {
                  console.log('Content script injected into tab:', tab.id);
                }
              }
            );
          });
        } else {
          console.warn('Permission not granted for', url);
        }
      }
    );

    sendResponse({ status: 'requestingPermission' });
    return true; // Indicates response will be sent asynchronously
  } else if (message.type === 'log') {
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
  } else {
    console.warn('Unhandled message type:', message.type);
    sendResponse({ status: 'unhandled' });
  }
});

// Clean up tracked tabs when they are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (trackedTabs.has(tabId)) {
    trackedTabs.delete(tabId);
  }
});