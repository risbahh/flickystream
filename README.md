# 🎬 FlickyStream Clone

A dark-themed streaming platform website powered by TMDB API.

## Features

- 🎬 **27+ content carousels** — Popular, Top Rated, Netflix, Disney+, HBO, Prime Video, Apple TV+, and more
- 🔍 **Search** with real-time results
- 📱 **Mobile responsive** design
- 🌙 **Dark theme** matching the original FlickyStream
- 📺 **Video player** with quality/speed/subtitle settings
- 📋 **My List** (localStorage-based watchlist)
- 🎭 **Detail pages** with cast, seasons, episodes, and similar content
- ⚡ **Lazy loading** via Intersection Observer

## Tech Stack

- Vanilla HTML / CSS / JavaScript (no frameworks)
- TMDB API for movie & TV data
- Node.js static server (optional)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/flickystream)

1. Fork this repo
2. Go to [vercel.com](https://vercel.com)
3. Import your fork
4. Deploy — no build step needed!

## Local Development

```bash
# Option 1: Node.js server
node server.js
# → http://localhost:3000

# Option 2: Any static file server
npx serve .
# → http://localhost:3000
```

## Project Structure

```
├── index.html          Homepage
├── detail.html         Movie/TV detail page
├── watch.html          Video player page
├── search.html         Search page
├── browse.html         Browse by category
├── css/style.css       All styles (1300+ lines)
├── js/
│   ├── api.js          TMDB API wrapper
│   ├── app.js          Navbar, footer, cards, carousels
│   ├── home.js         Homepage logic
│   ├── detail.js       Detail page logic
│   ├── watch.js        Player page logic
│   ├── search.js       Search logic
│   └── browse.js       Browse/category logic
├── vercel.json         Vercel deployment config
└── server.js           Node.js static server (optional)
```

## License

MIT
