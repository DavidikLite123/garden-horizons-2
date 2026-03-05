// =============================================
//  GARDEN HORIZONS 2 — База семян (RU)
// =============================================

export const RARITIES = {
  common:    { label: 'Обычное',     color: '#888',     weight: 80   },
  rare:      { label: 'Редкое',      color: '#4a90e2',  weight: 18   },
  epic:      { label: 'Эпическое',   color: '#9b59b6',  weight: 2    },
  legendary: { label: 'ЛЕГЕНДАРНОЕ', color: '#f39c12',  weight: 0.01 },
};

export const SEEDS = {
  // === ОБЫЧНЫЕ ===
  carrot: {
    id: 'carrot', name: 'Морковь', emoji: '🥕', rarity: 'common',
    growTime: 20, buyPrice: 1, sellPrice: 3,
    yieldMin: 1, yieldMax: 2, isEmergency: true,
    desc: 'Быстрорастущая основная культура.'
  },
  potato: {
    id: 'potato', name: 'Картофель', emoji: '🥔', rarity: 'common',
    growTime: 30, buyPrice: 2, sellPrice: 5,
    yieldMin: 1, yieldMax: 3,
    desc: 'Сытный подземный овощ.'
  },
  tomato: {
    id: 'tomato', name: 'Помидор', emoji: '🍅', rarity: 'common',
    growTime: 45, buyPrice: 3, sellPrice: 8,
    yieldMin: 2, yieldMax: 4,
    desc: 'Красный и сочный урожай.'
  },
  corn: {
    id: 'corn', name: 'Кукуруза', emoji: '🌽', rarity: 'common',
    growTime: 60, buyPrice: 4, sellPrice: 10,
    yieldMin: 1, yieldMax: 2,
    desc: 'Золотые стебли тянутся к небу.'
  },
  eggplant: {
    id: 'eggplant', name: 'Баклажан', emoji: '🍆', rarity: 'common',
    growTime: 50, buyPrice: 3, sellPrice: 9,
    yieldMin: 1, yieldMax: 3,
    desc: 'Тёмно-фиолетовый урожай.'
  },
  // === РЕДКИЕ ===
  strawberry: {
    id: 'strawberry', name: 'Клубника', emoji: '🍓', rarity: 'rare',
    growTime: 90, buyPrice: 15, sellPrice: 40,
    yieldMin: 3, yieldMax: 6,
    desc: 'Сладкая и желанная.'
  },
  watermelon: {
    id: 'watermelon', name: 'Арбуз', emoji: '🍉', rarity: 'rare',
    growTime: 120, buyPrice: 20, sellPrice: 55,
    yieldMin: 1, yieldMax: 2,
    desc: 'Большой летний плод.'
  },
  mushroom: {
    id: 'mushroom', name: 'Волшебный гриб', emoji: '🍄', rarity: 'rare',
    growTime: 100, buyPrice: 18, sellPrice: 50,
    yieldMin: 2, yieldMax: 5,
    desc: 'Растёт в тени.'
  },
  blueberry: {
    id: 'blueberry', name: 'Черника', emoji: '🫐', rarity: 'rare',
    growTime: 110, buyPrice: 22, sellPrice: 60,
    yieldMin: 4, yieldMax: 8,
    desc: 'Маленькая кладовая антиоксидантов.'
  },
  // === ЭПИЧЕСКИЕ ===
  dragonFruit: {
    id: 'dragonFruit', name: 'Драконий фрукт', emoji: '🐉', rarity: 'epic',
    growTime: 180, buyPrice: 80, sellPrice: 220,
    yieldMin: 1, yieldMax: 3,
    desc: 'Мифическая экзотика.'
  },
  goldenApple: {
    id: 'goldenApple', name: 'Золотое яблоко', emoji: '🍏', rarity: 'epic',
    growTime: 200, buyPrice: 100, sellPrice: 280,
    yieldMin: 2, yieldMax: 4,
    desc: 'По легенде исполняет желания.'
  },
  starfruit: {
    id: 'starfruit', name: 'Звёздный фрукт', emoji: '⭐', rarity: 'epic',
    growTime: 160, buyPrice: 90, sellPrice: 250,
    yieldMin: 2, yieldMax: 5,
    desc: 'Падает с неба на рассвете.'
  },
  // === ЛЕГЕНДАРНЫЕ ===
  phoenix: {
    id: 'phoenix', name: 'Феникс Цвет', emoji: '🔥', rarity: 'legendary',
    growTime: 300, buyPrice: 500, sellPrice: 1500,
    yieldMin: 1, yieldMax: 2,
    desc: 'Возрождён из пепла. Крайне редок.'
  },
  moonflower: {
    id: 'moonflower', name: 'Лунный цветок', emoji: '🌙', rarity: 'legendary',
    growTime: 360, buyPrice: 600, sellPrice: 2000,
    yieldMin: 1, yieldMax: 3,
    desc: 'Расцветает только при лунном свете.'
  },
  rainbowRose: {
    id: 'rainbowRose', name: 'Радужная роза', emoji: '🌈', rarity: 'legendary',
    growTime: 400, buyPrice: 800, sellPrice: 3000,
    yieldMin: 1, yieldMax: 2,
    desc: 'Вершина садоводства.'
  },
};

export const SEED_IDS = Object.keys(SEEDS);

export function getSeedsByRarity(rarity) {
  return SEED_IDS.filter(id => SEEDS[id].rarity === rarity);
}

export function getRandomSeedByRarity(rarity) {
  const ids = getSeedsByRarity(rarity);
  return ids[Math.floor(Math.random() * ids.length)];
}

export function getCommonSeeds()    { return getSeedsByRarity('common'); }
export function getRareSeeds()      { return getSeedsByRarity('rare'); }
export function getEpicSeeds()      { return getSeedsByRarity('epic'); }
export function getLegendarySeeds() { return getSeedsByRarity('legendary'); }
