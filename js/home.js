// ===== Homepage Logic =====

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('home');
  renderFooter();

  await loadGenres();

  // Hero banner - use trending
  const trending = await TMDB.trending('week');
  if (trending?.results?.length) {
    const featured = trending.results[0];
    renderHero(featured);
  }

  // Content sections
  const main = document.getElementById('mainContent');
  if (!main) return;

  const sections = [
    { title: 'Currently On The Air', id: 'airing-today', fetch: () => TMDB.airingToday(), link: 'browse.html?type=tv&filter=airing_today' },
    { title: 'Popular Movies', id: 'popular-movies', fetch: () => TMDB.popularMovies(), link: 'browse.html?type=movie&filter=popular' },
    { title: 'Popular Series', id: 'popular-series', fetch: () => TMDB.popularTV(), link: 'browse.html?type=tv&filter=popular' },
    { title: 'Coming Soon', id: 'upcoming', fetch: () => TMDB.upcomingMovies(), link: 'browse.html?type=movie&filter=upcoming' },
    { title: 'Top Rated Movies', id: 'top-rated-movies', fetch: () => TMDB.topRatedMovies(), link: 'browse.html?type=movie&filter=top_rated' },
    { title: 'Top Rated Series', id: 'top-rated-series', fetch: () => TMDB.topRatedTV(), link: 'browse.html?type=tv&filter=top_rated' },
    { title: 'Netflix Originals', id: 'netflix', fetch: () => TMDB.discoverTV({ with_networks: 213, sort_by: 'popularity.desc' }), link: 'browse.html?type=tv&network=213' },
    { title: 'Disney+', id: 'disney', fetch: () => TMDB.discoverTV({ with_networks: 2739, sort_by: 'popularity.desc' }), link: 'browse.html?type=tv&network=2739' },
    { title: 'HBO', id: 'hbo', fetch: () => TMDB.discoverTV({ with_networks: 49, sort_by: 'popularity.desc' }), link: 'browse.html?type=tv&network=49' },
    { title: 'Prime Video', id: 'prime', fetch: () => TMDB.discoverTV({ with_networks: 1024, sort_by: 'popularity.desc' }), link: 'browse.html?type=tv&network=1024' },
    { title: 'Apple TV+', id: 'apple', fetch: () => TMDB.discoverTV({ with_networks: 2552, sort_by: 'popularity.desc' }), link: 'browse.html?type=tv&network=2552' },
    { title: 'Animation', id: 'animation', fetch: () => TMDB.discoverMovies({ with_genres: 16, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=16' },
    { title: 'Anime', id: 'anime', fetch: () => TMDB.discoverTV({ with_genres: 16, with_original_language: 'ja', sort_by: 'popularity.desc' }), link: 'browse.html?type=tv&genre=16' },
    { title: 'K-Drama', id: 'kdrama', fetch: () => TMDB.discoverTV({ with_genres: 18, with_original_language: 'ko', sort_by: 'popularity.desc' }), link: 'browse.html?type=tv&lang=ko' },
    { title: 'Bollywood', id: 'bollywood', fetch: () => TMDB.discoverMovies({ with_original_language: 'hi', sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&lang=hi' },
    { title: 'Documentaries', id: 'docs', fetch: () => TMDB.discoverMovies({ with_genres: 99, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=99' },
    { title: 'Action & Adventure', id: 'action', fetch: () => TMDB.discoverMovies({ with_genres: '28,12', sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=28' },
    { title: 'Fantasy', id: 'fantasy', fetch: () => TMDB.discoverMovies({ with_genres: 14, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=14' },
    { title: 'War', id: 'war', fetch: () => TMDB.discoverMovies({ with_genres: 10752, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=10752' },
    { title: 'Drama', id: 'drama', fetch: () => TMDB.discoverMovies({ with_genres: 18, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=18' },
    { title: 'Mystery', id: 'mystery', fetch: () => TMDB.discoverMovies({ with_genres: 9648, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=9648' },
    { title: 'Crime', id: 'crime', fetch: () => TMDB.discoverMovies({ with_genres: 80, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=80' },
    { title: 'Sci-Fi', id: 'scifi', fetch: () => TMDB.discoverMovies({ with_genres: 878, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=878' },
    { title: 'Thriller', id: 'thriller', fetch: () => TMDB.discoverMovies({ with_genres: 53, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=53' },
    { title: 'Timeless Classics', id: 'classics', fetch: () => TMDB.discoverMovies({ 'primary_release_date.lte': '1980-01-01', 'vote_average.gte': 7, sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&filter=classics' },
    { title: 'Family Friendly', id: 'family', fetch: () => TMDB.discoverMovies({ with_genres: '10751', sort_by: 'popularity.desc' }), link: 'browse.html?type=movie&genre=10751' },
    { title: 'Kids Picks', id: 'kids', fetch: () => TMDB.discoverTV({ with_genres: '10762', sort_by: 'popularity.desc' }), link: 'browse.html?type=tv&genre=10762' },
  ];

  // Create all sections
  for (const s of sections) {
    const section = createSection(s.title, s.id, s.link);
    main.appendChild(section);
    populateSection(section, s.fetch);
  }
});

function renderHero(item) {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = esc(item.title || item.name || 'Untitled');
  const year = TMDB.getYear(item.release_date || item.first_air_date);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  const backdrop = TMDB.img(item.backdrop_path, 'backdrop_lg');
  const overview = esc(item.overview || '');
  const genreNames = getGenreNames(item.genre_ids, mediaType).slice(0, 4);
  const typeLabel = mediaType === 'tv' ? 'Series' : 'Movie';

  hero.innerHTML = `
    <div class="hero-backdrop" style="background-image: url('${backdrop}')"></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-badge"><span class="star">★</span> ${rating}</div>
      <h1 class="hero-title">${title}</h1>
      <div class="hero-meta">
        <span class="tag">${typeLabel}</span>
        <span>${year}</span>
      </div>
      <div class="hero-genres">
        ${genreNames.map(g => `<span class="genre-pill">${esc(g)}</span>`).join('')}
      </div>
      <p class="hero-overview">${overview}</p>
      <div class="hero-buttons">
        <a href="watch.html?id=${item.id}&type=${mediaType}" class="btn btn-primary">▶ Watch Now</a>
        <button class="btn btn-secondary" id="heroAddListBtn">+ Add to List</button>
      </div>
    </div>
  `;

  // Use proper event listener instead of inline onclick
  document.getElementById('heroAddListBtn')?.addEventListener('click', function() {
    const added = MyList.toggle({ id: item.id, media_type: mediaType, title: item.title || item.name, poster_path: item.poster_path });
    this.textContent = added ? '✓ Added' : '+ Add to List';
    setTimeout(() => { this.textContent = '+ Add to List'; }, 2000);
  });
}
