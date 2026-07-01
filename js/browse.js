// ===== Browse Page Logic =====

const BrowseState = {
  type: 'movie',
  sort: 'popularity.desc',
  genre: null,
  network: null,
  lang: null,
  filter: null,
  page: 1,
  loading: false
};

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('movies');
  renderFooter();
  await loadGenres();

  // Parse URL params
  const type = getParam('type');
  const filter = getParam('filter');
  const genre = getParam('genre');
  const network = getParam('network');
  const lang = getParam('lang');
  const mylist = getParam('mylist');

  if (type) BrowseState.type = type;
  if (filter) BrowseState.filter = filter;
  if (genre) BrowseState.genre = genre;
  if (network) BrowseState.network = network;
  if (lang) BrowseState.lang = lang;

  // Update active type button
  updateTypeButtons();
  updateSortButtons();

  // Load genres for pills
  loadGenrePills();

  // Handle My List view
  if (mylist) {
    renderMyList();
    return;
  }

  // Handle Sports (placeholder)
  if (BrowseState.type === 'sports') {
    document.getElementById('browseGrid').innerHTML = `
      <div class="no-results" style="grid-column: 1/-1">
        <div class="emoji">⚽</div>
        <p>Sports coming soon!</p>
        <p style="font-size:0.85rem; margin-top:8px">Live sports streaming will be available in a future update.</p>
      </div>
    `;
    document.getElementById('loadMoreBtn').style.display = 'none';
    document.getElementById('genrePills').style.display = 'none';
    return;
  }

  // Load content
  loadContent();

  // Filter button clicks
  document.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      BrowseState.type = btn.dataset.type;
      BrowseState.page = 1;
      BrowseState.genre = null;
      BrowseState.network = null;
      BrowseState.lang = null;
      BrowseState.filter = null;
      updateTypeButtons();
      loadGenrePills();
      document.getElementById('browseGrid').innerHTML = '';
      document.getElementById('loadMoreBtn').style.display = 'block';
      document.getElementById('genrePills').style.display = 'flex';
      loadContent();
      updatePageTitle();
    });
  });

  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      BrowseState.sort = btn.dataset.sort;
      BrowseState.page = 1;
      updateSortButtons();
      document.getElementById('browseGrid').innerHTML = '';
      document.getElementById('loadMoreBtn').style.display = 'block';
      loadContent();
    });
  });

  // Load More
  document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    BrowseState.page++;
    loadContent();
  });

  // Update title based on filters
  updatePageTitle();
});

function updateTypeButtons() {
  document.querySelectorAll('[data-type]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === BrowseState.type);
  });
}

function updateSortButtons() {
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === BrowseState.sort);
  });
}

function updatePageTitle() {
  const titles = {
    'movie': 'Movies',
    'tv': 'TV Shows',
    'sports': 'Sports'
  };
  let title = titles[BrowseState.type] || 'Browse';
  if (BrowseState.filter === 'airing_today') title = 'Currently On The Air';
  if (BrowseState.filter === 'popular') title = `Popular ${title}`;
  if (BrowseState.filter === 'top_rated') title = `Top Rated ${title}`;
  if (BrowseState.filter === 'upcoming') title = 'Coming Soon';
  if (BrowseState.filter === 'classics') title = 'Timeless Classics';
  if (BrowseState.network) {
    const networkNames = { 213: 'Netflix', 2739: 'Disney+', 49: 'HBO', 1024: 'Prime Video', 2552: 'Apple TV+' };
    title = networkNames[BrowseState.network] || title;
  }
  document.title = `${title} - FlickyStream`;
}

function loadGenrePills() {
  const container = document.getElementById('genrePills');
  if (!container) return;

  const genreMap = BrowseState.type === 'tv' ? TV_GENRES : MOVIE_GENRES;
  const genres = Object.entries(genreMap).map(([id, name]) => ({ id, name }));

  container.innerHTML = `
    <button class="filter-btn ${!BrowseState.genre ? 'active' : ''}" data-genre="">All</button>
    ${genres.map(g => `
      <button class="filter-btn ${String(BrowseState.genre) === String(g.id) ? 'active' : ''}" data-genre="${g.id}">${g.name}</button>
    `).join('')}
  `;

  container.querySelectorAll('[data-genre]').forEach(btn => {
    btn.addEventListener('click', () => {
      BrowseState.genre = btn.dataset.genre || null;
      BrowseState.page = 1;
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('browseGrid').innerHTML = '';
      document.getElementById('loadMoreBtn').style.display = 'block';
      loadContent();
    });
  });
}

async function loadContent() {
  if (BrowseState.loading) return;
  BrowseState.loading = true;

  const grid = document.getElementById('browseGrid');
  const loadBtn = document.getElementById('loadMoreBtn');

  let data;

  try {
    if (BrowseState.network) {
      data = await TMDB.discoverTV({ with_networks: BrowseState.network, sort_by: BrowseState.sort }, BrowseState.page);
    } else if (BrowseState.lang) {
      const params = { with_original_language: BrowseState.lang, sort_by: BrowseState.sort };
      if (BrowseState.genre) params.with_genres = BrowseState.genre;
      data = BrowseState.type === 'tv'
        ? await TMDB.discoverTV(params, BrowseState.page)
        : await TMDB.discoverMovies(params, BrowseState.page);
    } else if (BrowseState.filter === 'airing_today') {
      data = await TMDB.airingToday(BrowseState.page);
    } else if (BrowseState.filter === 'popular') {
      data = BrowseState.type === 'tv' ? await TMDB.popularTV(BrowseState.page) : await TMDB.popularMovies(BrowseState.page);
    } else if (BrowseState.filter === 'top_rated') {
      data = BrowseState.type === 'tv' ? await TMDB.topRatedTV(BrowseState.page) : await TMDB.topRatedMovies(BrowseState.page);
    } else if (BrowseState.filter === 'upcoming') {
      data = await TMDB.upcomingMovies(BrowseState.page);
    } else if (BrowseState.filter === 'classics') {
      data = await TMDB.discoverMovies({ 'primary_release_date.lte': '1980-01-01', 'vote_average.gte': 7, sort_by: 'popularity.desc' }, BrowseState.page);
    } else {
      const params = { sort_by: BrowseState.sort };
      if (BrowseState.genre) params.with_genres = BrowseState.genre;
      data = BrowseState.type === 'tv'
        ? await TMDB.discoverTV(params, BrowseState.page)
        : await TMDB.discoverMovies(params, BrowseState.page);
    }

    const items = (data?.results || []).filter(i => i.poster_path);

    if (!items.length && BrowseState.page === 1) {
      grid.innerHTML = `
        <div class="no-results" style="grid-column: 1/-1">
          <div class="emoji">🎬</div>
          <p>No results found</p>
          <p style="font-size:0.85rem; margin-top:8px">Try a different filter or genre</p>
        </div>
      `;
      if (loadBtn) loadBtn.style.display = 'none';
    } else {
      items.forEach(item => {
        item.media_type = BrowseState.type;
        grid.appendChild(createCard(item));
      });

      observeLazyImages(grid);

      // Hide load more if no more results
      if (!data?.results?.length || data.page >= data.total_pages) {
        if (loadBtn) loadBtn.style.display = 'none';
      } else {
        if (loadBtn) loadBtn.style.display = 'block';
      }
    }
  } catch (err) {
    console.error('Browse load error:', err);
    if (BrowseState.page === 1) {
      grid.innerHTML = `
        <div class="no-results" style="grid-column: 1/-1">
          <div class="emoji">⚠️</div>
          <p>Failed to load content</p>
          <p style="font-size:0.85rem; margin-top:8px">Please try again later</p>
        </div>
      `;
    }
  }

  BrowseState.loading = false;
}

function renderMyList() {
  const grid = document.getElementById('browseGrid');
  const filters = document.getElementById('browseFilters');
  const pills = document.getElementById('genrePills');
  const loadBtn = document.getElementById('loadMoreBtn');

  if (filters) filters.style.display = 'none';
  if (pills) pills.style.display = 'none';
  if (loadBtn) loadBtn.style.display = 'none';

  document.title = 'My List - FlickyStream';

  const list = MyList.getAll();
  if (!list.length) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column: 1/-1">
        <div class="emoji">📋</div>
        <p>Your list is empty</p>
        <p style="font-size:0.85rem; margin-top:8px">Add movies and shows to your list to watch later</p>
      </div>
    `;
    return;
  }

  list.forEach(item => {
    const card = createCard(item);
    grid.appendChild(card);
  });

  observeLazyImages(grid);
}
