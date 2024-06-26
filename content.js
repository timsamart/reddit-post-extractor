const iconUrl = chrome.runtime.getURL('icon.png');

function addIconToRedditLinks() {
  try {
    const links = document.querySelectorAll('a[href^="https://www.reddit.com/r/"]');
    links.forEach(link => {
      if (!link.querySelector('.reddit-json-icon')) {
        const icon = document.createElement('img');
        icon.src = iconUrl;
        icon.className = 'reddit-json-icon';
        icon.title = 'Extract Reddit JSON';
        icon.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          extractRedditJSON(link.href);
        });
        link.insertBefore(icon, link.firstChild);
      }
    });
  } catch (error) {
    console.error('Error adding Reddit JSON icons:', error);
  }
}

function extractRedditJSON(url) {
  try {
    const jsonUrl = url.replace('https://www.reddit.com', 'https://old.reddit.com') + '.json';
    chrome.runtime.sendMessage({ action: 'fetchRedditJSON', url: jsonUrl });
  } catch (error) {
    console.error('Error extracting Reddit JSON:', error);
    alert('Failed to extract Reddit JSON. Please try again.');
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'redditJSONFetched') {
    try {
      if (message.success) {
        const extractedData = extractRelevantData(message.data);
        copyToClipboard(JSON.stringify(extractedData, null, 2));
      } else {
        console.error('Error fetching Reddit data:', message.error);
        alert('Failed to fetch Reddit data. Please try again.');
      }
    } catch (error) {
      console.error('Error processing Reddit JSON:', error);
      alert('Failed to process Reddit JSON. Please try again.');
    }
  }
});

function extractRelevantData(data) {
  const post = data[0].data.children[0].data;
  const comments = data[1].data.children;
  
  const extractedData = {
    post: {
      upvotes: post.ups,
      name: post.name,
      content: post.selftext
    },
    comments: comments.map(comment => ({
      upvotes: comment.data.ups,
      name: comment.data.name,
      content: comment.data.body
    }))
  };
  
  return extractedData;
}

function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text).then(() => {
      alert('Reddit JSON data copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      fallbackCopyToClipboard(text);
    });
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    alert('Reddit JSON data copied to clipboard!');
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    alert('Failed to copy Reddit JSON data. Please try again.');
  }
  document.body.removeChild(textarea);
}

// Initial run
addIconToRedditLinks();

// Monitor for dynamically added content
const observer = new MutationObserver(() => {
  try {
    addIconToRedditLinks();
  } catch (error) {
    console.error('Error in MutationObserver callback:', error);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

