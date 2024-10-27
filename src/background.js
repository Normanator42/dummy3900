/* global chrome */

const trackedTabs = {}; // Object to store tracked tabs and their domains

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'openAndTrack') {
    const url = message.url;
    const targetOrigin = new URL(url).origin + '/*';
    const targetDomain = new URL(url).hostname;

    // Request permissions for the target URL
    chrome.permissions.request(
      {
        origins: [targetOrigin]
      },
      function(granted) {
        if (granted) {
          // Open the new tab
          chrome.tabs.create({ url: url }, function(tab) {
            const newTabId = tab.id;

            // Store the tab ID and the domain
            trackedTabs[newTabId] = {
              domain: targetDomain,
            };

            // Inject content script into the new tab
            chrome.scripting.executeScript(
              {
                target: { tabId: newTabId },
                files: ['content.js'],
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error('Script injection failed:', chrome.runtime.lastError);
                } else {
                  console.log('Content script injected into tab:', newTabId);
                }
              }
            );
          });
        } else {
          console.warn('Permission not granted for', url);
        }

        // Send a response back to the content script
        sendResponse({ status: 'completed' });
      }
    );

    return true; // Indicate that sendResponse will be called asynchronously
  } else if (message.type === 'log') {
    // Handle log messages from content scripts
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

// Listen for navigation events in tracked tabs
chrome.webNavigation.onCommitted.addListener((details) => {
  const tabId = details.tabId;
  if (trackedTabs.hasOwnProperty(tabId)) {
    const url = new URL(details.url);
    const trackedDomain = trackedTabs[tabId].domain;

    if (url.hostname === trackedDomain) {
      // Re-inject content script into the tab
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ['content.js'],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('Script re-injection failed:', chrome.runtime.lastError);
          } else {
            console.log('Content script re-injected into tab:', tabId);
          }
        }
      );
    } else {
      // If navigated away from the tracked domain, stop tracking
      console.log(`Navigated away from ${trackedDomain}. Stopping tracking on tab ${tabId}.`);
      delete trackedTabs[tabId];
    }
  }
});

// Clean up when the tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (trackedTabs.hasOwnProperty(tabId)) {
    console.log(`Tab ${tabId} closed. Stopping tracking.`);
    delete trackedTabs[tabId];
  }
});
