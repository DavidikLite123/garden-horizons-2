// =============================================
//  GARDEN HORIZONS 2 — Система Мутаций (RU)
// =============================================

import { getRandomSeedByRarity, SEEDS } from './Seeds.js';

export const MUTATIONS = {
  solar: {
    id:          'solar',
    name:        'Солнечная Мутация',
    emoji:       '☀️',
    description: '3× цена продажи во время Солнечной Зари.',
    cssClass:    'mutation-solar',
    badge:       '☀️',
  },
  crystal: {
    id:          'crystal',
    name:        'Кристальная Мутация',
    emoji:       '💎',
    description: 'Приносит Премиум-монеты при сборе урожая.',
    cssClass:    'mutation-crystal',
    badge:       '💎',
  },
  giant: {
    id:          'giant',
    name:        'Гигантская Мутация',
    emoji:       '🦣',
    description: '10× урожай при сборе.',
    cssClass:    'mutation-giant',
    badge:       '🦣',
  },
  void: {
    id:          'void',
    name:        'Пустотная Мутация',
    emoji:       '🌀',
    description: 'Трансформируется в случайное семя при сборе.',
    cssClass:    'mutation-void',
    badge:       '🌀',
  },
};

export const MUTATION_CHANCE = 0.05; // 5%

const MUTATION_IDS = Object.keys(MUTATIONS);

/**
 * Бросить кубик мутации. Возвращает null если не сработало.
 * @param {boolean} forceSolar — принудительно «solar» (во время Зари)
 */
export function rollMutation(forceSolar = false) {
  if (forceSolar) return 'solar';
  if (Math.random() > MUTATION_CHANCE) return null;
  return MUTATION_IDS[Math.floor(Math.random() * MUTATION_IDS.length)];
}

/**
 * Применить эффекты мутации при сборе урожая.
 * @param {object}      plot
 * @param {object}      seed
 * @param {number}      baseYield
 * @param {object|null} activeEvent
 * @returns {{ finalYield, premiumYield, transformedSeedId, messages }}
 */
export function applyMutationEffects(plot, seed, baseYield, activeEvent) {
  let finalYield        = baseYield;
  let premiumYield      = 0;
  let transformedSeedId = null;
  const messages        = [];

  const mutation = plot.mutation ? MUTATIONS[plot.mutation] : null;

  if (!mutation) {
    return { finalYield, premiumYield, transformedSeedId, messages };
  }

  switch (mutation.id) {

    case 'solar':
      messages.push('☀️ Солнечная Мутация: цена продажи ×3!');
      break;

    case 'crystal': {
      premiumYield = Math.floor(Math.random() * 3) + 1;
      messages.push(`💎 Кристальная Мутация: +${premiumYield} Премиум-монет!`);
      break;
    }

    case 'giant':
      finalYield = baseYield * 10;
      messages.push(`🦣 Гигантская Мутация: урожай ×10! Получено ${finalYield}!`);
      break;

    case 'void': {
      const allRarities  = ['common', 'rare', 'epic', 'legendary'];
      const pickedRarity = allRarities[Math.floor(Math.random() * allRarities.length)];
      transformedSeedId  = getRandomSeedByRarity(pickedRarity);
      const tSeed        = SEEDS[transformedSeedId];
      const tName        = tSeed ? `${tSeed.emoji} ${tSeed.name}` : transformedSeedId;
      messages.push(`🌀 Пустотная Мутация: превратилось в семя ${tName}!`);
      break;
    }

    default:
      break;
  }

  return { finalYield, premiumYield, transformedSeedId, messages };
}

/**
 * Получить множитель цены продажи.
 */
export function getSellMultiplier(mutation, activeEvent) {
  if (mutation === 'solar' || (activeEvent && activeEvent.id === 'solarDawn')) {
    return 3;
  }
  return 1;
}
