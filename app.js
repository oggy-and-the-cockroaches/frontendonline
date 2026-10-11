/**
 * Northstar Vulnerable Security Lab - Frontend Controller
 * Fully decoupled from backend, communicates exclusively via dynamic api_url.
 */

const state = {
  apiUrl: 'http://localhost:8001',
  config: null,
  isOnline: false,
  latencyMs: null
};

// DOM Elements
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// 1. Initialize Configuration
async function initConfig() {
  const savedUrl = localStorage.getItem('vulnerable_lab_api_url');
  
  try {
    const res = await fetch('./config.json', { cache: 'no-store' });
    if (res.ok) {
      state.config = await res.json();
      if (!savedUrl && state.config.api_url) {
        state.apiUrl = state.config.api_url.replace(/\/$/, '');
      }
    }
  } catch (err) {
    console.warn('[!] Failed to load config.json, using default fallback:', err);
  }

  if (savedUrl) {
    state.apiUrl = savedUrl.replace(/\/$/, '');
  }

  // Update UI Input
  $('#apiUrlInput').value = state.apiUrl;
  
  // Test connection
  await checkApiHealth();

  // Periodic health check every 10 seconds
  setInterval(checkApiHealth, 10000);
}

// 2. Health & Connectivity Check
async function checkApiHealth() {
  const pill = $('#statusPill');
  const dot = $('#statusText');
  const latencySpan = $('#statusLatency');
  const currentUrl = state.apiUrl;

  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${currentUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data = await res.json();
      state.isOnline = true;
      state.latencyMs = latency;
      pill.className = 'status-pill online';
      dot.textContent = 'Connected';
      latencySpan.textContent = `(${latency}ms)`;
      return true;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    state.isOnline = false;
    pill.className = 'status-pill';
    dot.textContent = 'Offline';
    latencySpan.textContent = '';
    return false;
  }
}

// 3. API URL Management
function updateApiUrl(newUrl) {
  if (!newUrl) return;
  state.apiUrl = newUrl.trim().replace(/\/$/, '');
  $('#apiUrlInput').value = state.apiUrl;
  localStorage.setItem('vulnerable_lab_api_url', state.apiUrl);
  checkApiHealth();
}

function resetApiUrlToConfig() {
  localStorage.removeItem('vulnerable_lab_api_url');
  if (state.config && state.config.api_url) {
    state.apiUrl = state.config.api_url.replace(/\/$/, '');
  } else {
    state.apiUrl = 'http://localhost:8001';
  }
  $('#apiUrlInput').value = state.apiUrl;
  checkApiHealth();
}

// Helper: Make API Request
async function apiCall(endpoint, options = {}) {
  const fullUrl = `${state.apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const startTime = performance.now();

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        'Accept': 'application/json, text/html, */*',
        ...(options.headers || {})
      }
    });

    const latency = Math.round(performance.now() - startTime);
    const contentType = res.headers.get('content-type') || '';

    let body;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      data: body,
      latency,
      url: fullUrl
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: 'Network / CORS Error',
      error: err.message,
      url: fullUrl
    };
  }
}

// 4. Lab Exercise Handlers

// SQL Injection: Login Bypass
async function testSqliLogin() {
  const user = $('#sqliUser').value;
  const pass = $('#sqliPass').value;
  const out = $('#sqliLoginOut');
  
  out.textContent = 'Sending request...';
  const res = await apiCall(`/api/login?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`);
  out.textContent = `[HTTP ${res.status} | ${res.latency || 0}ms]\n` + JSON.stringify(res.data || res.error, null, 2);
}

// SQL Injection: Search
async function testSqliSearch() {
  const query = $('#sqliSearchQuery').value;
  const out = $('#sqliSearchOut');

  out.textContent = 'Searching documents...';
  const res = await apiCall(`/lab/sql-search?query=${encodeURIComponent(query)}`);
  out.textContent = `[HTTP ${res.status} | ${res.latency || 0}ms]\n` + JSON.stringify(res.data || res.error, null, 2);
}

// XSS: Live Preview
function testXss() {
  const comment = $('#xssInput').value;
  const frame = $('#xssFrame');
  const targetUrl = `${state.apiUrl}/lab/xss-preview?comment=${encodeURIComponent(comment)}`;
  frame.src = targetUrl;
}

// Command Injection: Diagnostics
async function testDiagnostics() {
  const target = $('#diagTarget').value;
  const out = $('#diagOut');

  out.textContent = 'Executing command diagnostic...';
  const res = await apiCall(`/api/diagnostics?target=${encodeURIComponent(target)}`);
  out.textContent = `[HTTP ${res.status} | ${res.latency || 0}ms]\n` + JSON.stringify(res.data || res.error, null, 2);
}

// SSRF & Case Testing
async function testCase(caseId) {
  const out = $('#caseOut');
  out.textContent = `Executing case ${caseId}...`;
  const res = await apiCall(`/cases/${caseId}`, { method: 'POST' });
  out.textContent = `[HTTP ${res.status} | ${res.latency || 0}ms]\n` + JSON.stringify(res.data || res.error, null, 2);
}

// Raw API Explorer
async function executeCustomRequest() {
  const method = $('#customMethod').value;
  const path = $('#customPath').value;
  const bodyText = $('#customBody').value;
  const out = $('#customOut');

  out.textContent = 'Sending request...';
  
  const options = { method };
  if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText.trim()) {
    try {
      options.body = bodyText;
      options.headers = { 'Content-Type': 'application/json' };
    } catch (e) {
      out.textContent = 'Invalid JSON body format.';
      return;
    }
  }

  const res = await apiCall(path, options);
  out.textContent = `[HTTP ${res.status} ${res.statusText} | ${res.latency || 0}ms]\n` + 
    `URL: ${res.url}\n\n` + 
    (typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : (res.data || res.error));
}

// 5. DOM Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initConfig();

  // Tab switching
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = $(`#${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // API URL Input blur / enter
  $('#apiUrlInput').addEventListener('change', (e) => updateApiUrl(e.target.value));
  $('#apiUrlInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') updateApiUrl(e.target.value);
  });

  // Quick Presets
  $$('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      updateApiUrl(btn.dataset.url);
    });
  });

  // Payload chips insertion
  $$('.payload-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const targetInput = $(`#${chip.dataset.target}`);
      if (targetInput) {
        targetInput.value = chip.dataset.payload || chip.textContent;
        // Trigger corresponding action
        if (chip.dataset.action === 'sqli-login') testSqliLogin();
        if (chip.dataset.action === 'sqli-search') testSqliSearch();
        if (chip.dataset.action === 'xss') testXss();
        if (chip.dataset.action === 'diag') testDiagnostics();
      }
    });
  });
});
