// =============================================
//  GARDEN HORIZONS 2 — Гача-логика (Premium Coins)
//  Реальные деньги УДАЛЕНЫ. Только внутриигровые
//  монеты и Премиум-монеты (за мини-игры).
// =============================================

import { SEEDS, getRandomSeedByRarity } from './Seeds.js';

/**
 * Пакеты гачи.
 * costCoins    — обычные монеты
 * costPremium  — премиум-монеты (зарабатываются в мини-игре)
 */
export const PACK_DEFINITIONS = {
  common: {
    id: 'common',
    name: 'Обычный пак',
    icon: '🥉',
    costCoins:   100,
    costPremium: null,
    odds: {
      common:    80,
      rare:      17.99,
      epic:      2,
      legendary: 0.01,
    },
  },
  premium: {
    id: 'premium',
    name: 'Премиум пак',
    icon: '💎',
    costCoins:   null,
    costPremium: 10,
    odds: {
      common:    10,
      rare:      50,
      epic:      30,
      legendary: 10,
    },
  },
};

// Стартовый пак — стоит 50 Premium Coins, даёт 15 редких семян
export const STARTER_PACK_COST_PREMIUM = 50;
export const STARTER_PACK_QTY          = 15;

// Мини-игра: нажми на жука 5 раз за 8 секунд → +5 Premium Coins
export const MINIGAME_BUG_CLICKS    = 5;
export const MINIGAME_TIME_LIMIT_MS = 8000;
export const MINIGAME_REWARD        = 5;

/**
 * Бросить кубик редкости.
 */
export function rollRarity(odds) {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const rarity of ['common', 'rare', 'epic', 'legendary']) {
    acc += odds[rarity];
    if (roll < acc) return rarity;
  }
  return 'common';
}

/**
 * Один бросок гачи.
 */
export function rollGacha(packType) {
  const pack = PACK_DEFINITIONS[packType];
  if (!pack) throw new Error(`Неизвестный тип пака: ${packType}`);

  const rarity = rollRarity(pack.odds);
  const seedId = getRandomSeedByRarity(rarity);
  const seed   = SEEDS[seedId];

  return { seedId, rarity, seed };
}

/**
 * Сгенерировать последовательность барабана для анимации.
 */
export function generateReelSequence(result) {
  const sequence   = [];
  const totalItems = 24;

  for (let i = 0; i < totalItems - 1; i++) {
    const dummyRarity  = rollRarity({ common: 70, rare: 25, epic: 4.9, legendary: 0.1 });
    const dummySeedId  = getRandomSeedByRarity(dummyRarity);
    sequence.push({ seedId: dummySeedId, rarity: dummyRarity, seed: SEEDS[dummySeedId] });
  }

  sequence.push(result);
  return sequence;
}

/**
 * Сгенерировать стартовый пак (15 редких семян).
 */
export function generateStarterPack() {
  const items = {};
  for (let i = 0; i < STARTER_PACK_QTY; i++) {
    const seedId = getRandomSeedByRarity('rare');
    items[seedId] = (items[seedId] || 0) + 1;
  }
  return Object.entries(items).map(([seedId, qty]) => ({ seedId, qty }));
}
