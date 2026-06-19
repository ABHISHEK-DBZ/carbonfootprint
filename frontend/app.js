'use strict';

/**
 * Carbon Ledger — Frontend Application
 * Handles form submission, API calls, result rendering, and tracking.
 */

const API_BASE = location.protocol === 'file:' ? 'http://localhost:4000/api' : '/api';

const form = document.getElementById('footprint-form');
const formStatus = document.getElementById('form-status');
const resultsSection = document.getElementById('results');
const assistantSection = document.getElementById('assistant');
const trackingSection = document.getElementById('tracking');

const renewableInput = document.getElementById('renewablePercent');
const renewableOutput = document.getElementById('renewablePercentOutput');
renewableInput.addEventListener('input', () => {
  renewableOutput.textContent = `${renewableInput.value}%`;
});

let lastInsights = null;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formStatus.textContent = '';

  const payload = collectPayload(form);

  setBusy(true);
  try {
    const insights = await postJSON('/insights', payload);
    lastInsights = insights;
    renderResults(insights);
    renderAssistant(insights);
    resultsSection.hidden = false;
    assistantSection.hidden = false;
    trackingSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    formStatus.textContent = err.message || 'Something went wrong. Please check your numbers and try again.';
  } finally {
    setBusy(false);
  }
});

function setBusy(isBusy) {
  const button = form.querySelector('button[type="submit"]');
  const textEl = button.querySelector('.btn-calc__text');
  const loadingEl = button.querySelector('.btn-calc__loading');
  button.disabled = isBusy;
  textEl.hidden = isBusy;
  loadingEl.hidden = !isBusy;
}

function collectPayload(formEl) {
  const fd = new FormData(formEl);
  const num = (key) => Number(fd.get(key) || 0);
  const str = (key) => String(fd.get(key) || '');

  return {
    transport: {
      carKmPerWeek: num('carKmPerWeek'),
      carFuel: str('carFuel'),
      twoWheelerKmPerWeek: num('twoWheelerKmPerWeek'),
      publicTransitKmPerWeek: num('publicTransitKmPerWeek'),
      publicTransitMode: str('publicTransitMode'),
      flightsShortHaulPerYear: num('flightsShortHaulPerYear'),
      flightsLongHaulPerYear: num('flightsLongHaulPerYear')
    },
    electricity: {
      monthlyKwh: num('monthlyKwh'),
      renewablePercent: num('renewablePercent')
    },
    diet: { dietType: str('dietType') },
    waste: {
      wasteKgPerWeek: num('wasteKgPerWeek'),
      recyclingPercent: num('recyclingPercent'),
      compostingPercent: num('compostingPercent')
    }
  };
}

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data.details) ? ` (${data.details.join(' ')})` : '';
    throw new Error(`${data.error || 'Request failed'}${detail}`);
  }
  return data;
}

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ----------------------------- Results / ledger tape ----------------------------- */

function renderResults(insights) {
  const { totals, benchmarkMessage } = insights;
  const { totalTonnesPerYear, breakdown, benchmarks } = totals;

  document.getElementById('total-readout').textContent = totalTonnesPerYear.toFixed(2);
  document.getElementById('benchmark-message').textContent = benchmarkMessage;

  const scaleMax = Math.max(totalTonnesPerYear * 1.15, benchmarks.global_avg_annual_tonnes * 1.15, 1);
  placeOnTape('ledger-you', totalTonnesPerYear, scaleMax);
  placeOnTape('marker-target', benchmarks.paris_aligned_target_annual_tonnes, scaleMax);
  placeOnTape('marker-india', benchmarks.india_avg_annual_tonnes, scaleMax);
  placeOnTape('marker-global', benchmarks.global_avg_annual_tonnes, scaleMax);
  document.getElementById('ledger-fill').style.width = `${pct(totalTonnesPerYear, scaleMax)}%`;

  renderBreakdown(breakdown, totals.totalKgPerYear);
}

function placeOnTape(elementId, value, scaleMax) {
  document.getElementById(elementId).style.left = `${pct(value, scaleMax)}%`;
}

function pct(value, max) {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

const CATEGORY_META = {
  transport: { label: 'Transport', icon: '🚗' },
  electricity: { label: 'Electricity', icon: '⚡' },
  diet: { label: 'Diet', icon: '🍽' },
  waste: { label: 'Waste', icon: '🗑' }
};

function renderBreakdown(breakdown, totalKg) {
  const list = document.getElementById('breakdown-list');
  list.innerHTML = '';

  const fragment = document.createDocumentFragment();

  Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, kg]) => {
      const meta = CATEGORY_META[key] || { label: key, icon: '•' };
      const share = totalKg > 0 ? Math.round((kg / totalKg) * 100) : 0;

      const li = document.createElement('li');
      li.innerHTML = `
        <div class="breakdown__label">
          <span>${escapeHtml(meta.icon)} ${escapeHtml(meta.label)}</span>
          <span class="breakdown__value">${(kg / 1000).toFixed(2)} t · ${share}%</span>
        </div>
        <div class="breakdown__bar-track">
          <div class="breakdown__bar-fill" style="width:${share}%"></div>
        </div>
      `;
      fragment.appendChild(li);
    });

  list.appendChild(fragment);
}

/* ----------------------------- Assistant ----------------------------- */

function renderAssistant(insights) {
  const thread = document.getElementById('assistant-thread');
  const actions = document.getElementById('assistant-actions');
  thread.innerHTML = '';
  actions.innerHTML = '';

  addBubble(thread, insights.assistantMessage);
  addBubble(thread, insights.nextQuestion, true);

  if (insights.recommendations.length === 0) {
    addBubble(thread, 'No high-impact changes left to suggest right now — nice work.');
    return;
  }

  const fragment = document.createDocumentFragment();

  insights.recommendations.forEach((rec) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.difficulty = rec.difficulty;
    chip.textContent = `${escapeHtml(rec.title)} (saves ~${formatKg(rec.estimatedImpactKgPerYear)}/yr, ${rec.difficulty})`;
    chip.addEventListener('click', () => {
      addBubble(thread, `Noted — "${escapeHtml(rec.title)}" could save roughly ${formatKg(rec.estimatedImpactKgPerYear)} per year. Try it for a few weeks, then recalculate to see your new number.`);
      chip.disabled = true;
      chip.style.opacity = '0.6';
    });
    fragment.appendChild(chip);
  });

  actions.appendChild(fragment);
}

function addBubble(container, text, isQuestion = false) {
  const div = document.createElement('div');
  div.className = `assistant-bubble${isQuestion ? ' assistant-bubble--question' : ''}`;
  div.textContent = text;
  container.appendChild(div);
}

function formatKg(kg) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} t` : `${Math.round(kg)} kg`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ----------------------------- Tracking ----------------------------- */

const ANON_ID_KEY = 'carbonLedger.anonymousId';

function getOrCreateAnonymousId() {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

document.getElementById('track-btn').addEventListener('click', async () => {
  const status = document.getElementById('track-status');
  if (!lastInsights) {
    status.textContent = 'Calculate your footprint first.';
    return;
  }
  try {
    const anonymousId = getOrCreateAnonymousId();
    await postJSON('/track', { anonymousId, totals: lastInsights.totals });
    status.textContent = 'Saved.';
    await renderHistory(anonymousId);
  } catch (err) {
    status.textContent = err.message || 'Could not save this snapshot.';
  }
});

async function renderHistory(anonymousId) {
  const list = document.getElementById('history-list');
  try {
    const { entries } = await getJSON(`/track?id=${anonymousId}`);
    list.innerHTML = '';
    const fragment = document.createDocumentFragment();
    entries
      .slice()
      .reverse()
      .forEach((entry) => {
        const li = document.createElement('li');
        const ts = entry.timestamp || entry.recordedAt;
        const date = ts ? new Date(ts).toLocaleDateString() : 'N/A';
        li.innerHTML = `<span>${escapeHtml(date)}</span><span>${entry.totalTonnesPerYear.toFixed(2)} t CO₂e/yr</span>`;
        fragment.appendChild(li);
      });
    list.appendChild(fragment);
  } catch {
    // Non-fatal: history is a bonus feature, calculator still works without it.
  }
}

// If a snapshot already exists for this browser, show history once tracking section appears.
const existingId = localStorage.getItem(ANON_ID_KEY);
if (existingId) renderHistory(existingId);
