import { store, todayKey } from "../storage.js";
import { searchOpenFoodFacts } from "../foodApi.js";
import { uid } from "../state.js";

const MEALS = ["Desayuno", "Comida", "Merienda", "Cena", "Otro"];
let currentDate = todayKey();
let searchTimer = null;

export function renderComidas(root) {
  root.innerHTML = `
    <div class="header">
      <h1>Comidas</h1>
      <input type="date" id="date-pick" value="${currentDate}" style="width:auto;background:none;border:none;color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:13px" />
    </div>

    <div class="card">
      <div class="field" style="margin-bottom:8px">
        <input type="text" id="search-input" placeholder="Buscar alimento (ej. pechuga de pollo)" />
      </div>
      <div id="search-results"></div>
      <button class="btn ghost" id="btn-custom">+ Crear alimento propio</button>
    </div>

    <div id="log-list"></div>
  `;

  root.querySelector("#date-pick").addEventListener("change", (e) => {
    currentDate = e.target.value;
    drawLog();
  });

  const input = root.querySelector("#search-input");
  const resultsBox = root.querySelector("#search-results");

  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      resultsBox.innerHTML = "";
      return;
    }
    resultsBox.innerHTML = `<p class="label">Buscando…</p>`;
    searchTimer = setTimeout(async () => {
      const custom = store.getCustomFoods().filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
      const remote = await searchOpenFoodFacts(q);
      const results = [...custom, ...(remote || [])];

      if (remote === null && custom.length === 0) {
        resultsBox.innerHTML = `<p class="label">No hay conexión para buscar en la base externa. Prueba con un alimento propio.</p>`;
        return;
      }
      if (results.length === 0) {
        resultsBox.innerHTML = `<p class="label">Sin resultados. Puedes crear el alimento como propio.</p>`;
        return;
      }
      resultsBox.innerHTML = results
        .map(
          (f, i) => `
        <div class="food-item" data-i="${i}">
          <span class="name">${escHtml(f.name)}${f.source !== "off" ? ' <span class="tag">propio</span>' : ""}</span>
          <span class="kcal">${f.kcal100} kcal/100g</span>
        </div>`
        )
        .join("");
      resultsBox.querySelectorAll(".food-item").forEach((el) =>
        el.addEventListener("click", () => openQuantityModal(results[+el.dataset.i]))
      );
    }, 400);
  });

  root.querySelector("#btn-custom").addEventListener("click", openCustomFoodModal);

  function drawLog() {
    const entries = store.getLog(currentDate);
    root.querySelector("#date-pick").value = currentDate;

    if (entries.length === 0) {
      root.querySelector("#log-list").innerHTML = `<div class="empty">Todavía no has registrado nada este día.</div>`;
      return;
    }

    const byMeal = MEALS.map((m) => ({ meal: m, items: entries.filter((e) => e.meal === m) })).filter(
      (g) => g.items.length > 0
    );

    root.querySelector("#log-list").innerHTML = byMeal
      .map(
        (g) => `
      <div class="card flat">
        <h3>${g.meal}</h3>
        ${g.items
          .map(
            (e) => `
          <div class="food-item" data-id="${e.id}">
            <span class="name">${escHtml(e.foodName)} <span class="label">· ${e.grams}g</span></span>
            <span class="kcal">${e.kcal} kcal</span>
          </div>`
          )
          .join("")}
      </div>`
      )
      .join("");

    root.querySelectorAll("#log-list .food-item").forEach((el) =>
      el.addEventListener("click", () => {
        if (!confirm("¿Eliminar este registro?")) return;
        const updated = store.getLog(currentDate).filter((e) => e.id !== el.dataset.id);
        store.setLog(currentDate, updated);
        drawLog();
        document.dispatchEvent(new CustomEvent("fitlog:log-changed"));
      })
    );
  }

  function openQuantityModal(food) {
    const modal = buildModal(`
      <h2>${escHtml(food.name)}</h2>
      <div class="field">
        <label>Cantidad (g)</label>
        <input type="number" id="q-grams" value="100" inputmode="decimal" />
      </div>
      <div class="field">
        <label>Comida</label>
        <div class="segmented" id="q-meal">
          ${MEALS.map((m, i) => `<button data-val="${m}" class="${i === 0 ? "active" : ""}">${m}</button>`).join("")}
        </div>
      </div>
      <div id="q-preview" class="label" style="margin:10px 0 16px"></div>
      <button class="btn block" id="q-add">Añadir</button>
    `);

    const gramsInput = modal.querySelector("#q-grams");
    const preview = modal.querySelector("#q-preview");
    const mealBtns = modal.querySelectorAll("#q-meal button");
    mealBtns.forEach((b) =>
      b.addEventListener("click", () => {
        mealBtns.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
      })
    );

    function updatePreview() {
      const g = parseFloat(gramsInput.value) || 0;
      const factor = g / 100;
      preview.textContent = `${Math.round(food.kcal100 * factor)} kcal · P ${Math.round(
        food.protein100 * factor
      )}g · C ${Math.round(food.carbs100 * factor)}g · G ${Math.round(food.fat100 * factor)}g`;
    }
    gramsInput.addEventListener("input", updatePreview);
    updatePreview();

    modal.querySelector("#q-add").addEventListener("click", () => {
      const g = parseFloat(gramsInput.value) || 0;
      if (g <= 0) return;
      const factor = g / 100;
      const entry = {
        id: uid(),
        foodName: food.name,
        grams: g,
        meal: modal.querySelector("#q-meal button.active").dataset.val,
        kcal: Math.round(food.kcal100 * factor),
        protein: Math.round(food.protein100 * factor),
        carbs: Math.round(food.carbs100 * factor),
        fat: Math.round(food.fat100 * factor),
      };
      const entries = store.getLog(currentDate);
      entries.push(entry);
      store.setLog(currentDate, entries);
      closeModal(modal);
      drawLog();
      document.dispatchEvent(new CustomEvent("fitlog:log-changed"));
    });
  }

  function openCustomFoodModal() {
    const modal = buildModal(`
      <h2>Alimento propio</h2>
      <div class="field"><label>Nombre</label><input type="text" id="c-name" placeholder="Batido de proteína" /></div>
      <div class="field"><label>Kcal por 100g</label><input type="number" id="c-kcal" inputmode="decimal" /></div>
      <div class="field"><label>Proteína por 100g (g)</label><input type="number" id="c-pro" inputmode="decimal" /></div>
      <div class="field"><label>Carbohidratos por 100g (g)</label><input type="number" id="c-carb" inputmode="decimal" /></div>
      <div class="field"><label>Grasas por 100g (g)</label><input type="number" id="c-fat" inputmode="decimal" /></div>
      <button class="btn block" id="c-save">Guardar y añadir a comidas</button>
    `);

    modal.querySelector("#c-save").addEventListener("click", () => {
      const name = modal.querySelector("#c-name").value.trim();
      const kcal100 = parseFloat(modal.querySelector("#c-kcal").value) || 0;
      if (!name || !kcal100) {
        alert("Pon al menos nombre y calorías.");
        return;
      }
      const food = {
        id: uid(),
        source: "custom",
        name,
        kcal100,
        protein100: parseFloat(modal.querySelector("#c-pro").value) || 0,
        carbs100: parseFloat(modal.querySelector("#c-carb").value) || 0,
        fat100: parseFloat(modal.querySelector("#c-fat").value) || 0,
      };
      store.addCustomFood(food);
      closeModal(modal);
      openQuantityModal(food);
    });
  }

  drawLog();
}

function buildModal(innerHtml) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `<div class="modal-sheet">${innerHtml}</div>`;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal(backdrop);
  });
  document.body.appendChild(backdrop);
  return backdrop;
}
function closeModal(modal) {
  modal.remove();
}
function escHtml(v) {
  return (v || "").replace(/</g, "&lt;");
}
