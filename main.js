// =============================================
//  GARDEN HORIZONS 2 — Главный файл
// =============================================

import './style.css';
import {
  loadState, saveState, addToInventory, removeFromInventory,
  calcSellValue, expandGarden, getNextPlotCost, MAX_PLOTS,
} from './logic/GameState.js';
import {
  loadOrRefreshStock, buyFromStock, getMsUntilRefresh,
  applyEmergencyRule, SEED_PACK_ITEMS,
} from './logic/Market.js';
import { TimeManager } from './logic/TimeEvents.js';
import { SEEDS, getRandomSeedByRarity } from './logic/Seeds.js';
import { plantSeed, harvestPlot, isPlotReady, updatePlotGrowth } from './entities/Garden.js';
import { Farmer } from './entities/Farmer.js';
import {
  buildGardenGrid, renderGarden, renderPlot, showHarvestParticles,
  updateWorldVisuals, updateBuyPlotButton,
} from './ui/GardenUI.js';
import {
  renderInventory, enterSelectMode, exitSelectMode,
  isInSelectMode, getSelectedIndices, getMutationEmoji,
} from './ui/InventoryUI.js';
import { renderShop, updateShopTimer } from './ui/ShopUI.js';
import { initGachaUI } from './ui/GachaUI.js';

// =============================================
//  Состояние
// =============================================
let state       = loadState();
let shopData    = null;
let activeEvent = null;
let farmer      = null;
let activeTab   = 'inventory';
let farmerBusy  = false;

// =============================================
//  Splash Screen
// =============================================
function showSplash() {
  return new Promise(resolve => {
    const splash = document.getElementById('splash-screen');
    if (!splash) { resolve(); return; }
    setTimeout(() => {
      splash.classList.add('fade-out');
      splash.addEventListener('transitionend', () => { splash.remove(); resolve(); }, { once: true });
    }, 2600);
  });
}

// =============================================
//  Init
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  await showSplash();
  init();
});

function init() {
  // Фермер
  farmer = new Farmer(document.getElementById('farmer'));

  // Построить сетку грядок под сохранённый plotCount
  buildGardenGrid(state.plotCount, handlePlotClick);

  // Центрировать фермера после построения DOM
  requestAnimationFrame(() => requestAnimationFrame(() => farmer.resetToCenter()));

  // Магазин
  shopData = loadOrRefreshStock(state.money, state.inventory);
  if (shopData.refreshed) notify('🏪 Магазин обновил ассортимент!');

  // Менеджер времени
  const timeMgr = new TimeManager();
  timeMgr.onTick(({ msk, event, eventChanged }) => {
    const timeEl = document.getElementById('time-display');
    if (timeEl) timeEl.textContent = msk.timeStr;

    if (eventChanged) {
      const prev  = activeEvent;
      activeEvent = event;
      updateWorldVisuals(activeEvent);
      if (event)      notify(`🌅 ${event.name} началась! ${event.description}`, 'event-notif');
      else if (prev)  notify(`🌆 ${prev.name} закончилась.`, 'event-notif');
    } else {
      activeEvent = event;
    }

    updateShopTimer(getMsUntilRefresh());

    if (getMsUntilRefresh() <= 0) {
      shopData = loadOrRefreshStock(state.money, state.inventory);
      notify('🏪 Магазин обновлён!');
      if (activeTab === 'shop') renderShopUI();
    }
  });
  timeMgr.start();

  activeEvent = timeMgr.getCurrentEvent();
  updateWorldVisuals(activeEvent);

  renderGardenUI();
  renderInventoryUI();
  renderShopUI();
  updateMoneyDisplay();
  updateBuyPlotBtn();
  bindTabs();
  bindInventoryButtons();

  // Гача UI
  initGachaUI({
    getMoney:    () => state.money,
    getPremium:  () => state.premium,
    onSpendMoney: (amount) => {
      state.money = Math.max(0, state.money - amount);
      updateMoneyDisplay();
      saveState(state);
    },
    onSpendPremium: (amount) => {
      state.premium = Math.max(0, state.premium - amount);
      updateMoneyDisplay();
      saveState(state);
    },
    onEarnPremium: (amount) => {
      state.premium += amount;
      updateMoneyDisplay();
      saveState(state);
      notify(`💎 +${amount} Премиум-монет заработано!`, 'mutation-notif');
    },
    onGachaReward: (seedId, qty, rarity) => {
      state.inventory = addToInventory(state.inventory, seedId, qty, 'seed', null, false);
      saveState(state);
      renderInventoryUI();
      const seed = SEEDS[seedId];
      const RARITY_LABELS = {
        common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', legendary: 'ЛЕГЕНДАРНОЕ',
      };
      notify(`🎉 Получено ${seed?.emoji} ${seed?.name} [${RARITY_LABELS[rarity] ?? rarity}]!`, 'mutation-notif');
    },
    onStarterPack: (items) => {
      for (const { seedId, qty } of items) {
        state.inventory = addToInventory(state.inventory, seedId, qty, 'seed', null, false);
      }
      saveState(state);
      renderInventoryUI();
    },
    onNotify: notify,
  });

  // Авто-обновление грядок
  setInterval(renderGardenUI, 2000);
  // Автосохранение
  setInterval(() => saveState(state), 10000);

  setTimeout(() => {
    notify('🌱 Добро пожаловать в Garden Horizons 2! Нажмите на грядку, чтобы посадить семя.');
  }, 400);
}

// =============================================
//  Вкладки
// =============================================
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.add('active');

  if (tab === 'shop')      { refreshShopWithEmergencyRule(); renderShopUI(); }
  if (tab === 'inventory') renderInventoryUI();
}

// =============================================
//  Сад UI
// =============================================
function renderGardenUI() {
  renderGarden(state.garden, activeEvent, handlePlotClick);
}

function handlePlotClick(plotIdx) {
  if (farmerBusy) return;

  const plot = state.garden[plotIdx];
  if (!plot) return;

  if (plot.seedId === null) {
    const seedInv = state.inventory.find(item => item.type === 'seed' && item.qty > 0);
    if (!seedInv) {
      notify('🛒 Нет семян! Купите их в магазине.', '');
      switchTab('shop');
      return;
    }
    plantSeedInPlot(plotIdx, seedInv.seedId);
    return;
  }

  if (isPlotReady(plot)) {
    triggerHarvest(plotIdx);
    return;
  }

  const seed = SEEDS[plot.seedId];
  if (seed) {
    const elapsed   = (Date.now() - plot.plantedAt) / 1000;
    const remaining = Math.max(0, Math.ceil(seed.growTime - elapsed));
    const mutTag    = plot.mutation ? ` ${getMutationEmoji(plot.mutation)} ${plot.mutation}!` : '';
    notify(`🌱 ${seed.name} растёт... ещё ${remaining}с.${mutTag}`);
  }
}

function plantSeedInPlot(plotIdx, seedId) {
  const invIdx = state.inventory.findIndex(
    item => item.seedId === seedId && item.type === 'seed' && item.qty > 0
  );
  if (invIdx === -1) return;

  farmerBusy = true;
  farmer.moveToPlot(plotIdx, null, () => {
    const isSolarDawn = activeEvent?.id === 'solarDawn';
    const newPlot     = plantSeed(state.garden[plotIdx], seedId, isSolarDawn);
    state.garden[plotIdx] = newPlot;
    state.inventory       = removeFromInventory(state.inventory, invIdx, 1);

    const seed   = SEEDS[seedId];
    const mutMsg = newPlot.mutation
      ? ` ${getMutationEmoji(newPlot.mutation)} Мутация: ${newPlot.mutation.toUpperCase()}!`
      : '';
    notify(`🌱 Посажено ${seed?.emoji} ${seed?.name}!${mutMsg}`, newPlot.mutation ? 'mutation-notif' : '');

    saveState(state);
    renderGardenUI();
    renderInventoryUI();

    setTimeout(() => { farmerBusy = false; farmer.resetToCenter(); }, 400);
  });
}

function triggerHarvest(plotIdx) {
  if (state.garden[plotIdx]?.harvesting) return;
  farmerBusy = true;

  farmer.moveToPlot(plotIdx, null, () => {
    state.garden[plotIdx] = { ...state.garden[plotIdx], harvesting: true };
    farmer.setWorking(true);
    renderGardenUI();

    setTimeout(() => {
      const plot = state.garden[plotIdx];
      const seed = SEEDS[plot.seedId];

      const plotEl = document.querySelector(`.plot[data-plot="${plotIdx}"]`);
      if (plotEl && seed) showHarvestParticles(plotEl, seed.emoji);

      const result = harvestPlot(plot, state.inventory, state.money, state.premium, activeEvent);
      if (result) {
        state.garden[plotIdx] = result.newPlot;
        state.inventory       = result.newInventory;
        state.money           = result.newMoney;
        state.premium         = result.newPremium;

        for (const msg of result.messages) notify(msg, 'mutation-notif');
        notify(`✅ Собрано ${seed?.emoji} ${seed?.name}!`);

        updateMoneyDisplay();
        saveState(state);
        refreshShopWithEmergencyRule();
        renderGardenUI();
        renderInventoryUI();
      }

      farmer.setWorking(false);
      setTimeout(() => { farmerBusy = false; farmer.resetToCenter(); }, 400);
    }, 500);
  });
}

// =============================================
//  Кнопка «Купить грядку»
// =============================================
function updateBuyPlotBtn() {
  updateBuyPlotButton(state.plotCount, state.money, handleBuyPlot);
}

function handleBuyPlot() {
  if (state.plotCount >= MAX_PLOTS) {
    notify('🌿 Это максимальное количество грядок!');
    return;
  }
  const cost = getNextPlotCost(state.plotCount);
  if (state.money < cost) {
    notify(`💸 Нужно 🪙${cost} монет для новой грядки!`);
    return;
  }

  const newState = expandGarden(state);
  if (!newState) {
    notify('❌ Невозможно расширить сад!');
    return;
  }

  state = newState;
  saveState(state);

  // Перестроить сетку грядок
  buildGardenGrid(state.plotCount, handlePlotClick);

  // Сбросить положение фермера
  requestAnimationFrame(() => requestAnimationFrame(() => farmer.resetToCenter()));

  updateMoneyDisplay();
  updateBuyPlotBtn();
  renderGardenUI();
  notify(`🌿 Новая грядка куплена! Теперь у вас ${state.plotCount} грядок.`, 'mutation-notif');
}

// =============================================
//  Инвентарь UI
// =============================================
function renderInventoryUI() {
  renderInventory(state.inventory, activeEvent, {
    onItemClick: (idx, item) => {
      const seed = SEEDS[item.seedId];
      notify(`${seed?.emoji} ${seed?.name} ×${item.qty} · 💰${calcSellValue(item, seed, activeEvent)} монет`);
    },
  });
}

function bindInventoryButtons() {
  document.getElementById('sell-all-btn')?.addEventListener('click', sellAllCrops);
  document.getElementById('select-sell-btn')?.addEventListener('click', () => {
    enterSelectMode(); renderInventoryUI();
  });
  document.getElementById('sell-selected-btn')?.addEventListener('click', sellSelected);
  document.getElementById('cancel-select-btn')?.addEventListener('click', () => {
    exitSelectMode(); renderInventoryUI();
  });
}

function sellAllCrops() {
  const cropsOnly = state.inventory.filter(item => item.type === 'crop');
  let totalEarned = 0;

  for (const item of cropsOnly) {
    const seed = SEEDS[item.seedId];
    if (seed) totalEarned += calcSellValue(item, seed, activeEvent);
  }

  if (totalEarned === 0) { notify('Нет урожая для продажи!'); return; }

  state.inventory = state.inventory.filter(item => item.type === 'seed');
  state.money    += totalEarned;

  notify(`💰 Весь урожай продан за 🪙${totalEarned}!`);
  updateMoneyDisplay();
  saveState(state);
  exitSelectMode();
  refreshShopWithEmergencyRule();
  updateBuyPlotBtn();
  renderInventoryUI();
}

function sellSelected() {
  const selected = getSelectedIndices();
  if (selected.size === 0) { notify('Ничего не выбрано!'); return; }

  let totalEarned = 0;
  const indices   = [...selected].sort((a, b) => b - a);

  for (const idx of indices) {
    const item = state.inventory[idx];
    if (!item) continue;
    const seed = SEEDS[item.seedId];
    if (seed) totalEarned += calcSellValue(item, seed, activeEvent);
    state.inventory.splice(idx, 1);
  }

  state.money += totalEarned;
  notify(`💰 Выбранные предметы проданы за 🪙${totalEarned}!`);
  updateMoneyDisplay();
  saveState(state);
  exitSelectMode();
  refreshShopWithEmergencyRule();
  updateBuyPlotBtn();
  renderInventoryUI();
}

// =============================================
//  Магазин UI
// =============================================
function refreshShopWithEmergencyRule() {
  if (shopData?.items) {
    shopData.items = applyEmergencyRule(shopData.items, state.money, state.inventory);
  }
}

function renderShopUI() {
  refreshShopWithEmergencyRule();
  renderShop(shopData?.items || [], state.money, handleBuyFromShop);
}

function handleBuyFromShop(seedId, qty, price) {
  // Проверка монет — ОБЯЗАТЕЛЬНО перед покупкой
  if (state.money < price && price !== 0) {
    notify('💸 Недостаточно монет!');
    return;
  }

  const result = buyFromStock(shopData.items, seedId, qty);
  if (!result.success) {
    notify(`❌ ${result.message}`);
    return;
  }

  state.money    -= result.cost;
  shopData.items  = result.newItems;

  // Обработка мешка семян
  if (result.boughtItem?.type === 'pack') {
    const packDef = result.boughtItem.packDef ?? SEED_PACK_ITEMS[seedId];
    if (packDef) {
      for (let i = 0; i < packDef.seedQty; i++) {
        const sid = getRandomSeedByRarity(packDef.seedRarity);
        state.inventory = addToInventory(state.inventory, sid, 1, 'seed', null, false);
      }
      notify(`🎒 Куплен ${packDef.name} за 🪙${result.cost}!`);
    }
  } else {
    // Обычное семя
    state.inventory = addToInventory(state.inventory, seedId, qty, 'seed', null, false);
    const seed      = SEEDS[seedId];
    notify(`🛒 Куплено ${seed?.emoji} ${seed?.name} за 🪙${result.cost}!`);
  }

  updateMoneyDisplay();
  saveState(state);
  refreshShopWithEmergencyRule();
  updateBuyPlotBtn();
  renderShopUI();
  renderInventoryUI();
}

// =============================================
//  HUD
// =============================================
function updateMoneyDisplay() {
  const moneyEl   = document.getElementById('money-display');
  const premiumEl = document.getElementById('premium-display');
  if (moneyEl)   moneyEl.textContent   = state.money;
  if (premiumEl) premiumEl.textContent = state.premium;
}

// =============================================
//  Уведомления
// =============================================
function notify(message, extraClass = '') {
  const area = document.getElementById('notification-area');
  if (!area) return;

  const el          = document.createElement('div');
  el.className      = `notification ${extraClass}`;
  el.textContent    = message;
  area.appendChild(el);

  setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(-5px)';
    el.style.transition = 'opacity 0.4s, transform 0.4s';
    setTimeout(() => el.remove(), 400);
  }, 3500);

  while (area.children.length > 4) area.firstChild?.remove();
}
