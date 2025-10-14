// Initial quotes array
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Believe in yourself.", category: "Motivation" },
  { text: "Stay positive.", category: "Inspiration" },
  { text: "Never give up.", category: "Motivation" },
  { text: "Be kind to others.", category: "Life" }
];

// References
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const newQuoteBtn = document.getElementById('newQuote');

// --- Display a random quote ---
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

// --- Populate category dropdown dynamically ---
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))]; // unique categories
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected filter
  const lastCategory = localStorage.getItem('lastCategory') || 'all';
  categoryFilter.value = lastCategory;
}

// --- Filter quotes based on selected category ---
function filterQuotes() {
  localStorage.setItem('lastCategory', categoryFilter.value);
  showRandomQuote();
}

// --- Add a new quote dynamically ---
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

  // Update categories and display
  populateCategories();
  showRandomQuote();

  // Clear input fields
  textInput.value = '';
  categoryInput.value = '';
}

// --- Event listeners ---
newQuoteBtn.addEventListener('click', showRandomQuote);

// --- Initialize ---
populateCategories();
showRandomQuote();
