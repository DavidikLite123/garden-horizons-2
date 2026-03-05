// =============================================
//  GARDEN HORIZONS 2 — Рынок / Магазин
//  Правила:
//  1. «Страховочная морковка» ВСЕГДА есть в стоке.
//  2. Если у игрока 0 монет и 0 семян — морковка БЕСПЛАТНО.
//  3. Редкие семена появляются реже (≤1 слот из 6).
//  4. В обычном магазине могут появляться «Мешки семян».
// =============================================

import { SEEDS, SEED_IDS, getSeedsByRarity } from './Seeds.js';

export const SHOP_REFRESH_MS       = 5 * 60 * 1000;
const SHOP_STOCK_KEY              = 'gh2_shop_stock';
const SHOP_LAST_REFRESH_KEY       = 'gh2_shop_last_refresh';

// Сколько обычных слотов (помимо морковки)
const SHOP_COMMON_SLOTS  = 3;
// Максимум 1 редкий слот
const SHOP_RARE_SLOTS    = 1;
// Шанс появления «Мешка семян» вместо обычного слота
const SEED_PACK_CHANCE   = 0.25;

export const SEED_PACK_ITEMS = {
  commonPack: {
    id:          'commonPack',
    type:        'pack',
    name:        'Мешок обычных семян',
    desc:        '5 случайных обычных семян',
    emoji:       '🎒',
    buyPrice:    25,
    seedQty:     5,
    seedRarity:  'common',
  },
  rarePack: {
    id:          'rarePack',
    type:        'pack',
    name:        'Мешок редких семян',
    desc:        '3 случайных редких семени',
    emoji:       '💼',
    buyPrice:    80,
    seedQty:     3,
    seedRarity:  'rare',
  },
};

/**
 * Сгенерировать случайный ассортимент магазина.
 */
export function generateStock() {
  const stock = [];

  // — ЖЁСТКОЕ ПРАВИЛО: страховочная морковка
  stock.push({
    seedId:      'carrot',
    buyPrice:    1,
    stock:       10,
    isEmergency: true,
    type:        'seed',
  });

  // — До SHOP_COMMON_SLOTS обычных семян (не морковь)
  const commonIds = getSeedsByRarity('common').filter(id => id !== 'carrot');
  const shuffledCommon = [...commonIds].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(SHOP_COMMON_SLOTS, shuffledCommon.length); i++) {
    // Шанс заменить слот мешком семян
    if (Math.random() < SEED_PACK_CHANCE) {
      const packDef = Math.random() < 0.6
        ? SEED_PACK_ITEMS.commonPack
        : SEED_PACK_ITEMS.rarePack;

      stock.push({
        seedId:      packDef.id,
        buyPrice:    packDef.buyPrice,
        stock:       randomInt(2, 5),
        isEmergency: false,
        type:        'pack',
        packDef,
      });
    } else {
      const seedId = shuffledCommon[i];
      const seed   = SEEDS[seedId];
      const mult   = 0.85 + Math.random() * 0.35;
      stock.push({
        seedId,
        buyPrice:    Math.max(1, Math.round(seed.buyPrice * mult)),
        stock:       randomInt(5, 15),
        isEmergency: false,
        type:        'seed',
      });
    }
  }

  // — Максимум 1 редкое семя (РЕДКО появляется)
  if (Math.random() < 0.35) {
    const rareIds    = getSeedsByRarity('rare');
    const rareId     = rareIds[Math.floor(Math.random() * rareIds.length)];
    const seed       = SEEDS[rareId];
    const mult       = 0.9 + Math.random() * 0.3;
    stock.push({
      seedId:      rareId,
      buyPrice:    Math.max(5, Math.round(seed.buyPrice * mult)),
      stock:       randomInt(2, 6),
      isEmergency: false,
      type:        'seed',
    });
  }

  return stock;
}

/**
 * Загрузить или обновить ассортимент.
 */
export function loadOrRefreshStock(playerMoney = 0, playerSeeds = []) {
  const now         = Date.now();
  const lastRefresh = parseInt(localStorage.getItem(SHOP_LAST_REFRESH_KEY) || '0', 10);
  const elapsed     = now - lastRefresh;

  let items;
  if (elapsed >= SHOP_REFRESH_MS || !localStorage.getItem(SHOP_STOCK_KEY)) {
    items = generateStock();
    saveStock(items);
    localStorage.setItem(SHOP_LAST_REFRESH_KEY, now.toString());
    items = applyEmergencyRule(items, playerMoney, playerSeeds);
    return { items, lastRefresh: now, nextRefresh: now + SHOP_REFRESH_MS, refreshed: true };
  }

  try {
    items = JSON.parse(localStorage.getItem(SHOP_STOCK_KEY));
    if (!items || !Array.isArray(items)) throw new Error('bad data');
    if (!items.find(i => i.isEmergency)) {
      items.unshift({ seedId: 'carrot', buyPrice: 1, stock: 10, isEmergency: true, type: 'seed' });
      saveStock(items);
    }
  } catch {
    items = generateStock();
    saveStock(items);
    localStorage.setItem(SHOP_LAST_REFRESH_KEY, now.toString());
  }

  items = applyEmergencyRule(items, playerMoney, playerSeeds);
  return { items, lastRefresh, nextRefresh: lastRefresh + SHOP_REFRESH_MS, refreshed: false };
}

/**
 * Экстренное правило: морковка бесплатно если нет монет и семян.
 */
export function applyEmergencyRule(items, playerMoney, playerSeeds) {
  const isBroke = playerMoney <= 0 &&
    (!playerSeeds || playerSeeds.filter(i => i.type === 'seed' && i.qty > 0).length === 0);

  return items.map(item => {
    if (item.isEmergency) {
      return { ...item, buyPrice: isBroke ? 0 : 1 };
    }
    return item;
  });
}

export function saveStock(items) {
  localStorage.setItem(SHOP_STOCK_KEY, JSON.stringify(items));
}

/**
 * Купить из магазина (семя или мешок).
 */
export function buyFromStock(items, seedId, qty = 1) {
  const itemIndex = items.findIndex(i => i.seedId === seedId);
  if (itemIndex === -1) return { success: false, message: 'Товар не найден.' };

  const item = items[itemIndex];
  if (item.stock < qty) return { success: false, message: 'Недостаточно товара на складе.' };

  const cost     = item.buyPrice * qty;
  const newItems = items.map((it, idx) =>
    idx === itemIndex ? { ...it, stock: it.stock - qty } : it
  );

  const filtered = newItems.filter(it => it.isEmergency || it.stock > 0);
  if (!filtered.find(i => i.isEmergency)) {
    filtered.unshift({ seedId: 'carrot', buyPrice: 1, stock: 10, isEmergency: true, type: 'seed' });
  }

  saveStock(filtered);
  return { success: true, newItems: filtered, cost, boughtItem: item };
}

export function getMsUntilRefresh() {
  const lastRefresh = parseInt(localStorage.getItem(SHOP_LAST_REFRESH_KEY) || '0', 10);
  return Math.max(0, SHOP_REFRESH_MS - (Date.now() - lastRefresh));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
