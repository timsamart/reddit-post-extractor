const iconUrl = chrome.runtime.getURL('icon.png');

function addIconToRedditLinks() {
    const links = document.querySelectorAll('a[href^="https://www.reddit.com/r/"]');
    links.forEach(link => {
      if (!link.querySelector('.reddit-json-icon')) {
        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL('icon.png');
        icon.className = 'reddit-json-icon';
        icon.title = 'Extract Reddit JSON';
        icon.style.cssText = `
          display: inline-block;
          width: 32px;
          height: 32px;
          margin-right: 10px;
          vertical-align: middle;
          cursor: pointer;
          position: relative;
          z-index: 1000;
        `;
        icon.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          extractRedditJSON(link.href);
        });
        link.insertBefore(icon, link.firstChild);
      }
    });
  }

function extractRedditJSON(url) {
  const jsonUrl = url.replace('https://www.reddit.com', 'https://old.reddit.com') + '.json';
  chrome.runtime.sendMessage({action: 'fetchRedditJSON', url: jsonUrl});
}

function extractCurrentPage() {
  const jsonUrl = window.location.href.replace('https://www.reddit.com', 'https://old.reddit.com') + '.json';
  chrome.runtime.sendMessage({action: 'fetchRedditJSON', url: jsonUrl});
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'redditJSONFetched') {
    if (message.success) {
      const extractedData = extractRelevantData(message.data);
      copyToClipboard(JSON.stringify(extractedData, null, 2));
      showNotification('Reddit JSON data copied to clipboard!');
    } else {
      console.error('Error:', message.error);
      showNotification('Failed to fetch Reddit data. Please try again.');
    }
  } else if (message.action === 'extractCurrentPage') {
    extractCurrentPage();
  } else if (message.action === 'showNotification') {
    showNotification(message.message);
  }
});

function extractRelevantData(data) {
  const post = data[0].data.children[0].data;
  const comments = data[1].data.children;
  
  return {
    post: {
      upvotes: post.ups,
      name: post.name,
      content: post.selftext
    },
    comments: extractComments(comments)
  };
}

function extractComments(comments) {
  return comments.map(comment => ({
    upvotes: comment.data.ups,
    name: comment.data.name,
    content: comment.data.body,
    replies: comment.data.replies ? extractComments(comment.data.replies.data.children) : []
  }));
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = 'reddit-json-notification';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initial run
addIconToRedditLinks();

// Monitor for dynamically added content
const observer = new MutationObserver(addIconToRedditLinks);
observer.observe(document.body, { childList: true, subtree: true });