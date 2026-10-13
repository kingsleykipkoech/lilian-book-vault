document.addEventListener('DOMContentLoaded', () => {

  const defaultBooks = [
    {
      id: 1,
      title: "The Midnight Library",
      author: "Matt Haig",
      pages: 288,
      tag: "Fiction",
      date: "2026-10-08",
      status: "Reading",
      isFavorite: false,
      cover: "./assets/empty-book.svg",
      coverImage: "./assets/empty-book.svg",
      synopsis: "Between life and death there is a library where shelves go on forever. Nora Seed is given the chance to undo her regrets and explore the alternate lives she could have lived."
    },
    {
      id: 2,
      title: "Computer Systems",
      author: "Randal Bryant & David O'Hallaron",
      pages: 1104,
      tag: "Systems",
      date: "2026-10-10",
      status: "To Read",
      isFavorite: true,
      cover: "./assets/empty-book.svg",
      coverImage: "./assets/empty-book.svg",
      synopsis: "A programmer's perspective on computer architecture, memory hierarchy, machine-level code, and concurrent systems."
    }
  ];

  let books = JSON.parse(localStorage.getItem('lilian_vault_books')) || defaultBooks;
  // Sanitize any deprecated image filenames in existing localStorage
  books.forEach(b => {
    if (b.cover && (b.cover.includes('midnight-library') || b.cover.includes('computer-systems'))) {
      b.cover = './assets/empty-book.svg';
    }
    if (b.coverImage && (b.coverImage.includes('midnight-library') || b.coverImage.includes('computer-systems'))) {
      b.coverImage = './assets/empty-book.svg';
    }
  });

  let readerGoal = parseInt(localStorage.getItem('lilian_reader_goal'), 10) || 25;
  let readerMotto = localStorage.getItem('lilian_reader_motto') || 'A quiet space for every book.';

  let currentView = 'home';
  let expandedBookIds = new Set();

  const navItems = document.querySelectorAll('.sidebar .nav-item');
  const drawerItems = document.querySelectorAll('.drawer-item');
  const viewSections = document.querySelectorAll('.view-section');
  const breadcrumbCurrent = document.querySelector('#breadcrumb-text .current');
  const goAddBtns = document.querySelectorAll('.btn-go-add');

  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navDrawer = document.getElementById('nav-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const btnBack = document.getElementById('btn-back');

  const statCurrentRead = document.getElementById('stat-current-read');
  const statTotalPages = document.getElementById('stat-total-pages');
  const statBooksRead = document.getElementById('stat-books-read');
  const statAddedWeek = document.getElementById('stat-added-week');

  const catalogSearchInput = document.getElementById('catalog-search-input');
  const catalogRegexCheck = document.getElementById('catalog-regex-check');
  const catalogCaseCheck = document.getElementById('catalog-case-check');
  const catalogSort = document.getElementById('catalog-sort');
  const catalogFilterTag = document.getElementById('catalog-filter-tag');
  const catalogFilterStatus = document.getElementById('catalog-filter-status');
  const tableCountLabel = document.getElementById('table-count-label');
  const catalogTableBody = document.getElementById('catalog-table-body');
  const mobileBooksContainer = document.getElementById('mobile-books-container');

  const bookForm = document.getElementById('book-form');
  const formViewTitle = document.getElementById('form-view-title');
  const editingBookIdInput = document.getElementById('editing-book-id');
  const formTitle = document.getElementById('form-title');
  const formAuthor = document.getElementById('form-author');
  const formPages = document.getElementById('form-pages');
  const formTag = document.getElementById('form-tag');
  const formDate = document.getElementById('form-date');
  const formStatus = document.getElementById('form-status');
  const formSynopsis = document.getElementById('form-synopsis');
  const btnCancelForm = document.getElementById('btn-cancel-form');
  const formCoverFile = document.getElementById('form-cover-file');
  const coverPreviewRow = document.getElementById('cover-preview-row');
  const coverPreviewImg = document.getElementById('cover-preview-img');
  const btnRemoveCover = document.getElementById('btn-remove-cover');
  const formIsFavorite = document.getElementById('form-is-favorite');
  let newlyPickedCoverFile = '';
  let currentUploadedCover = '';

  const settingsForm = document.getElementById('settings-form');
  const prefReaderGoal = document.getElementById('pref-reader-goal');
  const prefReaderMotto = document.getElementById('pref-reader-motto');

  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const importFileInput = document.getElementById('import-json-file');
  const toast = document.getElementById('toast');

  if (formDate) {
    const today = new Date().toISOString().split('T')[0];
    formDate.value = today;
  }

  if (formCoverFile) {
    formCoverFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          newlyPickedCoverFile = loadEvent.target.result;
          currentUploadedCover = newlyPickedCoverFile;
          if (coverPreviewImg) coverPreviewImg.src = newlyPickedCoverFile;
          if (coverPreviewRow) coverPreviewRow.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnRemoveCover) {
    btnRemoveCover.addEventListener('click', () => {
      newlyPickedCoverFile = '';
      currentUploadedCover = '';
      if (formCoverFile) formCoverFile.value = '';
      if (formCoverUrl) formCoverUrl.value = '';
      if (coverPreviewImg) coverPreviewImg.src = '';
      if (coverPreviewRow) coverPreviewRow.style.display = 'none';
    });
  }

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

  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  function switchView(viewName, pushHistory = true) {
    if (!viewName) viewName = 'home';
    currentView = viewName;
    closeDrawer();

    if (pushHistory) {
      if (viewName === 'home') {
        history.pushState({ view: 'home' }, '', window.location.pathname + window.location.search);
      } else {
        history.pushState({ view: viewName }, '', '#' + viewName);
      }
    }

    if (btnBack) {
      btnBack.style.display = viewName === 'home' ? 'none' : 'inline-flex';
    }

    navItems.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    drawerItems.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    viewSections.forEach(section => {
      section.classList.toggle('active', section.id === `view-${viewName}`);
    });

    const titles = {
      'home': 'Home',
      'dashboard': 'Dashboard',
      'catalog': 'My Library',
      'add-book': 'Add a book',
      'settings': 'Settings',
      'about': 'About'
    };

    const breadcrumbSub = document.getElementById('breadcrumb-sub');
    const breadcrumbHomeBtn = document.getElementById('breadcrumb-home-btn');
    if (breadcrumbHomeBtn && breadcrumbSub) {
      if (viewName === 'home') {
        breadcrumbHomeBtn.style.fontWeight = '600';
        breadcrumbHomeBtn.style.color = '#111827';
        breadcrumbSub.innerHTML = '';
      } else {
        breadcrumbHomeBtn.style.fontWeight = '400';
        breadcrumbHomeBtn.style.color = '#6B7280';
        breadcrumbSub.innerHTML = `<span class="sep">/</span> <span class="current">${titles[viewName] || viewName}</span>`;
      }
    } else if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = titles[viewName] || 'Home';
    }

    if (viewName === 'home') {
      updateHomeHeroStats();
    } else if (viewName === 'dashboard') {
      renderDashboard();
    } else if (viewName === 'catalog') {
      renderCatalog();
    }

    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }

  window.addEventListener('popstate', (e) => {
    const target = (e.state && e.state.view) || window.location.hash.replace('#', '') || 'home';
    switchView(target, false);
  });

  window.addEventListener('hashchange', () => {
    const target = window.location.hash.replace('#', '') || 'home';
    if (target !== currentView) {
      switchView(target, false);
    }
  });

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        switchView('home');
      }
    });
  }

  const brandHomeLink = document.getElementById('brand-home-link');
  if (brandHomeLink) {
    brandHomeLink.addEventListener('click', () => switchView('home'));
  }

  const breadcrumbHomeBtn = document.getElementById('breadcrumb-home-btn');
  if (breadcrumbHomeBtn) {
    breadcrumbHomeBtn.addEventListener('click', () => switchView('home'));
  }

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      if (targetView === 'add-book') resetBookForm();
      switchView(targetView);
    });
  });

  drawerItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      if (targetView === 'add-book') resetBookForm();
      switchView(targetView);
    });
  });

  function updateHomeHeroStats() {
    const spotlightTitle = document.getElementById('home-spotlight-title');
    const spotlightAuthor = document.getElementById('home-spotlight-author');
    const spotlightSynopsis = document.getElementById('home-spotlight-synopsis') || document.getElementById('home-spotlight-quote');
    const spotlightImg = document.getElementById('home-spotlight-img');
    const spotlightTag = document.getElementById('home-spotlight-tag');
    const spotlightViewBtn = document.getElementById('home-spotlight-view-btn');

    if (!spotlightTitle) return;

    const activeRead = books.find(b => b.status === 'Reading');

    if (activeRead) {
      spotlightTitle.textContent = activeRead.title;
      if (spotlightAuthor) spotlightAuthor.textContent = `by ${activeRead.author} • ${activeRead.tag || 'General'}`;
      if (spotlightTag) spotlightTag.textContent = 'Currently Reading';
      const synopsisText = activeRead.synopsis || 'No synopsis added yet for this book.';
      if (spotlightSynopsis) spotlightSynopsis.textContent = synopsisText;
      const coverSrc = activeRead.coverImage || activeRead.cover || './assets/empty-book.svg';
      if (spotlightImg) {
        spotlightImg.src = coverSrc;
        spotlightImg.alt = `${activeRead.title} Cover`;
        spotlightImg.style.display = 'block';
      }
      if (spotlightViewBtn) {
        spotlightViewBtn.textContent = 'View in Library →';
        spotlightViewBtn.onclick = () => switchView('catalog');
      }
    } else {
      spotlightTitle.textContent = 'No Current Read';
      if (spotlightAuthor) spotlightAuthor.textContent = 'Choose a book to start tracking';
      if (spotlightTag) spotlightTag.textContent = 'Currently Reading';
      const emptyText = 'You do not have a book marked as Currently Reading. Select any book in My Library and set its status to Reading to track it here.';
      if (spotlightSynopsis) spotlightSynopsis.textContent = emptyText;
      if (spotlightImg) {
        spotlightImg.src = './assets/empty-book.svg';
        spotlightImg.alt = 'No Book Selected';
        spotlightImg.style.display = 'block';
      }
      if (spotlightViewBtn) {
        spotlightViewBtn.textContent = 'Browse Library →';
        spotlightViewBtn.onclick = () => switchView('catalog');
      }
    }
  }

  const homeCtaLibrary = document.getElementById('home-cta-library');
  if (homeCtaLibrary) homeCtaLibrary.addEventListener('click', () => switchView('catalog'));

  const homeCtaDashboard = document.getElementById('home-cta-dashboard');
  if (homeCtaDashboard) homeCtaDashboard.addEventListener('click', () => switchView('dashboard'));

  const homeSpotlightViewBtn = document.getElementById('home-spotlight-view-btn');
  if (homeSpotlightViewBtn) homeSpotlightViewBtn.addEventListener('click', () => switchView('catalog'));

  goAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      resetBookForm();
      switchView('add-book');
    });
  });

  if (btnCancelForm) {
    btnCancelForm.addEventListener('click', () => {
      resetBookForm();
      switchView('catalog');
    });
  }

  const favViewBtn = document.getElementById('fav-view-library-btn');
  if (favViewBtn) favViewBtn.addEventListener('click', () => switchView('catalog'));

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function persistData() {
    localStorage.setItem('lilian_vault_books', JSON.stringify(books));
    localStorage.setItem('lilian_reader_goal', readerGoal);
    localStorage.setItem('lilian_reader_motto', readerMotto);
    updateHomeHeroStats();
    renderDashboard();
    renderCatalog();
  }

  function matchesSearch(text, query, useRegex, isCaseSensitive) {
    if (!query) return true;
    if (!text) return false;
    if (useRegex) {
      try {
        const flags = isCaseSensitive ? '' : 'i';
        const regex = new RegExp(query, flags);
        return regex.test(text);
      } catch (err) {
        return false;
      }
    }
    const t = isCaseSensitive ? text : text.toLowerCase();
    const q = isCaseSensitive ? query : query.toLowerCase();
    return t.includes(q);
  }

  function renderDashboard() {
    const currentBook = books.find(b => b.status === 'Reading');
    if (statCurrentRead) statCurrentRead.textContent = currentBook ? currentBook.title : 'None';

    const completedReads = books.filter(b => b.status === 'Read').length;
    if (statBooksRead) statBooksRead.textContent = completedReads.toString();

    const totalPages = books.reduce((acc, b) => acc + (parseInt(b.pages, 10) || 0), 0);
    if (statTotalPages) statTotalPages.textContent = totalPages.toLocaleString();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const addedWeekCount = books.filter(b => {
      const bookDate = new Date(b.date);
      return !isNaN(bookDate) && bookDate >= sevenDaysAgo;
    }).length;
    if (statAddedWeek) statAddedWeek.textContent = addedWeekCount.toString();

    const favBookCard = document.getElementById('favorite-book-card');
    const favHeaderBadge = document.getElementById('favorite-card-header-badge');
    const favSubbadge = document.getElementById('favorite-card-subbadge');
    const favTitle = document.getElementById('favorite-book-title');
    const favAuthor = document.getElementById('favorite-book-author');
    const favSynopsis = document.getElementById('favorite-book-synopsis') || document.getElementById('favorite-book-quote');
    const favBadge = document.getElementById('favorite-book-badge');
    const favCoverImg = document.getElementById('favorite-cover-img');
    const favViewBtn = document.getElementById('fav-view-library-btn');

    if (!favBookCard) return;

    const favBook = books.find(b => b.isFavorite);

    if (favBook) {
      if (favHeaderBadge) favHeaderBadge.textContent = 'FAVORITE BOOK';
      if (favSubbadge) favSubbadge.textContent = 'Curated from Personal Vault';
      if (favTitle) favTitle.textContent = favBook.title;
      if (favAuthor) {
        const pagesStr = (parseInt(favBook.pages, 10) || 0).toLocaleString();
        favAuthor.textContent = `by ${favBook.author} • ${pagesStr} pages • ${favBook.tag || 'General'}`;
      }
      const synopsisText = favBook.synopsis || 'No synopsis added yet for this book.';
      if (favSynopsis) favSynopsis.textContent = synopsisText;
      if (favBadge) {
        favBadge.textContent = favBook.status || 'To Read';
        const statusSlug = (favBook.status || 'toread').toLowerCase().replace(/\s+/g, '');
        favBadge.className = `btn-toggle-status status-pill status-${statusSlug}`;
        favBadge.onclick = () => toggleBookStatus(favBook.id);
      }
      if (favCoverImg) {
        favCoverImg.src = favBook.coverImage || favBook.cover || './assets/empty-book.svg';
        favCoverImg.alt = `${favBook.title} Cover`;
        favCoverImg.style.display = 'block';
      }
      if (favViewBtn) {
        favViewBtn.textContent = 'View in Library →';
        favViewBtn.onclick = () => switchView('catalog');
      }
    } else {
      if (favHeaderBadge) favHeaderBadge.textContent = 'FAVORITE BOOK';
      if (favSubbadge) favSubbadge.textContent = 'Personal Vault';
      if (favTitle) favTitle.textContent = 'No Favorite Book Selected';
      if (favAuthor) favAuthor.textContent = 'Mark your favorite book in My Library';
      const emptyNote = 'You have not marked any book as your favorite yet. Click the heart or edit a book in My Library to showcase it here.';
      if (favSynopsis) favSynopsis.textContent = emptyNote;
      if (favBadge) {
        favBadge.textContent = 'None';
        favBadge.className = 'status-pill';
        favBadge.onclick = null;
      }
      if (favCoverImg) {
        favCoverImg.src = './assets/empty-book.svg';
        favCoverImg.alt = 'No Favorite Book Selected';
        favCoverImg.style.display = 'block';
      }
      if (favViewBtn) {
        favViewBtn.textContent = 'Browse Library →';
        favViewBtn.onclick = () => switchView('catalog');
      }
    }
  }

  function populateCatalogTags() {
    if (!catalogFilterTag) return;
    const currentSelected = catalogFilterTag.value || 'All';
    const tagSet = new Set();
    books.forEach(b => {
      if (b.tag && b.tag.trim()) tagSet.add(b.tag.trim());
    });
    const tags = Array.from(tagSet).sort();
    let optionsHtml = `<option value="All">All Tags</option>`;
    tags.forEach(t => {
      optionsHtml += `<option value="${escapeHtml(t)}" ${t.toLowerCase() === currentSelected.toLowerCase() ? 'selected' : ''}>${escapeHtml(t)}</option>`;
    });
    catalogFilterTag.innerHTML = optionsHtml;
  }

  function renderCatalog() {
    populateCatalogTags();

    const query = catalogSearchInput ? catalogSearchInput.value.trim() : '';
    const useRegex = catalogRegexCheck ? catalogRegexCheck.checked : false;
    const isCase = catalogCaseCheck ? catalogCaseCheck.checked : false;

    const sortValue = catalogSort ? catalogSort.value : 'title-asc';
    const tagFilter = catalogFilterTag ? catalogFilterTag.value : 'All';
    const statusFilter = catalogFilterStatus ? catalogFilterStatus.value : 'All';

    let filtered = books.filter(book => {
      const textMatch = matchesSearch(book.title, query, useRegex, isCase) ||
                         matchesSearch(book.author, query, useRegex, isCase) ||
                         matchesSearch(book.tag, query, useRegex, isCase);
      const tagMatch = tagFilter === 'All' || (book.tag || '').toLowerCase() === tagFilter.toLowerCase();
      const statusMatch = statusFilter === 'All' || (book.status || '').toLowerCase() === statusFilter.toLowerCase();
      return textMatch && tagMatch && statusMatch;
    });

    filtered.sort((a, b) => {
      if (sortValue === 'title-asc') return a.title.localeCompare(b.title);
      if (sortValue === 'title-desc') return b.title.localeCompare(a.title);
      if (sortValue === 'pages-desc') return (b.pages || 0) - (a.pages || 0);
      if (sortValue === 'date-desc') return new Date(b.date || 0) - new Date(a.date || 0);
      return 0;
    });

    if (tableCountLabel) {
      tableCountLabel.textContent = `${filtered.length} ${filtered.length === 1 ? 'book' : 'books'} in collection`;
    }

    if (catalogTableBody) {
      if (filtered.length === 0) {
        catalogTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 32px; color: #6B7280;">
              No books found matching your search.
            </td>
          </tr>
        `;
      } else {
        let tableRowsHtml = '';
        filtered.forEach(book => {
          const isExpanded = expandedBookIds.has(book.id);
          tableRowsHtml += `
            <tr data-book-id="${book.id}">
              <td><strong>${escapeHtml(book.title)}</strong></td>
              <td>${escapeHtml(book.author)}</td>
              <td>${book.pages}</td>
              <td>${escapeHtml(book.tag || 'General')}</td>
              <td>${escapeHtml(book.date || '-')}</td>
              <td class="status-cell">
                <button type="button" class="status-pill btn-toggle-status" data-id="${book.id}" title="Click to cycle status">
                  ${escapeHtml(book.status || 'To Read')}
                </button>
              </td>
              <td class="actions-cell">
                <div class="actions-group">
                  <button type="button" class="btn-action btn-view" data-id="${book.id}">${isExpanded ? 'Hide' : 'View'}</button>
                  <button type="button" class="btn-action btn-edit" data-id="${book.id}">Edit</button>
                  <button type="button" class="btn-action btn-delete" data-id="${book.id}">Delete</button>
                </div>
              </td>
            </tr>
          `;

          if (isExpanded) {
            tableRowsHtml += `
              <tr class="inline-detail-row" id="detail-row-${book.id}">
                <td colspan="7">
                  <div class="inline-book-detail">
                    <div class="inline-cover-wrap">
                      <img src="${book.coverImage || book.cover || './assets/empty-book.svg'}" alt="Cover" class="inline-cover-img">
                    </div>
                    <div class="inline-info">
                      <h4>${escapeHtml(book.title)}</h4>
                      <div class="inline-meta">by ${escapeHtml(book.author)} • ${book.pages} pages • ${escapeHtml(book.tag || 'General')}</div>
                      <div class="inline-meta">Added: ${escapeHtml(book.date || '-')} • Status: <strong>${escapeHtml(book.status)}</strong></div>
                      
                      <div class="inline-synopsis-box">
                        <span class="inline-label">Synopsis</span>
                        <p>${escapeHtml(book.synopsis || 'No synopsis added yet for this book.')}</p>
                      </div>
                    </div>
                    <button type="button" class="btn-action btn-close-detail" data-id="${book.id}">Close</button>
                  </div>
                </td>
              </tr>
            `;
          }
        });
        catalogTableBody.innerHTML = tableRowsHtml;
      }
    }

    if (mobileBooksContainer) {
      if (filtered.length === 0) {
        mobileBooksContainer.innerHTML = `<div style="text-align: center; padding: 24px; color: #6B7280; background: #FFF; border-radius: 8px;">No books found.</div>`;
      } else {
        mobileBooksContainer.innerHTML = filtered.map(book => {
          const isExpanded = expandedBookIds.has(book.id);
          return `
            <div class="mobile-book-card" data-book-id="${book.id}">
              <div class="mobile-book-card-header">
                <div>
                  <div class="mobile-book-card-title">${escapeHtml(book.title)}</div>
                  <div class="mobile-book-card-author">by ${escapeHtml(book.author)}</div>
                </div>
                <button type="button" class="status-pill btn-toggle-status" data-id="${book.id}">${escapeHtml(book.status)}</button>
              </div>
              <div style="font-size: 0.85rem; color: #4B5563;">${book.pages} pages • ${escapeHtml(book.tag || 'General')}</div>
              ${isExpanded ? `
                <div class="mobile-expanded-detail" style="padding-top: 14px; border-top: 1px solid #E5E7EB; margin-top: 8px;">
                  <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px;">
                    <img src="${book.coverImage || book.cover || './assets/empty-book.svg'}" style="width: 70px; height: 105px; border-radius: 6px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.12);">
                    <div style="font-size: 0.88rem; color: #1F2937; flex: 1;">
                      <p style="margin-bottom: 4px;"><strong>Added:</strong> ${escapeHtml(book.date || '-')}</p>
                      <p style="margin-bottom: 4px;"><strong>Status:</strong> ${escapeHtml(book.status)}</p>
                    </div>
                  </div>
                  <div class="inline-synopsis-box" style="margin-bottom: 8px;">
                    <span class="inline-label">Synopsis</span>
                    <p style="font-size: 0.88rem; line-height: 1.5; color: #374151;">${escapeHtml(book.synopsis || 'No synopsis added yet for this book.')}</p>
                  </div>
                </div>
              ` : ''}
              <div class="mobile-book-card-footer">
                <button type="button" class="btn-action btn-view" data-id="${book.id}">${isExpanded ? 'Hide' : 'View'}</button>
                <div class="actions-group">
                  <button type="button" class="btn-action btn-edit" data-id="${book.id}">Edit</button>
                  <button type="button" class="btn-action btn-delete" data-id="${book.id}">Delete</button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    document.querySelectorAll('.btn-view, .btn-close-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        if (expandedBookIds.has(id)) {
          expandedBookIds.delete(id);
        } else {
          expandedBookIds.add(id);
        }
        renderCatalog();
      });
    });

    document.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        toggleBookStatus(id);
      });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        startEditBook(id);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        deleteBook(id);
      });
    });
  }

  function toggleBookStatus(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const statusCycle = ['To Read', 'Reading', 'Read'];
    const currentIndex = statusCycle.indexOf(book.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    book.status = nextStatus;
    persistData();
    renderCatalog();
    renderDashboard();
    showToast(`Status updated to "${nextStatus}"`);
  }

  function deleteBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      books = books.filter(b => b.id !== bookId);
      expandedBookIds.delete(bookId);
      persistData();
      renderCatalog();
      renderDashboard();
      showToast(`Deleted "${book.title}"`);
    }
  }

  function startEditBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (formViewTitle) formViewTitle.textContent = `Edit Book`;
    if (editingBookIdInput) editingBookIdInput.value = book.id;
    if (formTitle) formTitle.value = book.title;
    if (formAuthor) formAuthor.value = book.author;
    if (formPages) formPages.value = book.pages;
    if (formTag) formTag.value = book.tag || '';
    if (formDate) formDate.value = book.date || '';
    if (formStatus) formStatus.value = book.status || 'To Read';
    if (formSynopsis) formSynopsis.value = book.synopsis || '';
    if (formIsFavorite) formIsFavorite.checked = !!book.isFavorite;

    newlyPickedCoverFile = '';
    const existingCover = book.coverImage || book.cover || '';
    currentUploadedCover = existingCover;

    if (existingCover && coverPreviewImg && coverPreviewRow) {
      coverPreviewImg.src = existingCover;
      coverPreviewRow.style.display = 'flex';
    } else if (coverPreviewRow) {
      coverPreviewRow.style.display = 'none';
      if (coverPreviewImg) coverPreviewImg.src = '';
    }

    switchView('add-book');
  }

  function resetBookForm() {
    if (formViewTitle) formViewTitle.textContent = `Add Book`;
    if (editingBookIdInput) editingBookIdInput.value = '';
    if (bookForm) bookForm.reset();
    if (formDate) {
      formDate.value = new Date().toISOString().split('T')[0];
    }
    if (formSynopsis) formSynopsis.value = '';
    if (formCoverFile) formCoverFile.value = '';
    newlyPickedCoverFile = '';
    currentUploadedCover = '';
    if (coverPreviewRow) coverPreviewRow.style.display = 'none';
    if (coverPreviewImg) coverPreviewImg.src = '';
  }

  if (bookForm) {
    bookForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = formTitle.value.trim();
      const author = formAuthor.value.trim();
      const pages = parseInt(formPages.value, 10) || 0;
      const tag = formTag.value.trim() || 'General';
      const date = formDate.value || new Date().toISOString().split('T')[0];
      const status = formStatus.value;
      const synopsis = formSynopsis ? formSynopsis.value.trim() : '';
      const editId = editingBookIdInput.value ? parseInt(editingBookIdInput.value, 10) : null;

      if (!title || !author) {
        alert('Please fill out the title and author.');
        return;
      }

      if (editId) {
        const index = books.findIndex(b => b.id === editId);
        if (index !== -1) {
          let finalCover = './assets/empty-book.svg';
          if (newlyPickedCoverFile) {
            finalCover = newlyPickedCoverFile;
          } else if (currentUploadedCover) {
            finalCover = currentUploadedCover;
          } else if (books[index]) {
            finalCover = books[index].coverImage || books[index].cover || './assets/empty-book.svg';
          }

          books[index] = {
            ...books[index],
            title,
            author,
            pages,
            tag,
            date,
            status,
            synopsis: synopsis || books[index].synopsis || '',
            cover: finalCover,
            coverImage: finalCover,
            isFavorite: formIsFavorite ? formIsFavorite.checked : false
          };
          showToast(`Updated "${title}"`);
        }
      } else {
        let finalCover = './assets/empty-book.svg';
        if (newlyPickedCoverFile) {
          finalCover = newlyPickedCoverFile;
        } else if (currentUploadedCover) {
          finalCover = currentUploadedCover;
        }

        const newBook = {
          id: Date.now(),
          title,
          author,
          pages,
          tag,
          date,
          status,
          synopsis,
          cover: finalCover,
          coverImage: finalCover,
          isFavorite: formIsFavorite ? formIsFavorite.checked : false
        };
        books.unshift(newBook);
        showToast(`Saved "${title}" to your vault`);
      }

      persistData();
      resetBookForm();
      switchView('catalog');
    });
  }

  if (settingsForm) {
    if (prefReaderGoal) prefReaderGoal.value = readerGoal;
    if (prefReaderMotto) prefReaderMotto.value = readerMotto;

    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      readerGoal = prefReaderGoal ? parseInt(prefReaderGoal.value, 10) || 25 : 25;
      readerMotto = prefReaderMotto ? prefReaderMotto.value.trim() : 'A quiet space for every book.';
      persistData();
      showToast('Reading target saved successfully.');
    });
  }

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

  [catalogSearchInput, catalogRegexCheck, catalogCaseCheck, catalogSort, catalogFilterTag, catalogFilterStatus].forEach(el => {
    if (el) el.addEventListener('input', renderCatalog);
  });

  updateHomeHeroStats();
  renderDashboard();
  renderCatalog();

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['home', 'dashboard', 'catalog', 'add-book', 'settings', 'about'].includes(initialHash)) {
    switchView(initialHash, false);
    history.replaceState({ view: initialHash }, '', '#' + initialHash);
  } else if (defaultViewSetting && defaultViewSetting !== 'home') {
    switchView(defaultViewSetting, false);
    history.replaceState({ view: defaultViewSetting }, '', '#' + defaultViewSetting);
  } else {
    history.replaceState({ view: 'home' }, '', window.location.pathname + window.location.search);
  }
});

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
