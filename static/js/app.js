/**
 * AI ScamShield – Frontend JavaScript
 * IBM Build on IBM (BOB) Hackathon 2025
 * Handles: Scam Analysis, Chat Assistant, Threat Dashboard, Awareness Tips
 */

/* ── State ──────────────────────────────────────────────────────────────────── */
const AppState = {
  scanType:        'all',
  sessionId:       null,
  lastAnalysis:    null,
  charts:          {},
  dashboardLoaded: false,
};

/* ── DOM Ready ──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScanTypeButtons();
  loadExamples();
  loadDashboard();
  loadTips();
  animateHeroCounters();
  setupCharCounter();
});


/* ══════════════════════════════════════════════════════════════════════════════
   UTILITY HELPERS
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'error'|'success'|'info'} type
 */
function showToast(message, type = 'info') {
  const existing = document.querySelector('.cyber-toast');
  if (existing) existing.remove();

  const icons = { error: 'bi-x-circle-fill text-danger', success: 'bi-check-circle-fill text-success', info: 'bi-info-circle-fill text-info' };
  const toast = document.createElement('div');
  toast.className = `cyber-toast ${type}`;
  toast.innerHTML = `
    <i class="bi ${icons[type]} toast-icon"></i>
    <div class="toast-msg">${escapeHtml(message)}</div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 350); }, 4000);
}

/** Escape HTML to prevent XSS */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Format numbers with commas */
function formatNum(n) {
  return Number(n).toLocaleString('en-IN');
}

/** Animate a number from 0 to target */
function animateNumber(el, target, suffix = '', duration = 1200) {
  const start   = Date.now();
  const from    = 0;
  const to      = parseFloat(target);
  const step = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const val = from + (to - from) * eased;
    el.textContent = (Number.isInteger(to) ? Math.round(val).toLocaleString('en-IN') : val.toFixed(1)) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}


/* ══════════════════════════════════════════════════════════════════════════════
   HERO COUNTERS
══════════════════════════════════════════════════════════════════════════════ */
function animateHeroCounters() {
  // Start with illustrative values; will be overwritten by dashboard data
  animateNumber(document.getElementById('heroStatScans'), 1547, '', 1500);
  animateNumber(document.getElementById('heroStatScams'), 832,  '', 1500);
  animateNumber(document.getElementById('heroStatRate'),  92.4, '%', 1500);
}


/* ══════════════════════════════════════════════════════════════════════════════
   CHARACTER COUNTER
══════════════════════════════════════════════════════════════════════════════ */
function setupCharCounter() {
  const ta  = document.getElementById('messageInput');
  const cnt = document.getElementById('charCount');
  if (!ta || !cnt) return;
  ta.addEventListener('input', () => {
    cnt.textContent = ta.value.length;
    cnt.style.color = ta.value.length > 4500 ? 'var(--accent-red)' : '';
  });
}


/* ══════════════════════════════════════════════════════════════════════════════
   SCAN TYPE SELECTOR
══════════════════════════════════════════════════════════════════════════════ */
function initScanTypeButtons() {
  document.querySelectorAll('.scan-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scan-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.scanType = btn.dataset.type;
    });
  });
}


/* ══════════════════════════════════════════════════════════════════════════════
   EXAMPLE MESSAGES
══════════════════════════════════════════════════════════════════════════════ */
async function loadExamples() {
  const container = document.getElementById('exampleBtns');
  if (!container) return;

  try {
    const res  = await fetch('/api/examples');
    const data = await res.json();

    container.innerHTML = '';
    (data.examples || []).forEach(ex => {
      const btn = document.createElement('button');
      btn.className = 'example-btn';
      btn.textContent = ex.label;
      btn.title = ex.text.substring(0, 80) + '…';
      btn.addEventListener('click', () => {
        document.getElementById('messageInput').value = ex.text;
        document.getElementById('charCount').textContent = ex.text.length;
        document.getElementById('messageInput').focus();
        // Activate matching scan type
        const typeBtn = document.querySelector(`.scan-type-btn[data-type="${ex.type}"]`);
        if (typeBtn) typeBtn.click();
      });
      container.appendChild(btn);
    });
  } catch {
    container.innerHTML = '<small class="text-muted">Could not load examples.</small>';
  }
}


/* ══════════════════════════════════════════════════════════════════════════════
   CLEAR INPUT
══════════════════════════════════════════════════════════════════════════════ */
function clearInput() {
  document.getElementById('messageInput').value = '';
  document.getElementById('charCount').textContent = '0';
  showResultState('idle');
  AppState.lastAnalysis = null;
}


/* ══════════════════════════════════════════════════════════════════════════════
   RESULT STATE MANAGEMENT
══════════════════════════════════════════════════════════════════════════════ */
function showResultState(state) {
  const idle    = document.getElementById('resultIdle');
  const loading = document.getElementById('resultLoading');
  const result  = document.getElementById('resultCard');

  idle.classList.add('d-none');
  loading.classList.add('d-none');
  result.classList.add('d-none');

  if (state === 'idle')    idle.classList.remove('d-none');
  if (state === 'loading') loading.classList.remove('d-none');
  if (state === 'result')  result.classList.remove('d-none');
}

/** Animate agent progress steps */
function animateAgentSteps() {
  const steps = ['step1','step2','step3','step4'];
  let i = 0;
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active','done'); }
  });

  const interval = setInterval(() => {
    if (i > 0) {
      const prev = document.getElementById(steps[i - 1]);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
    }
    if (i < steps.length) {
      const curr = document.getElementById(steps[i]);
      if (curr) curr.classList.add('active');
      i++;
    } else {
      clearInterval(interval);
    }
  }, 900);

  return interval;
}


/* ══════════════════════════════════════════════════════════════════════════════
   SCAM ANALYSIS – MAIN FUNCTION
══════════════════════════════════════════════════════════════════════════════ */
async function analyzeMessage() {
  const message = document.getElementById('messageInput').value.trim();
  if (!message) {
    showToast('Please enter a suspicious message to analyse.', 'error');
    return;
  }

  const analyzeBtn = document.getElementById('analyzeBtn');
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analysing…';

  showResultState('loading');
  const stepInterval = animateAgentSteps();

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, type: AppState.scanType }),
    });

    clearInterval(stepInterval);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    AppState.lastAnalysis = data;
    renderResults(data);
    showResultState('result');

    // Smooth scroll to results on mobile
    if (window.innerWidth < 992) {
      document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (err) {
    clearInterval(stepInterval);
    showResultState('idle');
    showToast(`Analysis failed: ${err.message}`, 'error');
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<i class="bi bi-radar me-2"></i>Run Threat Analysis';
  }
}


/* ══════════════════════════════════════════════════════════════════════════════
   RENDER ANALYSIS RESULTS
══════════════════════════════════════════════════════════════════════════════ */
function renderResults(data) {
  const verdict    = (data.verdict    || 'UNKNOWN').toUpperCase();
  const scamType   = data.scam_type   || 'Unknown';
  const riskLevel  = data.risk_level  || 'UNKNOWN';
  const confidence = parseFloat(data.confidence || 0);

  // ── Verdict Banner ──────────────────────────────────────────────────────
  const banner    = document.getElementById('verdictBanner');
  const iconWrap  = document.getElementById('verdictIcon');
  const vtText    = document.getElementById('verdictText');
  const stText    = document.getElementById('scamTypeText');
  const riskBadge = document.getElementById('riskBadge');
  const confBar   = document.getElementById('confidenceBar');
  const confVal   = document.getElementById('confidenceVal');

  // Verdict-specific styling
  const verdictConfig = {
    SCAM:       { cls: 'scam',       icon: 'bi-x-shield-fill',     color: '#e74c3c', label: '🚨 SCAM DETECTED' },
    SUSPICIOUS: { cls: 'suspicious', icon: 'bi-exclamation-diamond-fill', color: '#e67e22', label: '⚠️ SUSPICIOUS' },
    GENUINE:    { cls: 'genuine',    icon: 'bi-shield-fill-check',  color: '#2ecc71', label: '✅ APPEARS GENUINE' },
    UNKNOWN:    { cls: 'suspicious', icon: 'bi-question-diamond',   color: '#94a3b8', label: '❓ UNKNOWN' },
  };

  const cfg = verdictConfig[verdict] || verdictConfig.UNKNOWN;

  banner.className    = `verdict-banner mb-3 p-4 rounded-3 ${cfg.cls}`;
  iconWrap.className  = `verdict-icon-wrap ${cfg.cls}`;
  iconWrap.innerHTML  = `<i class="bi ${cfg.icon}" style="color:${cfg.color}"></i>`;
  vtText.textContent  = cfg.label;
  vtText.style.color  = cfg.color;
  stText.textContent  = `Type: ${scamType}`;

  // Risk badge
  riskBadge.className = `risk-badge risk-${riskLevel}`;
  riskBadge.textContent = riskLevel;

  // Confidence bar colour
  const confColor = confidence >= 80 ? '#e74c3c' : confidence >= 50 ? '#e67e22' : '#2ecc71';
  confBar.style.width      = '0%';
  confBar.style.background = confColor;
  confVal.textContent      = confidence.toFixed(1) + '%';
  setTimeout(() => { confBar.style.width = confidence + '%'; }, 100);

  // ── Tab: Explanation ───────────────────────────────────────────────────
  const explanationEl = document.getElementById('explanationText');
  explanationEl.textContent = data.explanation || 'No explanation available.';

  const knowledgeEl = document.getElementById('knowledgeText');
  knowledgeEl.textContent = (data.knowledge || 'No knowledge context available.').substring(0, 500) + '…';

  // ── Tab: Threat Indicators ─────────────────────────────────────────────
  const reasonsList = document.getElementById('reasonsList');
  reasonsList.innerHTML = '';
  const reasons = data.reasons || [];
  if (reasons.length === 0) {
    reasonsList.innerHTML = '<p class="text-muted">No specific threat indicators detected.</p>';
  } else {
    reasons.forEach(reason => {
      const item = document.createElement('div');
      item.className = 'reason-item';
      item.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill reason-icon"></i>
        <span>${escapeHtml(reason)}</span>
      `;
      reasonsList.appendChild(item);
    });
  }

  // ── Tab: Safety Tips ───────────────────────────────────────────────────
  const safetyList = document.getElementById('safetyTipsList');
  safetyList.innerHTML = '';
  (data.safety_tips || []).forEach(tip => {
    const item = document.createElement('div');
    item.className = 'tip-item';
    item.innerHTML = `
      <i class="bi bi-check-circle-fill tip-icon"></i>
      <span>${escapeHtml(tip)}</span>
    `;
    safetyList.appendChild(item);
  });

  const reportList = document.getElementById('reportToList');
  reportList.innerHTML = '';
  (data.report_to || []).forEach(authority => {
    const item = document.createElement('div');
    item.className = 'report-item';
    item.innerHTML = `
      <i class="bi bi-megaphone-fill text-info"></i>
      <span>${escapeHtml(authority)}</span>
    `;
    reportList.appendChild(item);
  });

  const guidanceEl = document.getElementById('cyberGuidanceText');
  if (data.cyber_guidance) {
    guidanceEl.textContent = data.cyber_guidance;
    document.getElementById('cyberGuidanceBox').style.display = 'block';
  } else {
    document.getElementById('cyberGuidanceBox').style.display = 'none';
  }

  // Reset report tab
  document.getElementById('reportContent').innerHTML = `
    <p class="text-muted text-center py-4">
      <i class="bi bi-file-earmark-plus display-5 d-block mb-2 text-muted opacity-50"></i>
      Click "Generate with AI" to create a formal<br/>Threat Intelligence Report using IBM Granite.
    </p>
  `;
}


/* ══════════════════════════════════════════════════════════════════════════════
   SECURITY REPORT GENERATION
══════════════════════════════════════════════════════════════════════════════ */
async function generateReport() {
  if (!AppState.lastAnalysis) {
    showToast('Please run a threat analysis first.', 'error');
    return;
  }

  const container = document.getElementById('reportContent');
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="text-muted">IBM Granite is generating the Threat Intelligence Report…</p>
    </div>
  `;

  try {
    const res = await fetch('/api/security-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis_result: AppState.lastAnalysis }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    container.innerHTML = `
      <div class="report-text">${escapeHtml(data.report || 'No report generated.')}</div>
      <div class="mt-3 d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" onclick="copyReport()">
          <i class="bi bi-clipboard me-1"></i>Copy Report
        </button>
        <small class="text-muted align-self-center ms-2">
          <i class="bi bi-cpu me-1"></i>Generated by IBM Granite via watsonx.ai
        </small>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Report generation failed: ${escapeHtml(err.message)}</div>`;
  }
}

function copyReport() {
  const reportEl = document.querySelector('.report-text');
  if (!reportEl) return;
  navigator.clipboard.writeText(reportEl.textContent).then(() => {
    showToast('Report copied to clipboard.', 'success');
  }).catch(() => {
    showToast('Could not copy report.', 'error');
  });
}


/* ══════════════════════════════════════════════════════════════════════════════
   CHAT ASSISTANT
══════════════════════════════════════════════════════════════════════════════ */
async function sendChat() {
  const input    = document.getElementById('chatInput');
  const sendBtn  = document.getElementById('chatSendBtn');
  const message  = input.value.trim();
  if (!message) return;

  // Append user bubble
  appendChatBubble(message, 'user');
  input.value = '';
  input.disabled  = true;
  sendBtn.disabled = true;

  // Hide quick prompts after first message
  const qp = document.getElementById('quickPrompts');
  if (qp) qp.style.display = 'none';

  // Show typing indicator
  const typingId = appendTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: AppState.sessionId,
      }),
    });

    removeTypingIndicator(typingId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    AppState.sessionId = data.session_id;
    appendChatBubble(data.reply, 'bot');

  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatBubble(`⚠️ Error: ${err.message}. Please try again.`, 'bot');
  } finally {
    input.disabled   = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

function sendQuickPrompt(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

function appendChatBubble(text, role) {
  const container = document.getElementById('chatMessages');
  const bubble    = document.createElement('div');
  bubble.className = `chat-bubble ${role === 'bot' ? 'bot-bubble' : 'user-bubble'}`;

  const avatarHtml = role === 'bot'
    ? '<div class="bubble-avatar"><i class="bi bi-robot"></i></div>'
    : '<div class="bubble-avatar" style="background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.2);color:#3b82f6"><i class="bi bi-person-fill"></i></div>';

  // Convert newlines to <br>, escape content
  const formatted = escapeHtml(text).replace(/\n/g, '<br/>');

  bubble.innerHTML = `
    ${avatarHtml}
    <div class="bubble-content"><p class="mb-0">${formatted}</p></div>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const id = 'typing_' + Date.now();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'chat-bubble bot-bubble';
  el.innerHTML = `
    <div class="bubble-avatar"><i class="bi bi-robot"></i></div>
    <div class="bubble-content">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function clearChat() {
  const container = document.getElementById('chatMessages');
  AppState.sessionId = null;
  // Keep only the welcome message
  const bubbles = container.querySelectorAll('.chat-bubble');
  bubbles.forEach((b, i) => { if (i > 0) b.remove(); });
  document.getElementById('quickPrompts').style.display = 'block';
}


/* ══════════════════════════════════════════════════════════════════════════════
   THREAT DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const res  = await fetch('/api/threat-dashboard');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderKPIs(data.threat_summary);
    renderScamTypeChart(data.scam_type_distribution);
    renderWeeklyTrendChart(data.weekly_trend);
    renderRiskChart(data.risk_level_breakdown);
    renderThreatTable(data.top_threats);

    // Update hero counters with live data
    if (data.threat_summary) {
      animateNumber(document.getElementById('heroStatScans'), data.threat_summary.total_scans_today, '');
      animateNumber(document.getElementById('heroStatScams'), data.threat_summary.scams_detected_today, '');
      animateNumber(document.getElementById('heroStatRate'),  data.threat_summary.scam_detection_rate, '%');
    }

    AppState.dashboardLoaded = true;

  } catch (err) {
    console.warn('Dashboard load failed:', err.message);
    showToast('Dashboard data unavailable.', 'error');
  }
}

function renderKPIs(summary) {
  if (!summary) return;
  const kpis = {
    kpiScans:     summary.total_scans_today,
    kpiDetected:  summary.scams_detected_today,
    kpiPhishing:  summary.phishing_blocked,
    kpiUpi:       summary.upi_scams_flagged,
    kpiUrls:      summary.malicious_urls_found,
    kpiRate:      summary.scam_detection_rate + '%',
  };
  Object.entries(kpis).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof val === 'number') {
      animateNumber(el, val, '');
    } else {
      el.textContent = val;
    }
  });
}

function renderScamTypeChart(distribution) {
  const ctx = document.getElementById('scamTypeChart');
  if (!ctx || !distribution) return;

  if (AppState.charts.scamType) AppState.charts.scamType.destroy();

  AppState.charts.scamType = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: distribution.map(d => d.type),
      datasets: [{
        data:            distribution.map(d => d.count),
        backgroundColor: distribution.map(d => d.color + 'cc'),
        borderColor:     distribution.map(d => d.color),
        borderWidth: 1,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:     '#94a3b8',
            font:      { size: 11 },
            boxWidth:  12,
            padding:   10,
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${formatNum(ctx.parsed)} detections`
          }
        }
      },
      cutout: '55%',
    }
  });
}

function renderWeeklyTrendChart(trend) {
  const ctx = document.getElementById('weeklyTrendChart');
  if (!ctx || !trend) return;

  if (AppState.charts.weekly) AppState.charts.weekly.destroy();

  AppState.charts.weekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels:   trend.map(d => d.day),
      datasets: [{
        label:           'Scams Detected',
        data:            trend.map(d => d.scams),
        backgroundColor: 'rgba(231, 76, 60, 0.4)',
        borderColor:     'rgba(231, 76, 60, 0.9)',
        borderWidth:     1,
        borderRadius:    4,
        borderSkipped:   false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` ${formatNum(ctx.parsed.y)} scams` } }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      }
    }
  });
}

function renderRiskChart(breakdown) {
  const ctx = document.getElementById('riskChart');
  if (!ctx || !breakdown) return;

  if (AppState.charts.risk) AppState.charts.risk.destroy();

  const RISK_COLORS = {
    HIGH:   '#e74c3c',
    MEDIUM: '#e67e22',
    LOW:    '#f39c12',
    SAFE:   '#2ecc71',
  };

  AppState.charts.risk = new Chart(ctx, {
    type: 'pie',
    data: {
      labels:   Object.keys(breakdown),
      datasets: [{
        data:            Object.values(breakdown),
        backgroundColor: Object.keys(breakdown).map(k => (RISK_COLORS[k] || '#888') + 'bb'),
        borderColor:     Object.keys(breakdown).map(k => RISK_COLORS[k] || '#888'),
        borderWidth: 1,
        hoverOffset: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 10 }
        },
      }
    }
  });
}

function renderThreatTable(threats) {
  const tbody = document.getElementById('threatTableBody');
  if (!tbody || !threats) return;

  tbody.innerHTML = '';
  threats.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${t.rank}</td>
      <td>${escapeHtml(t.threat)}</td>
      <td><span class="severity-badge severity-${t.severity}">${t.severity}</span></td>
      <td>${formatNum(t.reports)}</td>
    `;
    tbody.appendChild(row);
  });
}


/* ══════════════════════════════════════════════════════════════════════════════
   AWARENESS TIPS
══════════════════════════════════════════════════════════════════════════════ */
async function loadTips() {
  const grid = document.getElementById('tipsGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-12 text-center text-muted py-4">
      <div class="spinner-border text-warning" role="status"></div>
      <p class="mt-2">Loading awareness tips…</p>
    </div>
  `;

  try {
    const res  = await fetch('/api/awareness-tips?count=6');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    grid.innerHTML = '';
    (data.tips || []).forEach(tip => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-xl-4';
      col.innerHTML = `
        <div class="tip-card">
          <div class="tip-card-icon">
            <i class="bi bi-${escapeHtml(tip.icon)}"></i>
          </div>
          <div class="tip-card-category">${escapeHtml(tip.category)}</div>
          <div class="tip-card-title">${escapeHtml(tip.title)}</div>
          <p class="tip-card-text">${escapeHtml(tip.tip)}</p>
        </div>
      `;
      grid.appendChild(col);
    });

  } catch (err) {
    grid.innerHTML = `<div class="col-12"><div class="alert alert-warning">Could not load tips: ${escapeHtml(err.message)}</div></div>`;
  }
}


/* ══════════════════════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  // Ctrl+Enter / Cmd+Enter in textarea → run analysis
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const focused = document.activeElement;
    if (focused && focused.id === 'messageInput') {
      e.preventDefault();
      analyzeMessage();
    }
  }
});