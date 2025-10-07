# 🎮 Mojang Status Checker

Real-time monitoring dashboard for all Mojang/Minecraft services.

## Features

- ✅ Monitors 13+ Mojang/Minecraft endpoints
- 🎨 Dark/Light theme toggle
- 📱 Fully responsive mobile design
- ⏱️ Auto-refresh mode
- 💾 Export results as JSON
- 🚀 No backend required - runs entirely in browser

## Services Monitored

- Core Services (Session Server, Minecraft API, Blocked Servers)
- Download Services (Version Manifest, Libraries, Launcher Content)
- Assets & Textures
- Legacy APIs
- Authentication (Xbox Live, XSTS)

## Installation

1. Clone the repository
2. Upload files to your web server
3. Open `index.html` in browser

```bash
git clone https://github.com/pkeffect/mojang-status-checks.git
```

## Files

- `index.html` - Main page
- `style.css` - Styling
- `app.js` - Status checking logic

## Usage

Simply open the page and click "Check Status" to monitor all Mojang services in real-time.

## Technologies

- Vanilla JavaScript (ES6+)
- CSS3 with CSS Variables
- Fetch API for service checks

## License

MIT
