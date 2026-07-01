// ===== TMDB API Wrapper =====

const TMDB = {
  API_KEY: 'd5dfffb05e53e55b553b5e9c33b7c7d2',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMG_BASE: 'https://image.tmdb.org/t/p/',
  IMG_SIZES: {
    poster_sm: 'w185',
    poster: 'w342',
    poster_lg: 'w500',
    backdrop: 'w1280',
    backdrop_lg: 'original',
    profile: 'w185',
    still: 'w300'
  },

  async fetch(endpoint, params = {}) {
    const url = new URL(`${this.BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', this.API_KEY);
    url.searchParams.set('language', 'en-US');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TMDB ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('TMDB API error:', err);
      return null;
    }
  },

  img(path, size = 'poster') {
    if (!path) return 'https://via.placeholder.com/342x513/1a1a1a/333?text=No+Image';
    return `${this.IMG_BASE}${this.IMG_SIZES[size] || size}${path}`;
  },

  // ---- Endpoints ----

  trending(timeWindow = 'week', page = 1) {
    return this.fetch(`/trending/all/${timeWindow}`, { page });
  },

  popularMovies(page = 1) {
    return this.fetch('/movie/popular', { page });
  },

  topRatedMovies(page = 1) {
    return this.fetch('/movie/top_rated', { page });
  },

  upcomingMovies(page = 1) {
    return this.fetch('/movie/upcoming', { page });
  },

  nowPlayingMovies(page = 1) {
    return this.fetch('/movie/now_playing', { page });
  },

  popularTV(page = 1) {
    return this.fetch('/tv/popular', { page });
  },

  topRatedTV(page = 1) {
    return this.fetch('/tv/top_rated', { page });
  },

  airingToday(page = 1) {
    return this.fetch('/tv/airing_today', { page });
  },

  discoverTV(params = {}, page = 1) {
    return this.fetch('/discover/tv', { page, ...params });
  },

  discoverMovies(params = {}, page = 1) {
    return this.fetch('/discover/movie', { page, ...params });
  },

  movieDetails(id) {
    return this.fetch(`/movie/${id}`, { append_to_response: 'credits,videos,similar,recommendations' });
  },

  tvDetails(id) {
    return this.fetch(`/tv/${id}`, { append_to_response: 'credits,videos,similar,recommendations' });
  },

  tvSeason(tvId, seasonNum) {
    return this.fetch(`/tv/${tvId}/season/${seasonNum}`);
  },

  searchMulti(query, page = 1) {
    return this.fetch('/search/multi', { query, page });
  },

  movieGenres() {
    return this.fetch('/genre/movie/list');
  },

  tvGenres() {
    return this.fetch('/genre/tv/list');
  },

  movieCredits(id) {
    return this.fetch(`/movie/${id}/credits`);
  },

  tvCredits(id) {
    return this.fetch(`/tv/${id}/credits`);
  },

  movieVideos(id) {
    return this.fetch(`/movie/${id}/videos`);
  },

  tvVideos(id) {
    return this.fetch(`/tv/${id}/videos`);
  },

  movieSimilar(id) {
    return this.fetch(`/movie/${id}/similar`);
  },

  tvSimilar(id) {
    return this.fetch(`/tv/${id}/similar`);
  },

  // Helper to get YouTube trailer
  getTrailerUrl(videos) {
    if (!videos || !videos.results) return null;
    const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
      || videos.results.find(v => v.site === 'YouTube');
    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
  },

  // Format runtime
  formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  },

  // Get year from date
  getYear(dateStr) {
    return dateStr ? dateStr.substring(0, 4) : '';
  }
};

// Genre cache
let MOVIE_GENRES = {};
let TV_GENRES = {};

async function loadGenres() {
  const [mg, tg] = await Promise.all([TMDB.movieGenres(), TMDB.tvGenres()]);
  if (mg?.genres) mg.genres.forEach(g => MOVIE_GENRES[g.id] = g.name);
  if (tg?.genres) tg.genres.forEach(g => TV_GENRES[g.id] = g.name);
}

function getGenreNames(genreIds, mediaType = 'movie') {
  if (!genreIds) return [];
  const map = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES;
  return genreIds.map(id => map[id]).filter(Boolean);
}

// My List (LocalStorage)
const MyList = {
  KEY: 'flickystream_mylist',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  add(item) {
    const list = this.getAll();
    if (!list.find(i => i.id === item.id && i.media_type === item.media_type)) {
      list.push({ id: item.id, media_type: item.media_type, title: item.title || item.name, poster_path: item.poster_path });
      localStorage.setItem(this.KEY, JSON.stringify(list));
    }
  },

  remove(id, mediaType) {
    const list = this.getAll().filter(i => !(i.id === id && i.media_type === mediaType));
    localStorage.setItem(this.KEY, JSON.stringify(list));
  },

  has(id, mediaType) {
    return this.getAll().some(i => i.id === id && i.media_type === mediaType);
  },

  toggle(item) {
    if (this.has(item.id, item.media_type)) {
      this.remove(item.id, item.media_type);
      return false;
    } else {
      this.add(item);
      return true;
    }
  }
};
