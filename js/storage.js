// Envoltorio simple sobre localStorage. Todo el estado del usuario vive en el propio iPhone.

const KEYS = {
  profile: "fitlog_profile",
  customFoods: "fitlog_custom_foods",
  week: "fitlog_week_plan",
  logPrefix: "fitlog_log_", // + YYYY-MM-DD
  donePrefix: "fitlog_done_", // + YYYY-MM-DD -> boolean
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error leyendo", key, e);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error guardando", key, e);
  }
}

export const store = {
  getProfile() {
    return read(KEYS.profile, null);
  },
  setProfile(profile) {
    write(KEYS.profile, profile);
  },

  getCustomFoods() {
    return read(KEYS.customFoods, []);
  },
  addCustomFood(food) {
    const foods = read(KEYS.customFoods, []);
    foods.unshift(food);
    write(KEYS.customFoods, foods);
  },

  getWeekPlan() {
    return read(KEYS.week, null);
  },
  setWeekPlan(plan) {
    write(KEYS.week, plan);
  },

  getLog(dateKey) {
    return read(KEYS.logPrefix + dateKey, []);
  },
  setLog(dateKey, entries) {
    write(KEYS.logPrefix + dateKey, entries);
  },

  isWorkoutDone(dateKey) {
    return read(KEYS.donePrefix + dateKey, false);
  },
  setWorkoutDone(dateKey, done) {
    write(KEYS.donePrefix + dateKey, done);
  },
};

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// 0 = Lunes ... 6 = Domingo (getDay() de JS usa 0=Domingo, lo convertimos)
export function isoDayIndex(d = new Date()) {
  const jsDay = d.getDay(); // 0 domingo .. 6 sabado
  return jsDay === 0 ? 6 : jsDay - 1;
}
