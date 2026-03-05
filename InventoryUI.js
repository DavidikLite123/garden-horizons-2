// =============================================
//  GARDEN HORIZONS 2 — Инвентарь UI (RU)
// =============================================

import { SEEDS, RARITIES } from '../logic/Seeds.js';
import { calcSellValue } from '../logic/GameState.js';

let selectMode = false;
let selectedIndices = new Set();

/**
 * Отрисовать список инвентаря.
 * @param {Array}       inventory   — [ { seedId, qty, type, mutation, isSolar } ]
 * @param {object|null} activeEvent
 * @param {object}      callbacks   — { onItemClick }
 */
export function renderInventory(inventory, activeEvent, callbacks) {
  const listEl        = document.getElementById('inventory-list');
  const selectModeBar = document.getElementById('select-mode-bar');
  const selectCountEl = document.getElementById('select-count');

  if (!listEl) return;

  if (!inventory || inventory.length === 0) {
    listEl.innerHTML = '<div class="empty-msg">Инвентарь пуст. Купите семена в магазине!</div>';
    return;
  }

  listEl.innerHTML = inventory.map((item, idx) => {
    const seed = SEEDS[item.seedId];
    if (!seed) return '';

    const sellVal  = calcSellValue(item, seed, activeEvent);
    const rarity   = seed.rarity;
    const mutEmoji = getMutationEmoji(item.mutation);
    const solarTag = item.isSolar && item.mutation !== 'solar' ? '☀️' : '';
    const typeTag  = item.type === 'crop' ? '🌾' : '🌱';
    const isSelected = selectedIndices.has(idx);

    const rarityLabel = RARITIES[rarity]?.label ?? rarity;

    return `
      <div class="inv-item rarity-${rarity} ${isSelected ? 'selected' : ''}" data-idx="${idx}">
        <div class="inv-item-icon">${mutEmoji}${seed.emoji}${solarTag}</div>
        <div class="inv-item-info">
          <div class="inv-item-name">${seed.name} ${typeTag}</div>
          <div class="inv-item-detail">
            <span class="coin">🪙${sellVal}</span>
            ${item.mutation ? `<span> · ${mutEmoji}${item.mutation}</span>` : ''}
            <span class="rarity-tag" style="color:${RARITIES[rarity]?.color ?? '#888'};font-size:0.55rem;"> ${rarityLabel}</span>
          </div>
        </div>
        <div class="inv-item-qty">×${item.qty}</div>
      </div>
    `;
  }).join('');

  // Обработка кликов
  listEl.querySelectorAll('.inv-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      if (selectMode) {
        if (selectedIndices.has(idx)) {
          selectedIndices.delete(idx);
          el.classList.remove('selected');
        } else {
          selectedIndices.add(idx);
          el.classList.add('selected');
        }
        if (selectCountEl) {
          selectCountEl.textContent = `${selectedIndices.size} выбрано`;
        }
      } else {
        if (callbacks?.onItemClick) callbacks.onItemClick(idx, inventory[idx]);
      }
    });
  });

  if (selectModeBar && !selectModeBar.classList.contains('hidden')) {
    if (selectCountEl) selectCountEl.textContent = `${selectedIndices.size} выбрано`;
  }
}

export function getMutationEmoji(mutationId) {
  const map = { solar: '☀️', crystal: '💎', giant: '🦣', void: '🌀' };
  return mutationId ? (map[mutationId] || '') : '';
}

export function enterSelectMode() {
  selectMode = true;
  selectedIndices = new Set();
  const bar      = document.getElementById('select-mode-bar');
  const countEl  = document.getElementById('select-count');
  if (bar)     bar.classList.remove('hidden');
  if (countEl) countEl.textContent = '0 выбрано';
}

export function exitSelectMode() {
  selectMode = false;
  selectedIndices = new Set();
  const bar = document.getElementById('select-mode-bar');
  if (bar) bar.classList.add('hidden');
}

export function isInSelectMode()    { return selectMode; }
export function getSelectedIndices() { return new Set(selectedIndices); }
