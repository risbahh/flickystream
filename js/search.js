// ===== Search Page Logic =====

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('search');
  renderFooter();
  await loadGenres();

  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');
  const trendingSection = document.getElementById('trendingSection');

  // Load trending on init
  loadTrending();

  // Search input with debounce
  searchInput?.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length < 2) {
      resultsContainer.innerHTML = '';
      trendingSection.classList.remove('hidden');
      return;
    }

    trendingSection.classList.add('hidden');
    resultsContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    const data = await TMDB.searchMulti(query);
    renderSearchResults(data?.results || [], query);
  }, 400));

  // Auto-focus
  searchInput?.focus();

  // Pre-fill from URL
  const q = getParam('q');
  if (q) {
    searchInput.value = q;
    searchInput.dispatchEvent(new Event('input'));
  }
});

async function loadTrending() {
  const section = document.getElementById('trendingSection');
  if (!section) return;

  const data = await TMDB.trending('week');
  const grid = section.querySelector('.search-results-grid');
  if (!grid) return;

  const items = (data?.results || []).filter(i => i.poster_path).slice(0, 20);
  items.forEach(item => {
    const card = createCard(item);
    grid.appendChild(card);
  });
  observeLazyImages(grid);
}

function renderSearchResults(results, query) {
  const container = document.getElementById('searchResults');
  if (!container) return;

  const filtered = results.filter(i => i.poster_path && (i.media_type === 'movie' || i.media_type === 'tv'));

  if (!filtered.length) {
    container.innerHTML = `
      <div class="no-results">
        <div class="emoji">🔍</div>
        <p>No results found for "${query}"</p>
        <p style="font-size:0.85rem; margin-top:8px">Try a different search term</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h2 class="search-title">Results for "${query}" (${filtered.length})</h2>
    <div class="search-results-grid" id="resultsGrid"></div>
  `;

  const grid = document.getElementById('resultsGrid');
  filtered.forEach(item => {
    grid.appendChild(createCard(item));
  });
  observeLazyImages(grid);
}
