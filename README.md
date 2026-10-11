# Northstar Security Lab - Decoupled Frontend

A standalone, modern HTML5/CSS/JavaScript web UI for the Northstar Vulnerable Security Lab.

## 🌟 Key Highlights

- **100% Decoupled**: Zero backend code or template rendering in the frontend.
- **Configurable via `config.json`**: Change the backend API endpoint anytime by modifying [`config.json`](./config.json).
- **GitHub Pages Ready**: Can be committed and hosted on GitHub Pages, Netlify, Vercel, or AWS S3 without build steps or node dependencies.
- **Live Connection Monitor**: Displays real-time API health status and latency in milliseconds.
- **Interactive Security Playground**: 1-click test payloads for SQL Injection, Cross-Site Scripting (XSS), Command Injection (RCE), and SSRF exfiltration.

---

## ⚙️ Configuration

Edit `config.json`:

```json
{
  "api_url": "http://localhost:8001"
}
```

When deployed to production or GitHub Pages, update `"api_url"` to your public backend URL or cloud tunnel.

---

## 🚀 Deploying to GitHub Pages

1. Create a repository on GitHub (or use your existing repository).
2. Push the files in `sample_vulnerable_app/frontend/` (including `index.html`, `styles.css`, `app.js`, and `config.json`).
3. In GitHub, go to **Settings** > **Pages**.
4. Set source to **Deploy from a branch** -> `main` / root.
5. Your frontend is live at `https://<username>.github.io/<repo-name>/`.
