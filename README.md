# Shipcheck — Pre-Deployment Security Audit & Sentinel C++ RASP

Official website and standalone distribution packages for **Shipcheck**.

🌐 **Live Website**: [https://ajayhemanth.online](https://ajayhemanth.online)

---

## 📦 Download Releases

| Platform | Package | Architecture | Size | Checksum (SHA-256) |
| :--- | :--- | :--- | :--- | :--- |
| **Windows** | [Shipcheck-v1.0.0-windows-x64.exe](./downloads/Shipcheck-v1.0.0-windows-x64.exe) | x64 | ~37 MB | `11991F5E721AC4ED6A70F3EDFC135CC7FDA80D79E490CA01879BFEDFB262726E` |
| **Linux (Debian/Ubuntu)** | [shipcheck_1.0.0_amd64.deb](./downloads/shipcheck_1.0.0_amd64.deb) | amd64 | ~1.5 KB | `D168F45F927410CD92F589B68EBE371957A7FC76192873A957DA4F678AD621AE` |

---

## ⚡ Quick Start

### Windows
1. Download `Shipcheck-v1.0.0-windows-x64.exe`.
2. Double-click the `.exe` to launch the engine and open the dashboard at `http://127.0.0.1:8000`.

### Linux (Debian / Ubuntu)
```bash
sudo dpkg -i shipcheck_1.0.0_amd64.deb
shipcheck
```

---

## 🛡️ Key Features
- **Native C++ Hyperion WAF**: Sub-millisecond SIMD pattern inspection for SQLi, XSS, and command injections.
- **AI-Powered Fix Synthesis**: Generates concrete, context-aware code diffs and patches powered by Gemini AI.
- **Zero-Code RASP Proxy**: Transparent reverse proxy intercepting and dropping malicious payloads in real time.
- **100% Local-First & Air-Gapped**: SQLite-backed, fully functional offline.

Developed for **Hacktoberfest 2026**.
