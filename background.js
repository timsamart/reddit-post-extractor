chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchRedditJSON') {
      fetch(request.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
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
  
  chrome.action.onClicked.addListener((tab) => {
    if (tab.url.includes('reddit.com')) {
      chrome.tabs.sendMessage(tab.id, {action: 'extractCurrentPage'});
    } else {
      chrome.tabs.sendMessage(tab.id, {action: 'showNotification', message: 'This is not a Reddit page.'});
    }
  });