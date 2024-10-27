// sourceContent.js
/* global chrome */

document.addEventListener('click', function(event) {
  let target = event.target;

  // Traverse up to find the nearest anchor tag
  while (target && target.nodeName !== 'A') {
    target = target.parentElement;
  }

  if (target && target.nodeName === 'A' && target.href) {
    // Prevent the default action
    event.preventDefault();

    const url = target.href;

    // Send a message to the background script with the URL
    chrome.runtime.sendMessage({ type: 'openAndTrack', url: url }, function(response) {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError.message);
      } else {
        console.log('Background script response:', response);
      }
    });
  }
});
