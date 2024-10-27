/* global chrome */

console.log('Content script loaded on', window.location.href);

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
  // Track click events
  document.addEventListener('click', function (event) {
    const data = {
      eventType: 'click',
      elementTag: event.target.tagName,
      elementText: event.target.innerText || '',
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    console.log('Sending click event data:', data);

    chrome.runtime.sendMessage({ type: 'log', data }, function (response) {
      if (chrome.runtime.lastError) {
        console.error('Message send error:', chrome.runtime.lastError.message);
      } else if (response && response.status === 'success') {
        console.log('Background script acknowledged message:', response);
      } else {
        console.error('Unexpected response from background script:', response);
      }
    });
  });

  // Track scroll events
  window.addEventListener('scroll', function () {
    const data = {
      eventType: 'scroll',
      scrollY: window.scrollY,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    console.log('Sending scroll event data:', data);

    chrome.runtime.sendMessage({ type: 'log', data }, function (response) {
      if (chrome.runtime.lastError) {
        console.error('Message send error:', chrome.runtime.lastError.message);
      } else if (response && response.status === 'success') {
        console.log('Background script acknowledged message:', response);
      } else {
        console.error('Unexpected response from background script:', response);
      }
    });
  });
} else {
  console.error('Chrome runtime or sendMessage API is not available.');
}
