// --------------------
// Initial quotes array
// --------------------
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Believe in yourself.", category: "Motivation" },
  { text: "Stay positive.", category: "Inspiration" },
  { text: "Never give up.", category: "Motivation" },
  { text: "Be kind to others.", category: "Life" }
];

// --------------------
// References
// --------------------
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const newQuoteBtn = document.getElementById('newQuote');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

// --------------------
// Display a random quote
// --------------------
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  quoteDisplay.textContent = filteredQuotes[randomIndex].text;
}

// --------------------
// Populate categories dynamically
// --------------------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const lastCategory = localStorage.getItem('lastCategory') || 'all';
  categoryFilter.value = lastCategory;
}

// --------------------
// Filter quotes based on category
// --------------------
function filterQuotes() {
  localStorage.setItem('lastCategory', categoryFilter.value);
  showRandomQuote();
}

// --------------------
// Notification helper
// --------------------
function notify(message) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.position = 'fixed';
  notif.style.bottom = '10px';
  notif.style.right = '10px';
  notif.style.background = '#28a745';
  notif.style.color = 'white';
  notif.style.padding = '10px';
  notif.style.borderRadius = '5px';
  notif.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// --------------------
// Add a new quote
// --------------------
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');

  const newQuote = {
    text: textInput.value.trim(),
    category: categoryInput.value.trim()
  };

  if (!newQuote.text || !newQuote.category) {
    alert("Please enter both quote and category.");
    return;
  }

  quotes.push(newQuote);
  localStorage.setItem('quotes', JSON.stringify(quotes));
  postQuoteToServer(newQuote); // send to mock server

  populateCategories();
  showRandomQuote();

  textInput.value = '';
  categoryInput.value = '';
}

// --------------------
// Export quotes to JSON
// --------------------
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
});

// --------------------
// Import quotes from JSON
// --------------------
importFile.addEventListener('change', event => {
  const fileReader = new FileReader();
  fileReader.onload = function(evt) {
    try {
      const importedQuotes = JSON.parse(evt.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid JSON");
      quotes.push(...importedQuotes);
      localStorage.setItem('quotes', JSON.stringify(quotes));
      populateCategories();
      showRandomQuote();
      notify("Quotes imported successfully!");
    } catch (err) {
      alert("Failed to import quotes: " + err.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
});

// --------------------
// Simulate server sync
// --------------------
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=5';

// Fetch quotes from server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverQuotes = await response.json();
    return serverQuotes.map(q => ({ text: q.title, category: q.body }));
  } catch (err) {
    console.error('Failed to fetch server quotes:', err);
    return [];
  }
}

// Post a new quote to the server
async function postQuoteToServer(quote) {
  try {
    await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify(quote),
      headers: { 'Content-Type': 'application/json' }
    });
    notify("Quote posted to server!");
  } catch (err) {
    console.error("Failed to post quote:", err);
  }
}

// Sync local quotes with server
async function syncQuotesWithServer() {
  const serverQuotes = await fetchQuotesFromServer();
  let localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];

  serverQuotes.forEach(sq => {
    if (!sq.text || !sq.category) return;
    const index = localQuotes.findIndex(lq => lq.text === sq.text);
    if (index >= 0) {
      localQuotes[index].category = sq.category; // conflict: server wins
    } else {
      localQuotes.push(sq);
    }
  });

  localStorage.setItem('quotes', JSON.stringify(localQuotes));
  quotes = localQuotes;
  populateCategories();
  showRandomQuote();
  notify("Quotes synced with server!");
}

// Automatic sync every 60s
setInterval(syncQuotesWithServer, 60000);

// --------------------
// Event listeners
// --------------------
newQuoteBtn.addEventListener('click', showRandomQuote);
categoryFilter.addEventListener('change', filterQuotes);

// --------------------
// Initialize
// --------------------
populateCategories();
showRandomQuote();
