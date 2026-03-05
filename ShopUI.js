// =============================================
//  GARDEN HORIZONS 2 — Магазин UI (RU)
//  Поддержка: семена + мешки семян (packs)
// =============================================

import { SEEDS, RARITIES } from '../logic/Seeds.js';
import { SEED_PACK_ITEMS } from '../logic/Market.js';

/**
 * Отрисовать список товаров магазина.
 * @param {Array}    items
 * @param {number}   playerMoney
 * @param {function} onBuy — callback(seedId, qty, cost)
 */
export function renderShop(items, playerMoney, onBuy) {
  const shopList = document.getElementById('shop-list');
  if (!shopList) return;

  if (!items || items.length === 0) {
    shopList.innerHTML = '<div class="empty-msg">🏪 Магазин загружается...</div>';
    return;
  }

  shopList.innerHTML = items.map(item => {
    const isPack = item.type === 'pack';

    if (isPack) {
      return renderPackItem(item, playerMoney);
    }

    const seed = SEEDS[item.seedId];
    if (!seed) return '';

    const rarity       = seed.rarity;
    const rarityColor  = RARITIES[rarity]?.color || '#888';
    const canAfford    = playerMoney >= item.buyPrice;
    const inStock      = item.stock > 0;

    const emergencyBadge = item.isEmergency
      ? '<span class="emergency-badge">🆘 Страховка</span>'
      : '';

    const priceLabel = item.buyPrice === 0
      ? '<span style="color:#4db86a;font-weight:800;">БЕСПЛАТНО</span>'
      : `🪙 ${item.buyPrice}`;

    const disabledAttr = ((!canAfford && item.buyPrice !== 0) || !inStock)
      ? 'disabled style="opacity:0.5;cursor:not-allowed;"'
      : '';

    return `
      <div class="shop-item" data-seed="${item.seedId}">
        <div class="shop-item-icon">${seed.emoji}</div>
        <div class="shop-item-info">
          <div class="shop-item-name" style="color:${rarityColor}">
            ${seed.name}${emergencyBadge}
          </div>
          <div class="shop-item-desc">
            ${seed.desc} · ⏱ ${seed.growTime}с · 🌾 ×${seed.yieldMin}–${seed.yieldMax}
          </div>
        </div>
        <div class="shop-item-right">
          <div class="shop-item-price">${priceLabel}</div>
          <div class="shop-item-stock">Склад: ${inStock ? item.stock : '❌'}</div>
          <button class="btn btn-gold btn-buy"
            data-seed="${item.seedId}"
            ${disabledAttr}>
            Купить
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Слушатели
  shopList.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const seedId   = btn.dataset.seed;
      const shopItem = items.find(i => i.seedId === seedId);
      if (shopItem && onBuy) onBuy(seedId, 1, shopItem.buyPrice);
    });
  });
}

function renderPackItem(item, playerMoney) {
  const packDef   = item.packDef ?? SEED_PACK_ITEMS[item.seedId];
  if (!packDef) return '';

  const canAfford  = playerMoney >= item.buyPrice;
  const inStock    = item.stock > 0;
  const disabledAttr = (!canAfford || !inStock)
    ? 'disabled style="opacity:0.5;cursor:not-allowed;"'
    : '';

  return `
    <div class="shop-item shop-item-pack" data-seed="${item.seedId}">
      <div class="shop-item-icon">${packDef.emoji}</div>
      <div class="shop-item-info">
        <div class="shop-item-name" style="color:#e8c84a;">
          ${packDef.name}
        </div>
        <div class="shop-item-desc">${packDef.desc}</div>
      </div>
      <div class="shop-item-right">
        <div class="shop-item-price">🪙 ${item.buyPrice}</div>
        <div class="shop-item-stock">Склад: ${inStock ? item.stock : '❌'}</div>
        <button class="btn btn-gold btn-buy"
          data-seed="${item.seedId}"
          ${disabledAttr}>
          Купить
        </button>
      </div>
    </div>
  `;
}

/**
 * Обновить таймер обновления магазина.
 */
export function updateShopTimer(msRemaining) {
  const timerEl = document.getElementById('shop-timer-display');
  if (!timerEl) return;

  const totalSec = Math.ceil(msRemaining / 1000);
  const min      = Math.floor(totalSec / 60);
  const sec      = totalSec % 60;
  timerEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
}
