// ===== Detail Page Logic =====

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();
  renderFooter();
  await loadGenres();

  const id = getParam('id');
  const type = getParam('type') || 'movie';
  if (!id) { window.location.href = 'index.html'; return; }

  const data = type === 'tv' ? await TMDB.tvDetails(id) : await TMDB.movieDetails(id);
  if (!data) {
    document.getElementById('detailHero').innerHTML = `
      <div style="padding:100px 20px;text-align:center">
        <h2>Content not found</h2>
        <p style="color:var(--text-muted);margin-top:8px">The requested content could not be loaded.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:20px;display:inline-flex">← Back to Home</a>
      </div>
    `;
    return;
  }

  renderDetail(data, type);
});

function renderDetail(data, type) {
  const title = esc(data.title || data.name || 'Untitled');
  const year = TMDB.getYear(data.release_date || data.first_air_date);
  const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
  const runtime = type === 'tv'
    ? (data.episode_run_time?.[0] ? TMDB.formatRuntime(data.episode_run_time[0]) : 'N/A')
    : TMDB.formatRuntime(data.runtime);
  const backdrop = TMDB.img(data.backdrop_path, 'backdrop_lg');
  const poster = TMDB.img(data.poster_path, 'poster_lg');
  const genres = data.genres || [];
  const overview = esc(data.overview || 'No description available.');
  const tagline = esc(data.tagline || '');
  const typeLabel = type === 'tv' ? 'Series' : 'Movie';

  // Update page title
  document.title = `${data.title || data.name} - FlickyStream`;

  // Hero section
  const detailHero = document.getElementById('detailHero');
  detailHero.innerHTML = `
    <div class="detail-backdrop" style="background-image: url('${backdrop}')"></div>
    <div class="detail-overlay"></div>
    <div class="detail-content">
      <div class="detail-poster">
        <img src="${poster}" alt="${title}">
      </div>
      <div class="detail-info">
        <span class="detail-type">${typeLabel}</span>
        <h1 class="detail-title">${title}</h1>
        ${tagline ? `<p class="detail-tagline">"${tagline}"</p>` : ''}
        <div class="detail-meta">
          <span class="rating-badge"><span class="star">★</span> ${rating}</span>
          <span class="meta-item">${year}</span>
          <span class="meta-item">${runtime}</span>
        </div>
        <div class="detail-genres">
          ${genres.map(g => `<span class="genre-pill">${esc(g.name)}</span>`).join('')}
        </div>
        <p class="detail-description">${overview}</p>
        <div class="detail-actions">
          <a href="watch.html?id=${data.id}&type=${type}" class="btn btn-primary">▶ Watch Now</a>
          <button class="btn btn-secondary" id="addListBtn">+ Add to List</button>
        </div>
      </div>
    </div>
  `;

  // Add to list button
  const addBtn = document.getElementById('addListBtn');
  if (addBtn) {
    // Check if already in list
    if (MyList.has(data.id, type)) {
      addBtn.textContent = '✓ In Your List';
    }
    addBtn.addEventListener('click', () => {
      const added = MyList.toggle({ id: data.id, media_type: type, title: data.title || data.name, poster_path: data.poster_path });
      addBtn.textContent = added ? '✓ In Your List' : '+ Add to List';
    });
  }

  // Cast
  renderCast(data.credits?.cast?.slice(0, 15) || []);

  // Seasons (TV only)
  if (type === 'tv' && data.seasons?.length) {
    renderSeasons(data.id, data.seasons);
  }

  // Similar
  const similar = data.similar?.results || data.recommendations?.results || [];
  renderSimilar(similar.slice(0, 12), type);
}

function renderCast(cast) {
  const section = document.getElementById('castSection');
  if (!section || !cast.length) { section?.classList.add('hidden'); return; }

  section.classList.remove('hidden');
  section.innerHTML = `
    <h3>Cast</h3>
    <div class="cast-carousel">
      ${cast.map(person => `
        <div class="cast-card">
          <img src="${TMDB.img(person.profile_path, 'profile')}" alt="${esc(person.name)}" loading="lazy">
          <div class="cast-name">${esc(person.name)}</div>
          <div class="cast-role">${esc(person.character || '')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

async function renderSeasons(tvId, seasons) {
  const section = document.getElementById('seasonSection');
  if (!section) return;

  // Filter out specials (season 0) and sort
  const validSeasons = seasons.filter(s => s.season_number > 0).sort((a, b) => a.season_number - b.season_number);
  if (!validSeasons.length) { section.classList.add('hidden'); return; }

  section.classList.remove('hidden');
  section.innerHTML = `
    <h3>Seasons & Episodes</h3>
    <div class="season-tabs" id="seasonTabs">
      ${validSeasons.map((s, i) => `
        <button class="season-tab ${i === 0 ? 'active' : ''}" data-season="${s.season_number}">
          Season ${s.season_number}
        </button>
      `).join('')}
    </div>
    <div class="episode-list" id="episodeList">
      <div class="loading-spinner"><div class="spinner"></div></div>
    </div>
  `;

  // Tab click
  section.querySelectorAll('.season-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      section.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadEpisodes(tvId, parseInt(tab.dataset.season));
    });
  });

  // Load first season
  loadEpisodes(tvId, validSeasons[0].season_number);
}

async function loadEpisodes(tvId, seasonNum) {
  const list = document.getElementById('episodeList');
  if (!list) return;
  list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    const data = await TMDB.tvSeason(tvId, seasonNum);
    if (!data?.episodes?.length) {
      list.innerHTML = '<p style="color:var(--text-muted)">No episodes available.</p>';
      return;
    }

    list.innerHTML = data.episodes.map(ep => `
      <a href="watch.html?id=${tvId}&type=tv&s=${seasonNum}&e=${ep.episode_number}" class="episode-card">
        <div class="episode-thumb">
          <img src="${TMDB.img(ep.still_path, 'still')}" alt="Episode ${ep.episode_number}" loading="lazy">
        </div>
        <div class="episode-info">
          <div class="episode-number">S${String(seasonNum).padStart(2,'0')}E${String(ep.episode_number).padStart(2,'0')}</div>
          <div class="episode-title">${esc(ep.name || 'Episode ' + ep.episode_number)}</div>
          <div class="episode-desc">${esc(ep.overview || 'No description.')}</div>
        </div>
      </a>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p style="color:var(--text-muted)">Failed to load episodes.</p>';
  }
}

function renderSimilar(items, type) {
  const section = document.getElementById('similarSection');
  if (!section || !items.length) { section?.classList.add('hidden'); return; }

  section.classList.remove('hidden');
  section.innerHTML = `
    <h3>You Might Also Like</h3>
    <div class="carousel-wrapper">
      <button class="carousel-btn prev" aria-label="Previous">◀</button>
      <div class="carousel">
        ${items.map(item => {
          const mType = type;
          const t = esc(item.title || item.name || 'Untitled');
          const y = TMDB.getYear(item.release_date || item.first_air_date);
          const r = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
          const p = TMDB.img(item.poster_path, 'poster');
          return `
            <div class="card" onclick="location.href='detail.html?id=${item.id}&type=${mType}'">
              <div class="card-poster">
                <img src="${p}" alt="${t}" loading="lazy">
                <div class="card-rating"><span class="star">★</span> ${r}</div>
                <div class="card-type">${mType === 'tv' ? 'Series' : 'Movie'}</div>
              </div>
              <div class="card-info">
                <div class="card-title">${t}</div>
                <div class="card-year">${y}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <button class="carousel-btn next" aria-label="Next">▶</button>
    </div>
  `;
  setupCarouselButtons(section);
}
