// quiz.js
// Place this file in the same folder as index.html
// Also place your JSON data file here, named `questions.json`.
// JSON structure: an array of objects with keys:
// id, category, difficulty, type, stem, option_A, option_B, option_C, option_D,
// correct_option, lexicon_terms, role_focus, notes_for_author

const DATA_URL = "questions.json";

let allQuestions = [];
let filteredQuestions = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchQuestions()
    .then(() => {
      initFilters();
      applyFilters();
      initGlobalEvents();
    })
    .catch((err) => {
      console.error("Error initializing quiz:", err);
    });
});

async function fetchQuestions() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) {
      throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
    }
    const data = await res.json();

    // Basic normalization
    allQuestions = (data || [])
      .filter((q) => q && q.stem)
      .map((q, idx) => ({
        ...q,
        id: q.id || `Q_${idx + 1}`,
        category: (q.category || "").toString().trim(),
        difficulty: toDifficultyLabel(q.difficulty),
        type: (q.type || "").toString().trim(),
        stem: q.stem.toString().trim(),
        option_A: (q.option_A || "").toString().trim(),
        option_B: (q.option_B || "").toString().trim(),
        option_C: (q.option_C || "").toString().trim(),
        option_D: (q.option_D || "").toString().trim(),
        correct_option: (q.correct_option || "").toString().trim(),
        lexicon_terms: (q.lexicon_terms || "").toString().trim(),
        role_focus: (q.role_focus || "").toString().trim(),
        notes_for_author: (q.notes_for_author || "").toString().trim(),
      }));

    filteredQuestions = [...allQuestions];
  } catch (err) {
    console.error("Error fetching questions:", err);
    allQuestions = [];
    filteredQuestions = [];
  }
}

function toDifficultyLabel(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) {
    return value.toString().trim();
  }
  if (n <= 1) return "Beginner";
  if (n === 2) return "Intermediate";
  if (n >= 3) return "Advanced";
  return value.toString().trim();
}

function initFilters() {
  const categorySelect = document.getElementById("filter-category");
  const roleSelect = document.getElementById("filter-role");
  const difficultySelect = document.getElementById("filter-difficulty");

  if (!categorySelect || !roleSelect || !difficultySelect) {
    console.warn("Filter elements not found in HTML.");
    return;
  }

  populateSelect(
    categorySelect,
    getUniqueValues(allQuestions, "category"),
    "Category"
  );
  populateSelect(
    roleSelect,
    getUniqueValues(allQuestions, "role_focus"),
    "Role focus"
  );
  populateSelect(
    difficultySelect,
    getUniqueValues(allQuestions, "difficulty"),
    "Difficulty"
  );

  categorySelect.addEventListener("change", applyFilters);
  roleSelect.addEventListener("change", applyFilters);
  difficultySelect.addEventListener("change", applyFilters);

  const searchInput = document.getElementById("search-text");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(applyFilters, 200));
  }

  const resetBtn = document.getElementById("reset-filters");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      categorySelect.value = "";
      roleSelect.value = "";
      difficultySelect.value = "";
      if (searchInput) searchInput.value = "";
      applyFilters();
    });
  }
}

function populateSelect(selectEl, values, label) {
  // Clear current options
  selectEl.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = `All ${label || ""}`.trim();
  selectEl.appendChild(allOption);

  values.forEach((v) => {
    if (!v) return;
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function getUniqueValues(list, key) {
  const set = new Set();
  list.forEach((item) => {
    const val = (item[key] || "").toString().trim();
    if (val) set.add(val);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function applyFilters() {
  const categorySelect = document.getElementById("filter-category");
  const roleSelect = document.getElementById("filter-role");
  const difficultySelect = document.getElementById("filter-difficulty");
  const searchInput = document.getElementById("search-text");

  const category = categorySelect ? categorySelect.value : "";
  const role = roleSelect ? roleSelect.value : "";
  const difficulty = difficultySelect ? difficultySelect.value : "";
  const search = searchInput ? searchInput.value.toLowerCase().trim() : "";

  filteredQuestions = allQuestions.filter((q) => {
    if (category && q.category !== category) return false;
    if (role && q.role_focus !== role) return false;
    if (difficulty && q.difficulty !== difficulty) return false;

    if (search) {
      const searchable = [
        q.stem,
        q.lexicon_terms,
        q.category,
        q.role_focus,
        q.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(search)) return false;
    }

    return true;
  });

  renderQuestions();
}

function renderQuestions() {
  const container = document.getElementById("questions-container");
  const countEl = document.getElementById("question-count");

  if (!container) {
    console.warn("questions-container element not found in HTML.");
    return;
  }

  container.innerHTML = "";

  if (countEl) {
    countEl.textContent = `${filteredQuestions.length} question${
      filteredQuestions.length === 1 ? "" : "s"
    }`;
  }

  if (!filteredQuestions.length) {
    const empty = document.createElement("div");
    empty.className =
      "rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500";
    empty.textContent =
      "No questions match the current filters. Try changing or clearing filters.";
    container.appendChild(empty);
    return;
  }

  filteredQuestions.forEach((q, idx) => {
    const card = document.createElement("article");
    card.className =
      "mb-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm";

    // Header row: ID + tags
    const header = document.createElement("div");
    header.className = "flex flex-wrap items-start justify-between gap-2";

    const idEl = document.createElement("div");
    idEl.className = "text-xs font-mono text-slate-500";
    idEl.textContent = q.id;
    header.appendChild(idEl);

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "flex flex-wrap gap-2 text-xs";

    if (q.category) {
      const chip = createChip(q.category, "bg-sky-50 text-sky-700");
      tagsContainer.appendChild(chip);
    }
    if (q.role_focus) {
      const chip = createChip(q.role_focus, "bg-emerald-50 text-emerald-700");
      tagsContainer.appendChild(chip);
    }
    if (q.difficulty) {
      const chip = createChip(q.difficulty, "bg-amber-50 text-amber-700");
      tagsContainer.appendChild(chip);
    }

    header.appendChild(tagsContainer);
    card.appendChild(header);

    // Stem
    const stemEl = document.createElement("h3");
    stemEl.className = "mt-3 text-sm font-semibold text-slate-900";
    stemEl.textContent = q.stem;
    card.appendChild(stemEl);

    // Lexicon terms (if present)
    if (q.lexicon_terms) {
      const lexEl = document.createElement("div");
      lexEl.className = "mt-1 text-xs text-slate-500";
      lexEl.textContent = `Lexicon: ${q.lexicon_terms}`;
      card.appendChild(lexEl);
    }

    // Options list
    const options = [
      { key: "A", text: q.option_A },
      { key: "B", text: q.option_B },
      { key: "C", text: q.option_C },
      { key: "D", text: q.option_D },
    ].filter((o) => o.text && o.text.trim().length > 0);

    if (options.length) {
      const list = document.createElement("ul");
      list.className = "mt-3 space-y-1 text-sm text-slate-800";

      options.forEach((opt) => {
        const li = document.createElement("li");
        li.className = "flex gap-2";

        const label = document.createElement("span");
        label.className =
          "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-600";
        label.textContent = opt.key;

        const textSpan = document.createElement("span");
        textSpan.textContent = opt.text;

        li.appendChild(label);
        li.appendChild(textSpan);
        list.appendChild(li);
      });

      card.appendChild(list);
    }

    // Answer + author notes
    const answerRow = document.createElement("div");
    answerRow.className = "mt-3 flex flex-wrap items-center justify-between";

    const showBtn = document.createElement("button");
    showBtn.type = "button";
    showBtn.className =
      "text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline";
    showBtn.textContent = "Show answer";
    showBtn.dataset.questionIndex = String(idx);

    const answerBox = document.createElement("div");
    answerBox.className =
      "mt-2 hidden text-xs leading-relaxed text-emerald-800";

    const correctLabel = q.correct_option
      ? q.correct_option.toString().trim().toUpperCase()
      : "";

    let correctText = "";
    if (correctLabel) {
      const map = {
        A: q.option_A,
        B: q.option_B,
        C: q.option_C,
        D: q.option_D,
      };
      correctText = map[correctLabel] || "";
    }

    answerBox.innerHTML = `
      <div><span class="font-semibold">Correct:</span> ${
        correctLabel ? correctLabel + (correctText ? "." : "") : "N/A"
      } ${correctText || ""}</div>
      ${
        q.notes_for_author
          ? `<div class="mt-1 text-[11px] text-emerald-900/80"><span class="font-semibold">Author note:</span> ${escapeHtml(
              q.notes_for_author
            )}</div>`
          : ""
      }
    `;

    answerRow.appendChild(showBtn);
    card.appendChild(answerRow);
    card.appendChild(answerBox);

    container.appendChild(card);
  });
}

function createChip(text, extraClasses) {
  const span = document.createElement("span");
  span.className =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-slate-100 " +
    (extraClasses || "");
  span.textContent = text;
  return span;
}

function initGlobalEvents() {
  const container = document.getElementById("questions-container");
  if (!container) return;

  container.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches("button[data-question-index]")) {
      const card = target.closest("article");
      if (!card) return;
      const answerBox = card.querySelector("div.mt-2");
      if (!answerBox) return;

      const isHidden = answerBox.classList.contains("hidden");
      if (isHidden) {
        answerBox.classList.remove("hidden");
        target.textContent = "Hide answer";
      } else {
        answerBox.classList.add("hidden");
        target.textContent = "Show answer";
      }
    }
  });
}

// Utilities

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn.apply(null, args), delay);
  };
}

function escapeHtml(str) {
  return str
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
