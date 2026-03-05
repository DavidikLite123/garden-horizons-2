// =============================================
//  GARDEN HORIZONS 2 — Временны́е события (МСК UTC+3)
// =============================================

export const MSK_OFFSET_HOURS = 3; // UTC+3

export const TIME_EVENTS = {
  solarDawn: {
    id: 'solarDawn',
    name: '☀️ Солнечная Заря',
    emoji: '🌅',
    startHour: 6,
    endHour: 9,
    description: 'Растения заряжаются солнцем! Цена продажи ×3.',
    overlayClass: 'solar-dawn',
    skyClass: 'solar-dawn',
    priceMultiplier: 3,
    badgeText: '☀️ Заря ×3',
  },
  morningDew: {
    id: 'morningDew',
    name: '🌿 Утренняя Роса',
    emoji: '💧',
    startHour: 9,
    endHour: 11,
    description: 'Влажное утро ускоряет рост! Время роста −20%.',
    overlayClass: 'morning-dew',
    skyClass: '',
    priceMultiplier: 1,
    growSpeedBonus: 0.8,
    badgeText: '💧 Роса ×0.8⏱',
  },
};

/**
 * Получить текущее московское время.
 */
export function getMoscowTime() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const mskDate = new Date(utcMs + MSK_OFFSET_HOURS * 3600000);

  return {
    hour: mskDate.getHours(),
    minute: mskDate.getMinutes(),
    second: mskDate.getSeconds(),
    timeStr: mskDate.toTimeString().slice(0, 5) + ' МСК',
    full: mskDate,
  };
}

/**
 * Получить текущее активное событие или null.
 */
export function getActiveEvent() {
  const { hour } = getMoscowTime();
  for (const event of Object.values(TIME_EVENTS)) {
    if (hour >= event.startHour && hour < event.endHour) {
      return event;
    }
  }
  return null;
}

/**
 * Менеджер времени — тикает каждую секунду.
 */
export class TimeManager {
  constructor() {
    this._callbacks = [];
    this._currentEvent = null;
    this._interval = null;
  }

  start() {
    this._tick();
    this._interval = setInterval(() => this._tick(), 1000);
  }

  stop() {
    if (this._interval) clearInterval(this._interval);
  }

  onTick(callback) {
    this._callbacks.push(callback);
  }

  _tick() {
    const msk = getMoscowTime();
    const event = getActiveEvent();
    const eventChanged = (event?.id ?? null) !== (this._currentEvent?.id ?? null);
    this._currentEvent = event;

    for (const cb of this._callbacks) {
      cb({ msk, event, eventChanged });
    }
  }

  getCurrentEvent() {
    return this._currentEvent;
  }
}
