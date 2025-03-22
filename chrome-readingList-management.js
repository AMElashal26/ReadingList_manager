// manifest.json
{
  "manifest_version": 3,
  "name": "Reading List Manager",
  "version": "1.0",
  "description": "Manage your reading list easily",
  "permissions": ["storage", "tabs", "bookmarks"],
  "action": {
    "default_popup": "hello.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}

// popup.html
<!DOCTYPE html>
<html>
<head>
  <title>Reading List Manager</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Reading List Manager</h1>
    
    <div class="add-item">
      <input type="text" id="title" placeholder="Title">
      <input type="text" id="url" placeholder="URL">
      <button id="add-btn">Add to List</button>
      <button id="add-current-btn">Add Current Page</button>
    </div>
    
    <div class="filter">
      <input type="text" id="search" placeholder="Search...">
      <select id="sort">
        <option value="date-added">Date Added</option>
        <option value="title">Title</option>
      </select>
    </div>
    
    <ul id="reading-list"></ul>
  </div>
  <script src="popup.js"></script>
</body>
</html>

// styles.css
body {
  font-family: Arial, sans-serif;
  width: 350px;
  margin: 0;
  padding: 10px;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h1 {
  text-align: center;
  font-size: 18px;
  margin-bottom: 15px;
}

.add-item, .filter {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}

input, select, button {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

input {
  flex-grow: 1;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #3367d6;
}

ul {
  list-style-type: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}

li {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

li:hover {
  background-color: #f5f5f5;
}

.item-actions {
  display: flex;
  gap: 5px;
}

.item-actions button {
  padding: 5px;
  font-size: 12px;
}

// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const titleInput = document.getElementById('title');
  const urlInput = document.getElementById('url');
  const addBtn = document.getElementById('add-btn');
  const addCurrentBtn = document.getElementById('add-current-btn');
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sort');
  const readingList = document.getElementById('reading-list');
  
  // Load reading list from storage
  loadReadingList();
  
  // Add item to reading list
  addBtn.addEventListener('click', function() {
    addItem(titleInput.value, urlInput.value);
  });
  
  // Add current page to reading list
  addCurrentBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      addItem(currentTab.title, currentTab.url);
    });
  });
  
  // Search functionality
  searchInput.addEventListener('input', function() {
    loadReadingList();
  });
  
  // Sort functionality
  sortSelect.addEventListener('change', function() {
    loadReadingList();
  });
  
  function addItem(title, url) {
    if (!title || !url) return;
    
    const item = {
      id: Date.now(),
      title: title,
      url: url,
      dateAdded: new Date().toISOString(),
      read: false
    };
    
    chrome.storage.sync.get({readingList: []}, function(data) {
      const list = data.readingList;
      list.push(item);
      chrome.storage.sync.set({readingList: list}, function() {
        titleInput.value = '';
        urlInput.value = '';
        loadReadingList();
      });
    });
  }
  
  function loadReadingList() {
    chrome.storage.sync.get({readingList: []}, function(data) {
      let list = data.readingList;
      const searchTerm = searchInput.value.toLowerCase();
      
      // Filter by search term
      if (searchTerm) {
        list = list.filter(item => 
          item.title.toLowerCase().includes(searchTerm) || 
          item.url.toLowerCase().includes(searchTerm)
        );
      }
      
      // Sort list
      const sortBy = sortSelect.value;
      if (sortBy === 'title') {
        list.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        list.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      }
      
      // Render list
      renderReadingList(list);
    });
  }
  
  function renderReadingList(list) {
    readingList.innerHTML = '';
    
    if (list.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'Your reading list is empty.';
      emptyMessage.style.textAlign = 'center';
      readingList.appendChild(emptyMessage);
      return;
    }
    
    list.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-info ${item.read ? 'read' : ''}">
          <div class="item-title">${item.title}</div>
          <div class="item-url">${item.url}</div>
        </div>
        <div class="item-actions">
          <button class="open-btn" data-url="${item.url}">Open</button>
          <button class="toggle-btn" data-id="${item.id}">${item.read ? 'Unread' : 'Read'}</button>
          <button class="delete-btn" data-id="${item.id}">Delete</button>
        </div>
      `;
      
      readingList.appendChild(li);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.open-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        chrome.tabs.create({url: this.dataset.url});
      });
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        toggleReadStatus(parseInt(this.dataset.id));
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteItem(parseInt(this.dataset.id));
      });
    });
  }
  
  function toggleReadStatus(id) {
    chrome.storage.sync.get({readingList: []}, function(data) {
      const list = data.readingList;
      const itemIndex = list.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        list[itemIndex].read = !list[itemIndex].read;
        chrome.storage.sync.set({readingList: list}, function() {
          loadReadingList();
        });
      }
    });
  }
  
  function deleteItem(id) {
    chrome.storage.sync.get({readingList: []}, function(data) {
      const list = data.readingList.filter(item => item.id !== id);
      chrome.storage.sync.set({readingList: list}, function() {
        loadReadingList();
      });
    });
  }
});