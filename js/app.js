// ===== Main App Logic =====

// Navbar injection
function renderNavbar(activePage = 'home') {
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <a href="index.html" class="nav-logo">
      <span class="flicky">flicky</span><span class="stream">stream</span>
    </a>
    <ul class="nav-links" id="navLinks">
      <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
      <li><a href="browse.html?type=movie" class="${activePage === 'movies' ? 'active' : ''}">Movies</a></li>
      <li><a href="browse.html?type=tv" class="${activePage === 'tvshows' ? 'active' : ''}">TV Shows</a></li>
      <li><a href="browse.html?type=sports" class="${activePage === 'sports' ? 'active' : ''}">Sports</a></li>
    </ul>
    <div class="nav-right">
      <a href="search.html" class="search-btn" title="Search">🔍</a>
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Menu">☰</button>
    </div>
  `;
  document.body.prepend(nav);

  // Mobile menu
  const btn = document.getElementById('mobileMenuBtn');
  const links = document.getElementById('navLinks');
  btn?.addEventListener('click', () => {
    links.classList.toggle('open');
  });
}

// Footer injection
function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="footer-top">
      <div class="footer-brand">
        <div class="nav-logo">
          <span class="flicky">flicky</span><span class="stream">stream</span>
        </div>
        <p class="footer-tagline">Watch movies, series and live sports for free</p>
      </div>
      <div class="footer-col">
        <h4>Browse</h4>
        <ul>
          <li><a href="browse.html?type=movie">Movies</a></li>
          <li><a href="browse.html?type=tv">TV Shows</a></li>
          <li><a href="browse.html?type=sports">Sports</a></li>
          <li><a href="browse.html?mylist=true">My List</a></li>
          <li><a href="search.html">Search</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Community</h4>
        <ul>
          <li><a href="#">Discord</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      © 2026 FlickyStream. All rights reserved.
    </div>
  `;
  document.body.appendChild(footer);
}

// Card component
function createCard(item) {
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = item.title || item.name || 'Untitled';
  const year = TMDB.getYear(item.release_date || item.first_air_date);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  const poster = TMDB.img(item.poster_path, 'poster');
  const typeLabel = mediaType === 'tv' ? 'Series' : 'Movie';

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-poster">
      <img data-src="${poster}" alt="${title}" loading="lazy">
      <div class="card-rating"><span class="star">★</span> ${rating}</div>
      <div class="card-type">${typeLabel}</div>
    </div>
    <div class="card-info">
      <div class="card-title">${title}</div>
      <div class="card-year">${year}</div>
    </div>
  `;

  card.addEventListener('click', () => {
    window.location.href = `detail.html?id=${item.id}&type=${mediaType}`;
  });

  return card;
}

// Carousel with lazy loading
function createCarousel(containerId, fetchFn, maxItems = 20) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const carousel = container.querySelector('.carousel') || (() => {
    const c = document.createElement('div');
    c.className = 'carousel';
    container.querySelector('.carousel-wrapper')?.appendChild(c) || container.appendChild(c);
    return c;
  })();

  fetchFn().then(data => {
    const items = (data?.results || []).slice(0, maxItems);
    items.forEach(item => {
      if (item.poster_path) {
        carousel.appendChild(createCard(item));
      }
    });
    observeLazyImages(carousel);
    setupCarouselButtons(container);
  });
}

// Lazy loading with Intersection Observer
function observeLazyImages(container) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.onload = () => img.classList.add('loaded');
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  container.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}

// Carousel navigation buttons
function setupCarouselButtons(wrapper) {
  const carousel = wrapper.querySelector('.carousel');
  const prevBtn = wrapper.querySelector('.carousel-btn.prev');
  const nextBtn = wrapper.querySelector('.carousel-btn.next');
  if (!carousel || !prevBtn || !nextBtn) return;

  const scrollAmount = 600;

  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

// Create a section with carousel
function createSection(title, id, seeAllLink) {
  const section = document.createElement('section');
  section.className = 'section';
  section.id = id;
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">${title}</h2>
      ${seeAllLink ? `<a href="${seeAllLink}" class="section-see-all">See All →</a>` : ''}
    </div>
    <div class="carousel-wrapper">
      <button class="carousel-btn prev" aria-label="Previous">◀</button>
      <div class="carousel"></div>
      <button class="carousel-btn next" aria-label="Next">▶</button>
    </div>
  `;
  return section;
}

// Populate a section
async function populateSection(container, fetchFn, maxItems = 20) {
  const carousel = container.querySelector('.carousel');
  if (!carousel) return;

  const data = await fetchFn();
  const items = (data?.results || []).slice(0, maxItems);
  items.forEach(item => {
    if (item.poster_path) carousel.appendChild(createCard(item));
  });

  observeLazyImages(carousel);
  setupCarouselButtons(container);
}

// Parse URL params
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// Init common elements
document.addEventListener('DOMContentLoaded', async () => {
  await loadGenres();
});

// Debounce helper
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
