// =============================================================================
// Book & Notes Vault — Lilian's Application Logic
// Simple, straightforward JavaScript
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Initial State & LocalStorage ---
  const defaultBooks = [
    {
      id: 1,
      title: "The Midnight Library",
      author: "Matt Haig",
      pages: 288,
      tag: "Fiction",
      date: "2026-10-08",
      status: "Reading"
    }
  ];

  let books = JSON.parse(localStorage.getItem('lilian_vault_books')) || defaultBooks;
  let readingTarget = parseInt(localStorage.getItem('lilian_reading_target'), 10) || 50;

  // Active view tracker (default starts on Lillian's Home Page)
  let currentView = 'home';

  // --- 2. DOM Elements ---
  const navItems = document.querySelectorAll('.sidebar .nav-item');
  const drawerItems = document.querySelectorAll('.drawer-item');
  const viewSections = document.querySelectorAll('.view-section');
  const breadcrumbCurrent = document.querySelector('#breadcrumb-text .current');
  const goAddBtns = document.querySelectorAll('.btn-go-add');

  // Hamburger & Drawer elements
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navDrawer = document.getElementById('nav-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');

  // Home Page elements
  const homeBtnLibrary = document.getElementById('home-btn-library');
  const homeBtnDashboard = document.getElementById('home-btn-dashboard');
  const homeBtnAdd = document.getElementById('home-btn-add');
  const homeNavCards = document.querySelectorAll('.home-nav-card');

  // Dashboard elements
  const goalCountLabel = document.getElementById('goal-count-label');
  const goalProgressBar = document.getElementById('goal-progress-bar');
  const goalStatusText = document.getElementById('goal-status-text');
  const statCurrentRead = document.getElementById('stat-current-read');
  const statTotalPages = document.getElementById('stat-total-pages');
  const statBooksRead = document.getElementById('stat-books-read');
  const statCommonTag = document.getElementById('stat-common-tag');
  const statAddedWeek = document.getElementById('stat-added-week');
  const statPageTarget = document.getElementById('stat-page-target');
  const dashSearchInput = document.getElementById('dash-search-input');
  const dashRegexCheck = document.getElementById('dash-regex-check');
  const dashCaseCheck = document.getElementById('dash-case-check');
  const collectionHeading = document.getElementById('collection-heading');
  const dashboardBookGrid = document.getElementById('dashboard-book-grid');
  const genreCheckboxes = document.querySelectorAll('.filter-genre-checkbox');
  const statusCheckboxes = document.querySelectorAll('.filter-status-checkbox');

  // Catalog elements
  const catalogSearchInput = document.getElementById('catalog-search-input');
  const catalogRegexCheck = document.getElementById('catalog-regex-check');
  const catalogCaseCheck = document.getElementById('catalog-case-check');
  const catalogSort = document.getElementById('catalog-sort');
  const catalogFilterTag = document.getElementById('catalog-filter-tag');
  const catalogFilterStatus = document.getElementById('catalog-filter-status');
  const tableCountLabel = document.getElementById('table-count-label');
  const catalogTableBody = document.getElementById('catalog-table-body');

  // Form elements
  const bookForm = document.getElementById('book-form');
  const formViewTitle = document.getElementById('form-view-title');
  const editingBookIdInput = document.getElementById('editing-book-id');
  const formTitle = document.getElementById('form-title');
  const formAuthor = document.getElementById('form-author');
  const formPages = document.getElementById('form-pages');
  const formTag = document.getElementById('form-tag');
  const formDate = document.getElementById('form-date');
  const formStatus = document.getElementById('form-status');
  const btnCancelForm = document.getElementById('btn-cancel-form');

  // Settings elements
  const settingsForm = document.getElementById('settings-form');
  const prefBookTarget = document.getElementById('pref-book-target');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const importFileInput = document.getElementById('import-file-input');
  const toast = document.getElementById('toast');

  // Set default date in form to today
  if (formDate) {
    const today = new Date().toISOString().split('T')[0];
    formDate.value = today;
  }

  // --- Hamburger Drawer Helpers ---
  function openDrawer() {
    if (navDrawer && drawerBackdrop && hamburgerBtn) {
      navDrawer.classList.add('active');
      drawerBackdrop.classList.add('active');
      hamburgerBtn.classList.add('active');
    }
  }

  function closeDrawer() {
    if (navDrawer && drawerBackdrop && hamburgerBtn) {
      navDrawer.classList.remove('active');
      drawerBackdrop.classList.remove('active');
      hamburgerBtn.classList.remove('active');
    }
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (navDrawer && navDrawer.classList.contains('active')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeDrawer);
  }

  // --- 3. View Switching Function ---
  function switchView(viewName) {
    currentView = viewName;
    closeDrawer();

    // Update active nav button in sidebar
    navItems.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update active nav button in drawer
    drawerItems.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update active section
    viewSections.forEach(section => {
      section.classList.toggle('active', section.id === `view-${viewName}`);
    });

    // Update breadcrumb
    const titles = {
      'home': 'Home',
      'dashboard': 'Dashboard',
      'catalog': 'My Library',
      'add-book': 'Add a book',
      'settings': 'Settings'
    };
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = titles[viewName] || 'Home';
    }

    // Refresh view data
    if (viewName === 'dashboard') {
      renderDashboard();
    } else if (viewName === 'catalog') {
      renderCatalog();
    }

    // Scroll main window to top
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }

  // Sidebar Nav click handlers
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      if (targetView === 'add-book') {
        resetBookForm();
      }
      switchView(targetView);
    });
  });

  // Drawer Nav click handlers
  drawerItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      if (targetView === 'add-book') {
        resetBookForm();
      }
      switchView(targetView);
    });
  });

  // Home Page Quick Links
  if (homeBtnLibrary) {
    homeBtnLibrary.addEventListener('click', () => switchView('catalog'));
  }
  if (homeBtnDashboard) {
    homeBtnDashboard.addEventListener('click', () => switchView('dashboard'));
  }
  if (homeBtnAdd) {
    homeBtnAdd.addEventListener('click', () => {
      resetBookForm();
      switchView('add-book');
    });
  }
  homeNavCards.forEach(card => {
    card.addEventListener('click', () => {
      const jumpTarget = card.dataset.jump;
      if (jumpTarget === 'add-book') {
        resetBookForm();
      }
      switchView(jumpTarget);
    });
  });

  // "+ Add book" CTA buttons
  goAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      resetBookForm();
      switchView('add-book');
    });
  });

  // Cancel form button
  if (btnCancelForm) {
    btnCancelForm.addEventListener('click', () => {
      resetBookForm();
      switchView('catalog');
    });
  }

  // --- 4. Toast Notifications ---
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // --- 5. Save to LocalStorage ---
  function persistData() {
    localStorage.setItem('lilian_vault_books', JSON.stringify(books));
    localStorage.setItem('lilian_reading_target', readingTarget.toString());
  }

  // --- 6. Helper: Search Match with Regex & Case Sensitivity ---
  function matchesSearch(text, query, useRegex, isCaseSensitive) {
    if (!query) return true;
    if (!text) return false;

    if (useRegex) {
      try {
        const flags = isCaseSensitive ? '' : 'i';
        const regex = new RegExp(query, flags);
        return regex.test(text);
      } catch (e) {
        // Fallback to literal search if regex is invalid
      }
    }

    if (!isCaseSensitive) {
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return text.includes(query);
  }

  // --- 7. Dashboard Render ---
  function renderDashboard() {
    // Reading Goal Stats
    const totalBooks = books.length;
    const completedReads = books.filter(b => b.status === 'Read').length;
    const goalPercent = Math.min(100, Math.round((completedReads / readingTarget) * 100));
    const remaining = Math.max(0, readingTarget - completedReads);

    if (goalCountLabel) goalCountLabel.textContent = `${completedReads}/${readingTarget} books`;
    if (goalProgressBar) goalProgressBar.style.width = `${goalPercent}%`;
    if (goalStatusText) goalStatusText.textContent = `${goalPercent}% complete • ${remaining} remaining`;

    // Row 1 Stats
    const currentBook = books.find(b => b.status === 'Reading');
    if (statCurrentRead) statCurrentRead.textContent = currentBook ? currentBook.title : 'None';

    const totalPages = books.reduce((acc, b) => acc + (parseInt(b.pages, 10) || 0), 0);
    if (statTotalPages) statTotalPages.textContent = totalPages.toString();
    if (statBooksRead) statBooksRead.textContent = completedReads.toString();

    // Row 2 Stats
    // Most common tag
    const tagCounts = {};
    books.forEach(b => {
      if (b.tag) {
        tagCounts[b.tag] = (tagCounts[b.tag] || 0) + 1;
      }
    });
    let mostCommon = 'None';
    let maxCount = 0;
    for (const [tag, count] of Object.entries(tagCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = tag;
      }
    }
    if (statCommonTag) statCommonTag.textContent = mostCommon;

    // Added this week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const addedWeekCount = books.filter(b => {
      const bookDate = new Date(b.date);
      return !isNaN(bookDate) && bookDate >= sevenDaysAgo;
    }).length;
    if (statAddedWeek) statAddedWeek.textContent = addedWeekCount.toString();

    if (statPageTarget) statPageTarget.textContent = `${totalPages} / 15000`;

    // Filter books for dashboard collection
    const query = dashSearchInput ? dashSearchInput.value.trim() : '';
    const useRegex = dashRegexCheck ? dashRegexCheck.checked : false;
    const isCase = dashCaseCheck ? dashCaseCheck.checked : false;

    const selectedGenres = Array.from(genreCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
    const selectedStatuses = Array.from(statusCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());

    const filtered = books.filter(book => {
      const textMatch = matchesSearch(book.title, query, useRegex, isCase) ||
                         matchesSearch(book.author, query, useRegex, isCase) ||
                         matchesSearch(book.tag, query, useRegex, isCase);

      const genreMatch = selectedGenres.length === 0 || selectedGenres.includes((book.tag || '').toLowerCase());
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes((book.status || '').toLowerCase());

      return textMatch && genreMatch && statusMatch;
    });

    if (collectionHeading) {
      collectionHeading.textContent = `My Book Collection (${filtered.length})`;
    }

    if (!dashboardBookGrid) return;

    if (filtered.length === 0) {
      dashboardBookGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: var(--text-muted); background: #FFFFFF; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          No books found matching the current search and filters.
        </div>
      `;
      return;
    }

    dashboardBookGrid.innerHTML = filtered.map(book => {
      const statusClass = book.status === 'Reading' ? 'reading' :
                          book.status === 'Read' ? 'read' : 'to-read';

      return `
        <article class="book-card" data-id="${book.id}">
          <div class="book-cover-placeholder">
            <span>BOOK NOTES</span>
          </div>
          <h4 class="book-card-title">${escapeHtml(book.title)}</h4>
          <p class="book-card-meta">${escapeHtml(book.author)} • ${book.pages} pages</p>
          <span class="status-pill ${statusClass}">${escapeHtml(book.status)}</span>
        </article>
      `;
    }).join('');
  }

  // --- 8. Catalog Render (Table View) ---
  function renderCatalog() {
    const query = catalogSearchInput ? catalogSearchInput.value.trim() : '';
    const useRegex = catalogRegexCheck ? catalogRegexCheck.checked : false;
    const isCase = catalogCaseCheck ? catalogCaseCheck.checked : false;

    const sortValue = catalogSort ? catalogSort.value : 'title-asc';
    const tagFilter = catalogFilterTag ? catalogFilterTag.value : 'All';
    const statusFilter = catalogFilterStatus ? catalogFilterStatus.value : 'All';

    // Filter
    let filtered = books.filter(book => {
      const textMatch = matchesSearch(book.title, query, useRegex, isCase) ||
                         matchesSearch(book.author, query, useRegex, isCase) ||
                         matchesSearch(book.tag, query, useRegex, isCase);

      const tagMatch = tagFilter === 'All' || (book.tag || '').toLowerCase() === tagFilter.toLowerCase();
      const statusMatch = statusFilter === 'All' || (book.status || '').toLowerCase() === statusFilter.toLowerCase();

      return textMatch && tagMatch && statusMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortValue === 'title-asc') return a.title.localeCompare(b.title);
      if (sortValue === 'title-desc') return b.title.localeCompare(a.title);
      if (sortValue === 'pages-desc') return (b.pages || 0) - (a.pages || 0);
      if (sortValue === 'date-desc') return new Date(b.date || 0) - new Date(a.date || 0);
      return 0;
    });

    if (tableCountLabel) {
      tableCountLabel.textContent = `${filtered.length} ${filtered.length === 1 ? 'book' : 'books'} in your collection`;
    }

    if (!catalogTableBody) return;

    if (filtered.length === 0) {
      catalogTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">
            No books found matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    catalogTableBody.innerHTML = filtered.map(book => `
      <tr>
        <td><strong>${escapeHtml(book.title)}</strong></td>
        <td>${escapeHtml(book.author)}</td>
        <td>${book.pages}</td>
        <td>${escapeHtml(book.tag || 'General')}</td>
        <td>${escapeHtml(book.date || '-')}</td>
        <td>
          <button type="button" class="btn-edit" data-id="${book.id}">Edit</button>
          <button type="button" class="btn-delete" data-id="${book.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Attach Edit & Delete Listeners
    catalogTableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        editBook(id);
      });
    });

    catalogTableBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        deleteBook(id);
      });
    });
  }

  // --- 9. Add / Edit Book Functions ---
  function resetBookForm() {
    if (!bookForm) return;
    bookForm.reset();
    if (editingBookIdInput) editingBookIdInput.value = '';
    if (formViewTitle) formViewTitle.textContent = 'Add Book';
    if (formDate) formDate.value = new Date().toISOString().split('T')[0];
    if (formStatus) formStatus.value = 'To Read';
  }

  function editBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    if (editingBookIdInput) editingBookIdInput.value = book.id;
    if (formTitle) formTitle.value = book.title;
    if (formAuthor) formAuthor.value = book.author;
    if (formPages) formPages.value = book.pages;
    if (formTag) formTag.value = book.tag;
    if (formDate) formDate.value = book.date;
    if (formStatus) formStatus.value = book.status;

    if (formViewTitle) formViewTitle.textContent = 'Edit Book';
    switchView('add-book');
  }

  function deleteBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    if (confirm(`Are you sure you want to delete "${book.title}" from your vault?`)) {
      books = books.filter(b => b.id !== id);
      persistData();
      renderCatalog();
      renderDashboard();
      showToast(`Deleted "${book.title}"`);
    }
  }

  // Form submit handler
  if (bookForm) {
    bookForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = formTitle.value.trim();
      const author = formAuthor.value.trim();
      const pages = parseInt(formPages.value, 10) || 0;
      const tag = formTag.value.trim() || 'General';
      const date = formDate.value || new Date().toISOString().split('T')[0];
      const status = formStatus.value;
      const editId = editingBookIdInput.value ? parseInt(editingBookIdInput.value, 10) : null;

      if (!title || !author) {
        alert('Please fill out the title and author.');
        return;
      }

      if (editId) {
        // Update existing book
        const index = books.findIndex(b => b.id === editId);
        if (index !== -1) {
          books[index] = { ...books[index], title, author, pages, tag, date, status };
          showToast(`Updated "${title}"`);
        }
      } else {
        // Create new book
        const newBook = {
          id: Date.now(),
          title,
          author,
          pages,
          tag,
          date,
          status
        };
        books.unshift(newBook);
        showToast(`Saved "${title}" to your vault`);
      }

      persistData();
      resetBookForm();
      switchView('catalog');
    });
  }

  // --- 10. Settings & Preferences Handlers ---
  if (settingsForm) {
    prefBookTarget.value = readingTarget;

    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      readingTarget = parseInt(prefBookTarget.value, 10) || 50;
      persistData();
      showToast('Reading preferences saved.');
    });
  }

  // Export JSON
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "vault_books_export.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Exported books JSON.');
    });
  }

  // Import JSON
  if (btnImportTrigger && importFileInput) {
    btnImportTrigger.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            books = imported;
            persistData();
            renderDashboard();
            renderCatalog();
            showToast(`Imported ${imported.length} books successfully.`);
          } else {
            alert('Invalid JSON format: expected an array of books.');
          }
        } catch (err) {
          alert('Error parsing JSON file.');
        }
      };
      reader.readAsText(file);
    });
  }

  // --- 11. Search & Filter Input Listeners ---
  [dashSearchInput, dashRegexCheck, dashCaseCheck].forEach(el => {
    if (el) el.addEventListener('input', renderDashboard);
  });

  [catalogSearchInput, catalogRegexCheck, catalogCaseCheck, catalogSort, catalogFilterTag, catalogFilterStatus].forEach(el => {
    if (el) el.addEventListener('input', renderCatalog);
  });

  genreCheckboxes.forEach(cb => cb.addEventListener('change', renderDashboard));
  statusCheckboxes.forEach(cb => cb.addEventListener('change', renderDashboard));

  // --- Initial Render ---
  renderDashboard();
  renderCatalog();
});

// Helper HTML escaping for safe injection
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
