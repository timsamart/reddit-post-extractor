chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchRedditJSON') {
      fetch(request.url)
        .then(response => response.json())
        .then(data => {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'redditJSONFetched',
            success: true,
            data: data
          });
        })
        .catch(error => {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'redditJSONFetched',
            success: false,
            error: error.toString()
          });
        });
      return true; // Indicates that the response is sent asynchronously
    }
  });