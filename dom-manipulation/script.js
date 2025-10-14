/* Dynamic Quote Generator with JSON import/export + localStorage persistence
   - Shows random quotes by selected category
   - Lets user add quotes (dynamically created form)
   - Exports all quotes to JSON file
   - Imports quotes from a JSON file (validates and merges)
*/

// ---------- Data & storage ----------
const STORAGE_KEY = 'dynamic_quotes_v1';

// Default quotes (used only if no saved quotes exist)
const defaultQuotes = [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Happiness depends upon ourselves.", category: "Philosophy" },
  { text: "Do something today that your future self will thank you for.", category: "Motivation" }
];

// in-memory array of quotes (loaded from storage or defaults)
let quotes = [];

// ---------- DOM references ----------
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFile');
const categorySelect = document.getElementById('categorySelect');
const dynamicArea = document.getElementById('dynamicArea');

// ---------- Persistence helpers ----------
function saveQuotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error('Failed to save quotes to localStorage:', err);
    alert('Unable to save quotes locally. Your changes may not persist.');
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      quotes = [...defaultQuotes];
      saveQuotes();
    } else {
      const parsed = JSON.parse(raw);
      // basic validation: must be an array of objects with text & category
      if (Array.isArray(parsed) && parsed.every(isValidQuote)) {
        quotes = parsed;
      } else {
        console.warn('Stored quotes invalid — resetting to defaults.');
        quotes = [...defaultQuotes];
        saveQuotes();
      }
    }
  } catch (err) {
    console.error('Error loading quotes. Using defaults:', err);
    quotes = [...defaultQuotes];
    saveQuotes();
  }
}

// ---------- Utility validators ----------
function isValidQuote(obj) {
  return obj && typeof obj === 'object' &&
         typeof obj.text === 'string' && obj.text.trim().length > 0 &&
         typeof obj.category === 'string' && obj.category.trim().length > 0;
}

// Avoid adding the exact same quote text + category twice
function isDuplicate(newQ) {
  return quotes.some(q => q.text.trim() === newQ.text.trim() && q.category.trim() === newQ.category.trim());
}

// ---------- UI: categories ----------
function populateCategories() {
  // Build set of unique categories
  const categories = [...new Set(quotes.map(q => q.category.trim()))].sort();

  // Clear select
  categorySelect.innerHTML = '';

  // "All categories" option
  const allOpt = document.createElement('option');
  allOpt.value = 'All';
  allOpt.textContent = 'All Categories';
  categorySelect.appendChild(allOpt);

  // Append categories
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// ---------- Show random quote ----------
function showRandomQuote() {
  const selected = categorySelect.value || 'All';
  let pool = quotes;

  if (selected !== 'All') pool = quotes.filter(q => q.category === selected);

  if (pool.length === 0) {
    quoteDisplay.textContent = "No quotes available for the selected category.";
    return;
  }

  const idx = Math.floor(Math.random() * pool.length);
  const q = pool[idx];
  quoteDisplay.textContent = `"${q.text}" — [${q.category}]`;
}

// ---------- Dynamic Add-Quote Form (created programmatically) ----------
function createAddQuoteForm() {
  // form container
  const container = document.createElement('div');
  container.id = 'formContainer';

  const title = document.createElement('h3');
  title.textContent = 'Add a New Quote';
  container.appendChild(title);

  // text input
  const quoteInput = document.createElement('input');
  quoteInput.id = 'newQuoteText';
  quoteInput.type = 'text';
  quoteInput.placeholder = 'Enter a new quote';
  quoteInput.style.width = '50%';
  container.appendChild(quoteInput);

  // category input
  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category';
  categoryInput.style.width = '30%';
  container.appendChild(categoryInput);

  // add button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = 'Add Quote';
  addBtn.addEventListener('click', () => {
    const text = quoteInput.value.trim();
    const category = categoryInput.value.trim();

    if (!text || !category) {
      alert('Please provide both quote text and a category.');
      return;
    }

    const newQ = { text, category };

    if (isDuplicate(newQ)) {
      alert('This exact quote already exists. Duplicate not added.');
      // optionally clear or keep inputs
      return;
    }

    quotes.push(newQ);
    saveQuotes();
    populateCategories();
    alert('Quote added successfully!');
    // clear inputs
    quoteInput.value = '';
    categoryInput.value = '';
  });

  container.appendChild(addBtn);

  // Append to dynamic area in the page
  dynamicArea.appendChild(container);
}

// ---------- JSON Export ----------
function exportToJsonFile() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-'); // timestamp
    a.download = `quotes-export-${ts}.json`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // release object URL after a short timeout
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Failed to export quotes to JSON.');
  }
}

// ---------- JSON Import ----------
function importFromJsonFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);

      if (!Array.isArray(parsed)) {
        alert('Imported file must be a JSON array of quote objects.');
        return;
      }

      // Keep track of added and skipped counts
      let added = 0, skipped = 0, invalid = 0;

      parsed.forEach(item => {
        if (!isValidQuote(item)) {
          invalid++;
          return;
        }
        const candidate = { text: item.text.trim(), category: item.category.trim() };
        if (isDuplicate(candidate)) {
          skipped++;
        } else {
          quotes.push(candidate);
          added++;
        }
      });

      if (added > 0) {
        saveQuotes();
        populateCategories();
      }

      alert(`Import complete — added: ${added}, skipped (duplicates): ${skipped}, invalid: ${invalid}.`);
    } catch (err) {
      console.error('Error parsing imported JSON:', err);
      alert('Failed to parse JSON file. Make sure it is valid and follows the required structure.');
    }
  };

  reader.onerror = function() {
    alert('Failed to read file.');
  };

  reader.readAsText(file);
}

// ---------- Event wiring ----------
function attachEventListeners() {
  newQuoteBtn.addEventListener('click', showRandomQuote);
  exportBtn.addEventListener('click', exportToJsonFile);

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Basic type check
    if (!file.name.toLowerCase().endsWith('.json')) {
      alert('Please select a .json file.');
      importFileInput.value = ''; // reset
      return;
    }
    importFromJsonFile(file);
    importFileInput.value = ''; // reset so same file can be imported again later if needed
  });

  categorySelect.addEventListener('change', showRandomQuote);
}

// ---------- Initialize app ----------
function init() {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();
  attachEventListeners();
  // show an initial random quote
  showRandomQuote();
}

init();
