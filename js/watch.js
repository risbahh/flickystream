// ===== Watch Page Logic =====

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();
  renderFooter();
  await loadGenres();

  const id = getParam('id');
  const type = getParam('type') || 'movie';
  const season = getParam('s');
  const episode = getParam('e');
  if (!id) { window.location.href = 'index.html'; return; }

  const data = type === 'tv' ? await TMDB.tvDetails(id) : await TMDB.movieDetails(id);
  if (!data) return;

  const title = data.title || data.name || 'Untitled';
  const year = TMDB.getYear(data.release_date || data.first_air_date);
  const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
  const runtime = type === 'tv'
    ? (data.episode_run_time?.[0] ? TMDB.formatRuntime(data.episode_run_time[0]) : 'N/A')
    : TMDB.formatRuntime(data.runtime);
  const typeLabel = type === 'tv' ? 'Series' : 'Movie';

  document.title = `Watch ${title} - FlickyStream`;

  // Get trailer URL
  const trailerUrl = TMDB.getTrailerUrl(data.videos);

  // Player
  const playerWrapper = document.getElementById('playerWrapper');
  if (trailerUrl) {
    playerWrapper.innerHTML = `
      <iframe src="${trailerUrl}?autoplay=0&rel=0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
    `;
  } else {
    playerWrapper.innerHTML = `
      <div class="player-placeholder">
        <div class="play-icon">▶</div>
        <p>Video player placeholder</p>
        <p style="font-size:0.8rem; margin-top:8px; color:#555">No trailer available. In production, this would use a video streaming server.</p>
      </div>
    `;
  }

  // Info
  const watchInfo = document.getElementById('watchInfo');
  let episodeInfo = '';
  if (type === 'tv' && season && episode) {
    episodeInfo = `<span class="meta-item">S${season} E${episode}</span>`;
  }

  watchInfo.innerHTML = `
    <h1 class="watch-title">${title}</h1>
    <div class="watch-meta">
      <span class="meta-item">${typeLabel}</span>
      <span class="meta-item">${year}</span>
      <span class="meta-item">★ ${rating}</span>
      <span class="meta-item">${runtime}</span>
      ${episodeInfo}
    </div>
  `;

  // Settings panel
  renderSettings();

  // Comments placeholder
  renderComments(title);
});

function renderSettings() {
  const panel = document.getElementById('settingsPanel');
  if (!panel) return;

  panel.innerHTML = `
    <h3>⚙ Player Settings</h3>
    <div class="settings-grid">
      <div class="setting-item">
        <label>Quality</label>
        <select id="qualitySelect">
          <option value="auto">Auto</option>
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
          <option value="480p">480p</option>
          <option value="360p">360p</option>
        </select>
      </div>
      <div class="setting-item">
        <label>Server</label>
        <select id="serverSelect">
          <option value="1">Server 1</option>
          <option value="2">Server 2</option>
          <option value="3">Server 3</option>
        </select>
      </div>
      <div class="setting-item">
        <label>Playback Speed</label>
        <select id="speedSelect">
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1" selected>1x (Normal)</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
      <div class="setting-item">
        <label>Subtitle Style</label>
        <select id="subtitleStyle">
          <option value="default">Default</option>
          <option value="large">Large</option>
          <option value="yellow">Yellow Text</option>
          <option value="outline">Outline Only</option>
        </select>
      </div>
      <div class="setting-item">
        <label class="toggle-switch">
          <input type="checkbox" id="volumeBoost">
          <span class="toggle-label">Volume Boost</span>
        </label>
      </div>
      <div class="setting-item">
        <label class="toggle-switch">
          <input type="checkbox" id="spatialAudio">
          <span class="toggle-label">Spatial Audio</span>
        </label>
      </div>
      <div class="setting-item">
        <label class="toggle-switch">
          <input type="checkbox" id="upscaler4k">
          <span class="toggle-label">4K Upscaler</span>
        </label>
      </div>
      <div class="setting-item">
        <label class="toggle-switch">
          <input type="checkbox" id="autoPlay" checked>
          <span class="toggle-label">Auto-Play Next</span>
        </label>
      </div>
      <div class="setting-item">
        <label>Video Zoom</label>
        <select id="videoZoom">
          <option value="100" selected>100%</option>
          <option value="110">110%</option>
          <option value="120">120%</option>
          <option value="130">130%</option>
          <option value="150">150%</option>
        </select>
      </div>
    </div>
  `;
}

function renderComments(title) {
  const section = document.getElementById('commentsSection');
  if (!section) return;

  const comments = [
    { user: 'MovieFan42', avatar: 'M', time: '2 hours ago', text: `Just watched this and it was amazing! The cinematography was top-notch.` },
    { user: 'CinemaLover', avatar: 'C', time: '5 hours ago', text: `One of the best I've seen this year. Highly recommend!` },
    { user: 'StreamKing', avatar: 'S', time: '1 day ago', text: `Great quality stream. Thanks FlickyStream! 🎬` },
  ];

  section.innerHTML = `
    <h3>💬 Comments</h3>
    ${comments.map(c => `
      <div class="comment-box">
        <div class="comment-header">
          <div class="comment-avatar">${c.avatar}</div>
          <span class="comment-user">${c.user}</span>
          <span class="comment-time">${c.time}</span>
        </div>
        <p class="comment-text">${c.text}</p>
      </div>
    `).join('')}
    <div style="margin-top:16px">
      <input type="text" class="search-input" placeholder="Add a comment..." style="font-size:0.9rem; padding:12px 16px 12px 16px">
    </div>
  `;
}
