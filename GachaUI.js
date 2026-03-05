// =============================================
//  GARDEN HORIZONS 2 — Гача UI + Мини-игра (RU)
//  Premium Coins зарабатываются ТОЛЬКО через
//  мини-игру «Поймай жука». Реальных денег нет.
// =============================================

import {
  rollGacha, generateReelSequence, generateStarterPack,
  PACK_DEFINITIONS, STARTER_PACK_COST_PREMIUM, STARTER_PACK_QTY,
  MINIGAME_BUG_CLICKS, MINIGAME_TIME_LIMIT_MS, MINIGAME_REWARD,
} from '../logic/Gacha.js';
import { SEEDS, RARITIES } from '../logic/Seeds.js';

const ITEM_WIDTH = 80; // px

let _callbacks  = null;
let _mgActive   = false; // мини-игра активна?

// =========================================
//  Инициализация
// =========================================
export function initGachaUI(callbacks) {
  _callbacks = callbacks;

  // Кнопки гачи
  document.querySelector('[data-pack="common"]')
    ?.addEventListener('click', () => handlePackClick('common'));
  document.querySelector('[data-pack="premium"]')
    ?.addEventListener('click', () => handlePackClick('premium'));

  // Стартовый пак
  document.getElementById('buy-starter-btn')
    ?.addEventListener('click', handleStarterPack);

  // Закрыть гачу
  document.getElementById('gacha-close-btn')
    ?.addEventListener('click', closeGachaModal);

  // Кнопка «Заработать монеты» → мини-игра
  document.getElementById('earn-premium-btn')
    ?.addEventListener('click', startMiniGame);

  // Закрыть мини-игру
  document.getElementById('minigame-close-btn')
    ?.addEventListener('click', closeMiniGame);

  updatePremiumDisplay();
}

// =========================================
//  Покупка пака
// =========================================
function handlePackClick(packType) {
  const pack = PACK_DEFINITIONS[packType];

  if (packType === 'common') {
    const cost = pack.costCoins;
    if (_callbacks.getMoney() < cost) {
      _callbacks.onNotify(`❌ Нужно 🪙${cost} монет для крутки!`);
      return;
    }
    _callbacks.onSpendMoney(cost);
    openGachaModal(packType);
    return;
  }

  if (packType === 'premium') {
    const cost = pack.costPremium;
    if (_callbacks.getPremium() < cost) {
      _callbacks.onNotify(`❌ Нужно 💎${cost} Премиум-монет! Сыграй в мини-игру, чтобы заработать.`);
      return;
    }
    _callbacks.onSpendPremium(cost);
    openGachaModal(packType);
    return;
  }
}

// =========================================
//  Стартовый пак
// =========================================
function handleStarterPack() {
  const cost = STARTER_PACK_COST_PREMIUM;
  if (_callbacks.getPremium() < cost) {
    _callbacks.onNotify(`❌ Нужно 💎${cost} Премиум-монет! Заработай в мини-игре.`);
    return;
  }
  _callbacks.onSpendPremium(cost);

  const items = generateStarterPack();
  _callbacks.onStarterPack(items);
  _callbacks.onNotify(`🌟 Стартовый пак куплен! ${STARTER_PACK_QTY} редких семян добавлены в инвентарь.`);
  updatePremiumDisplay();
}

// =========================================
//  Гача Модал
// =========================================
function openGachaModal(packType) {
  const modal        = document.getElementById('gacha-modal');
  const reelTrack    = document.getElementById('reel-track');
  const resultDiv    = document.getElementById('gacha-result');
  const resultIcon   = document.getElementById('result-icon');
  const resultName   = document.getElementById('result-name');
  const resultRarity = document.getElementById('result-rarity');

  if (!modal || !reelTrack) return;

  const result   = rollGacha(packType);
  const sequence = generateReelSequence(result);

  modal.classList.remove('hidden');
  if (resultDiv) resultDiv.classList.add('hidden');

  const gachaH3 = modal.querySelector('h3');
  if (gachaH3) gachaH3.textContent = '🎰 Крутим барабан...';

  // Построить барабан
  reelTrack.innerHTML    = '';
  reelTrack.style.transition = 'none';
  reelTrack.style.transform  = 'translateX(0)';

  sequence.forEach(item => {
    const el        = document.createElement('div');
    el.className    = `reel-item ${item.rarity}`;
    el.innerHTML    = `
      <span>${item.seed.emoji}</span>
      <span class="reel-item-label">${item.seed.name}</span>
    `;
    reelTrack.appendChild(el);
  });

  reelTrack.getBoundingClientRect(); // force reflow

  const reelEl            = document.getElementById('roulette-reel');
  const reelVisibleCenter = (reelEl?.clientWidth ?? 280) / 2;
  const targetIndex       = sequence.length - 1;
  const targetX           = -(targetIndex * ITEM_WIDTH - reelVisibleCenter + ITEM_WIDTH / 2);

  setTimeout(() => {
    reelTrack.style.transition = 'transform 2.8s cubic-bezier(0.17, 0.67, 0.12, 1)';
    reelTrack.style.transform  = `translateX(${targetX}px)`;
  }, 50);

  setTimeout(() => {
    if (gachaH3) gachaH3.textContent = '✨ Вы получили:';
    if (resultDiv) resultDiv.classList.remove('hidden');

    const seed       = result.seed;
    const rarityData = RARITIES[result.rarity];

    if (resultIcon)  resultIcon.textContent  = seed.emoji;
    if (resultName)  resultName.textContent  = seed.name;
    if (resultRarity) {
      resultRarity.textContent = rarityData.label.toUpperCase();
      resultRarity.className   = `result-rarity ${result.rarity}`;
    }

    _callbacks.onGachaReward(result.seedId, 1, result.rarity);
  }, 3300);
}

function closeGachaModal() {
  document.getElementById('gacha-modal')?.classList.add('hidden');
}

// =========================================
//  Мини-игра «Поймай жука»
// =========================================
function startMiniGame() {
  if (_mgActive) return;
  _mgActive = true;

  const modal      = document.getElementById('minigame-modal');
  const bugEl      = document.getElementById('mg-bug');
  const timerEl    = document.getElementById('mg-timer');
  const clicksEl   = document.getElementById('mg-clicks');
  const resultEl   = document.getElementById('mg-result');
  const startBtn   = document.getElementById('mg-start-btn');

  if (!modal) return;

  modal.classList.remove('hidden');
  if (resultEl)  resultEl.classList.add('hidden');
  if (startBtn)  startBtn.classList.add('hidden');

  let clicksLeft  = MINIGAME_BUG_CLICKS;
  let timeLeft    = MINIGAME_TIME_LIMIT_MS / 1000;
  let won         = false;
  let tickInterval = null;
  let bugTimeout   = null;

  if (clicksEl) clicksEl.textContent = `Кликов: ${clicksLeft}/${MINIGAME_BUG_CLICKS}`;
  if (timerEl)  timerEl.textContent  = `⏱ ${timeLeft.toFixed(1)}с`;

  // Двигать жука случайно
  const moveBug = () => {
    if (!bugEl) return;
    const maxX = (modal.clientWidth  || 300) - 60;
    const maxY = (modal.clientHeight || 400) - 120;
    const x    = Math.floor(Math.random() * Math.max(maxX, 80));
    const y    = Math.floor(Math.random() * Math.max(maxY, 80)) + 40;
    bugEl.style.left = `${x}px`;
    bugEl.style.top  = `${y}px`;
    bugEl.classList.remove('bug-caught');
  };

  moveBug();
  if (bugEl) bugEl.style.display = 'block';

  // Клик по жуку
  const onBugClick = () => {
    if (!_mgActive || won) return;
    clicksLeft--;
    bugEl?.classList.add('bug-caught');
    if (clicksEl) clicksEl.textContent = `Кликов: ${MINIGAME_BUG_CLICKS - clicksLeft}/${MINIGAME_BUG_CLICKS}`;

    if (clicksLeft <= 0) {
      won = true;
      endMiniGame(true, tickInterval);
      return;
    }

    bugTimeout = setTimeout(moveBug, 200);
  };

  if (bugEl) {
    bugEl.onclick = onBugClick;
  }

  // Таймер
  const startTime = Date.now();
  tickInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timeLeft      = Math.max(0, MINIGAME_TIME_LIMIT_MS / 1000 - elapsed);
    if (timerEl) timerEl.textContent = `⏱ ${timeLeft.toFixed(1)}с`;

    if (timeLeft <= 0 && !won) {
      clearInterval(tickInterval);
      endMiniGame(false, null);
    }
  }, 100);

  function endMiniGame(success, interval) {
    if (interval) clearInterval(interval);
    if (bugTimeout) clearTimeout(bugTimeout);
    if (bugEl) bugEl.style.display = 'none';

    if (resultEl) {
      resultEl.classList.remove('hidden');
      resultEl.innerHTML = success
        ? `<div class="mg-win">🎉 Отлично! +${MINIGAME_REWARD} 💎 Премиум-монет!</div>`
        : `<div class="mg-lose">⏰ Время вышло! Попробуй снова.</div>`;
    }

    if (success) {
      _callbacks.onEarnPremium(MINIGAME_REWARD);
      updatePremiumDisplay();
    }

    if (startBtn) {
      startBtn.classList.remove('hidden');
      startBtn.textContent = success ? 'Ещё раз! 🐛' : 'Попробовать снова';
    }

    _mgActive = false;
  }
}

function closeMiniGame() {
  _mgActive = false;
  document.getElementById('minigame-modal')?.classList.add('hidden');
}

function updatePremiumDisplay() {
  const el = document.getElementById('premium-display');
  if (el && _callbacks) el.textContent = _callbacks.getPremium();
}
