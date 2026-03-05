// =============================================
//  GARDEN HORIZONS 2 — Game State & Persistence
// =============================================

const SAVE_KEYS = {
  money:     'gh2_money',
  premium:   'gh2_premium',
  inventory: 'gh2_inventory',
  garden:    'gh2_garden',
  plotCount: 'gh2_plot_count',
};

// Plot expansion cost formula: 80 * 2^(plotCount - 4)
// Plot 5 = 80, Plot 6 = 160, Plot 7 = 320, Plot 8 = 640, Plot 9 = 1280
export const PLOT_COSTS = {
  5: 80,
  6: 160,
  7: 320,
  8: 640,
  9: 1280,
};
export const MAX_PLOTS = 9;

function makeEmptyPlot(id) {
  return { id, seedId: null, plantedAt: null, mutation: null, stage: 0, harvesting: false, growFraction: 0 };
}

const DEFAULT_GARDEN = [0, 1, 2, 3].map(makeEmptyPlot);

const DEFAULT_STATE = {
  money:     50,
  premium:   0,
  plotCount: 4,
  inventory: [],
  garden:    DEFAULT_GARDEN,
};

/**
 * Load game state from localStorage.
 */
export function loadState() {
  try {
    const money     = parseFloat(localStorage.getItem(SAVE_KEYS.money)     ?? DEFAULT_STATE.money);
    const premium   = parseFloat(localStorage.getItem(SAVE_KEYS.premium)   ?? DEFAULT_STATE.premium);
    const plotCount = parseInt(localStorage.getItem(SAVE_KEYS.plotCount)   ?? DEFAULT_STATE.plotCount, 10);
    const inventory = JSON.parse(localStorage.getItem(SAVE_KEYS.inventory) || 'null') ?? DEFAULT_STATE.inventory;
    const garden    = JSON.parse(localStorage.getItem(SAVE_KEYS.garden)    || 'null') ?? DEFAULT_STATE.garden;

    const validPlotCount = (isNaN(plotCount) || plotCount < 4) ? 4 : Math.min(plotCount, MAX_PLOTS);

    // Ensure garden has exactly plotCount plots
    let validGarden = Array.isArray(garden) ? garden : [];
    while (validGarden.length < validPlotCount) {
      validGarden.push(makeEmptyPlot(validGarden.length));
    }
    validGarden = validGarden.slice(0, validPlotCount);

    return {
      money:     isNaN(money)   ? DEFAULT_STATE.money   : money,
      premium:   isNaN(premium) ? 0                     : premium,
      plotCount: validPlotCount,
      inventory: Array.isArray(inventory) ? inventory : DEFAULT_STATE.inventory,
      garden:    validGarden,
    };
  } catch {
    return { ...DEFAULT_STATE, garden: DEFAULT_GARDEN.map(p => ({ ...p })) };
  }
}

/**
 * Save full game state to localStorage.
 */
export function saveState(state) {
  localStorage.setItem(SAVE_KEYS.money,     state.money.toString());
  localStorage.setItem(SAVE_KEYS.premium,   state.premium.toString());
  localStorage.setItem(SAVE_KEYS.plotCount, state.plotCount.toString());
  localStorage.setItem(SAVE_KEYS.inventory, JSON.stringify(state.inventory));
  localStorage.setItem(SAVE_KEYS.garden,    JSON.stringify(state.garden));
}

/**
 * Expand the garden by one plot. Returns new state or null if maxed out.
 */
export function expandGarden(state) {
  const nextCount = state.plotCount + 1;
  if (nextCount > MAX_PLOTS) return null;

  const cost = PLOT_COSTS[nextCount];
  if (state.money < cost) return null;

  const newGarden = [...state.garden, makeEmptyPlot(state.plotCount)];

  return {
    ...state,
    money:     state.money - cost,
    plotCount: nextCount,
    garden:    newGarden,
  };
}

/**
 * Cost for the next plot expansion.
 */
export function getNextPlotCost(plotCount) {
  const nextCount = plotCount + 1;
  return PLOT_COSTS[nextCount] ?? null;
}

/**
 * Add items to inventory.
 */
export function addToInventory(inventory, seedId, qty, type = 'seed', mutation = null, isSolar = false) {
  const newInventory = [...inventory];

  const existingIdx = newInventory.findIndex(
    item => item.seedId === seedId && item.type === type && item.mutation === mutation && item.isSolar === isSolar
  );

  if (existingIdx !== -1) {
    newInventory[existingIdx] = {
      ...newInventory[existingIdx],
      qty: newInventory[existingIdx].qty + qty,
    };
  } else {
    newInventory.push({ seedId, qty, type, mutation, isSolar });
  }

  return newInventory;
}

/**
 * Remove items from inventory by index.
 */
export function removeFromInventory(inventory, idx, qty) {
  const newInventory = [...inventory];
  if (idx < 0 || idx >= newInventory.length) return newInventory;

  newInventory[idx] = { ...newInventory[idx], qty: newInventory[idx].qty - qty };
  return newInventory.filter(item => item.qty > 0);
}

/**
 * Calculate sell value of an inventory item.
 */
export function calcSellValue(item, seed, activeEvent) {
  if (!seed) return 0;
  let price = seed.sellPrice;

  if (item.mutation === 'solar' || item.isSolar) {
    price *= 3;
  }
  if (activeEvent?.id === 'solarDawn' && item.type === 'crop') {
    if (item.mutation !== 'solar' && !item.isSolar) {
      price *= activeEvent.priceMultiplier;
    }
  }

  return price * item.qty;
}
