// =============================================
//  GARDEN HORIZONS 2 — Garden UI (Dynamic Plots)
// =============================================

import { SEEDS } from '../logic/Seeds.js';
import { MUTATIONS } from '../logic/Mutations.js';
import { isPlotReady, getGrowthPercent, getPlotEmoji, updatePlotGrowth } from '../entities/Garden.js';
import { getNextPlotCost, MAX_PLOTS } from '../logic/GameState.js';

/**
 * Построить/синхронизировать DOM грядок под текущий plotCount.
 * Вызывать при изменении числа грядок.
 * @param {number} plotCount
 * @param {function} onPlotClick
 */
export function buildGardenGrid(plotCount, onPlotClick) {
  const grid = document.getElementById('garden-grid');
  if (!grid) return;

  // Сколько столбцов: 2 до 4 грядок, 3 до 9
  const cols = plotCount <= 4 ? 2 : 3;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  // Размер грядок — меньше при 3 столбцах
  const plotSize = cols === 3 ? 90 : 110;
  grid.style.setProperty('--plot-w', `${plotSize}px`);
  grid.style.setProperty('--plot-h', `${cols === 3 ? 75 : 90}px`);

  // Количество DOM-элементов грядок
  const existing = grid.querySelectorAll('.plot');
  const toAdd    = plotCount - existing.length;

  for (let i = 0; i < toAdd; i++) {
    const idx  = existing.length + i;
    const div  = document.createElement('div');
    div.className      = 'plot';
    div.dataset.plot   = idx;
    div.innerHTML = `
      <div class="plot-soil"></div>
      <div class="plot-plant"></div>
      <div class="plot-label"></div>
    `;
    grid.appendChild(div);
  }

  // Привязать клики
  grid.querySelectorAll('.plot').forEach((el, idx) => {
    el.onclick = () => onPlotClick(idx);
  });
}

/**
 * Отрисовать все грядки.
 */
export function renderGarden(garden, activeEvent, onPlotClick) {
  const plotEls = document.querySelectorAll('.plot');

  plotEls.forEach((plotEl, idx) => {
    if (idx >= garden.length) return;
    const updatedPlot = updatePlotGrowth(garden[idx]);
    renderPlot(plotEl, updatedPlot, activeEvent);
    plotEl.onclick = () => onPlotClick(idx);
  });
}

/**
 * Отрисовать одну грядку.
 */
export function renderPlot(plotEl, plot, activeEvent) {
  const plantEl = plotEl.querySelector('.plot-plant');
  const labelEl = plotEl.querySelector('.plot-label');

  plotEl.classList.remove(
    'has-plant', 'ready', 'working-plot',
    'stage-0', 'stage-1', 'stage-2', 'stage-3',
    'mutation-solar', 'mutation-crystal', 'mutation-giant', 'mutation-void'
  );

  const oldBadge    = plotEl.querySelector('.mutation-badge');
  const oldProgress = plotEl.querySelector('.grow-progress');
  if (oldBadge)    oldBadge.remove();
  if (oldProgress) oldProgress.remove();

  if (!plot || !plot.seedId) {
    if (plantEl) plantEl.textContent = '';
    if (labelEl) labelEl.textContent = '';
    return;
  }

  const seed  = SEEDS[plot.seedId];
  if (!seed) return;

  const ready = isPlotReady(plot);
  const stage = plot.stage ?? 0;

  plotEl.classList.add('has-plant', `stage-${stage}`);
  if (ready)          plotEl.classList.add('ready');
  if (plot.harvesting) plotEl.classList.add('working-plot');

  if (plot.mutation) {
    plotEl.classList.add(`mutation-${plot.mutation}`);
    const badge     = document.createElement('div');
    badge.className = 'mutation-badge';
    const mut       = MUTATIONS[plot.mutation];
    badge.textContent = mut ? mut.badge : '';
    plotEl.appendChild(badge);
  }

  if (plantEl) plantEl.textContent = getPlotEmoji(plot);

  if (labelEl) {
    if (ready) {
      labelEl.textContent = '✨ Готово!';
    } else {
      const pct = getGrowthPercent(plot);
      labelEl.textContent = `${seed.emoji} ${Math.floor(pct)}%`;
    }
  }

  if (!ready) {
    const progress     = document.createElement('div');
    progress.className = 'grow-progress';
    const bar          = document.createElement('div');
    bar.className      = 'grow-progress-bar';
    bar.style.width    = `${getGrowthPercent(plot)}%`;
    progress.appendChild(bar);
    plotEl.appendChild(progress);
  }
}

/**
 * Обновить кнопку «Купить грядку».
 */
export function updateBuyPlotButton(plotCount, playerMoney, onBuyPlot) {
  const btn     = document.getElementById('buy-plot-btn');
  const infoEl  = document.getElementById('buy-plot-info');
  if (!btn) return;

  const nextCount = plotCount + 1;
  if (nextCount > MAX_PLOTS) {
    btn.disabled       = true;
    btn.textContent    = '🌿 Максимум грядок';
    if (infoEl) infoEl.textContent = `${plotCount}/${MAX_PLOTS} грядок`;
    return;
  }

  const cost = getNextPlotCost(plotCount);
  const canAfford = playerMoney >= cost;

  btn.disabled    = !canAfford;
  btn.textContent = `➕ Купить грядку (🪙${cost})`;
  btn.style.opacity = canAfford ? '1' : '0.5';
  if (infoEl) infoEl.textContent = `${plotCount}/${MAX_PLOTS} грядок`;

  btn.onclick = () => onBuyPlot();
}

/**
 * Показать частицы урожая.
 */
export function showHarvestParticles(plotEl, emoji) {
  const particles     = document.createElement('div');
  particles.className = 'harvest-particles';

  for (let i = 0; i < 6; i++) {
    const p     = document.createElement('div');
    p.className = 'particle';
    p.textContent = emoji;
    const tx = (Math.random() - 0.5) * 100;
    const ty = -(20 + Math.random() * 60);
    p.style.cssText = `
      left: ${20 + Math.random() * 60}%;
      top: ${20 + Math.random() * 40}%;
      --tx: ${tx}px;
      --ty: ${ty}px;
      animation-delay: ${Math.random() * 200}ms;
    `;
    particles.appendChild(p);
  }

  plotEl.appendChild(particles);
  setTimeout(() => particles.remove(), 1200);
}

/**
 * Обновить визуал мира (небо, оверлей, бейдж события).
 */
export function updateWorldVisuals(activeEvent) {
  const sky     = document.getElementById('sky');
  const overlay = document.getElementById('event-overlay');
  const badge   = document.getElementById('event-badge');

  sky?.classList.remove('solar-dawn');
  overlay?.classList.remove('solar-dawn', 'morning-dew');
  overlay?.classList.add('hidden');
  badge?.classList.add('hidden');
  if (badge) badge.textContent = '';

  if (!activeEvent) return;

  if (activeEvent.id === 'solarDawn') {
    sky?.classList.add('solar-dawn');
    overlay?.classList.remove('hidden');
    overlay?.classList.add('solar-dawn');
    badge?.classList.remove('hidden');
    if (badge) badge.textContent = activeEvent.badgeText;
  } else if (activeEvent.id === 'morningDew') {
    overlay?.classList.remove('hidden');
    overlay?.classList.add('morning-dew');
    badge?.classList.remove('hidden');
    if (badge) badge.textContent = activeEvent.badgeText;
  }
}
