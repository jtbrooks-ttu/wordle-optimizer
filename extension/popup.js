// UI for both the toolbar popup and the sidebar (popup.html?view=sidebar).
// The game state (list of guesses + feedback) is kept in browser.storage.local,
// because Firefox closes the popup whenever you click back into the page, and
// so the popup and sidebar share one game.

const api = typeof browser !== "undefined" ? browser : chrome;
const NEXT_COLOR = { x: "y", y: "g", g: "x" };

let data;           // { best_start, scores }
let allWords;       // every word in the score table
let history = [];   // [{ guess, feedback }]

// Entry row state
let letters = "";      // what's typed in the big tiles
let colors = "xxxxx";  // feedback for each tile
let pristine = true;   // row still shows the untouched suggestion

const $ = (id) => document.getElementById(id);
const isSidebar = new URLSearchParams(location.search).get("view") === "sidebar";

function tile(letter, color) {
  const el = document.createElement("div");
  el.className = `tile ${letter ? color : "empty"}`;
  el.textContent = letter || "";
  return el;
}

function renderTiles() {
  const row = $("tiles");
  row.replaceChildren();
  row.classList.toggle("pristine", pristine);
  for (let i = 0; i < WORD_LENGTH; i++) {
    const el = tile(letters[i], colors[i]);
    if (i === letters.length) el.classList.add("cursor");
    el.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus on the row
    el.addEventListener("click", () => {
      row.focus();
      if (!letters[i]) return;
      pristine = false;
      colors = colors.slice(0, i) + NEXT_COLOR[colors[i]] + colors.slice(i + 1);
      renderTiles();
    });
    row.appendChild(el);
  }
}

function setLetters(next) {
  letters = next;
  // A cleared tile goes back to gray
  colors = colors.slice(0, letters.length) + "x".repeat(WORD_LENGTH - letters.length);
  $("error").textContent = "";
  renderTiles();
}

function typeLetter(ch) {
  if (pristine) {
    // The first keystroke replaces the suggested word
    pristine = false;
    colors = "xxxxx";
    setLetters(ch);
  } else if (letters.length < WORD_LENGTH) {
    setLetters(letters + ch);
  }
}

function onKeyDown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Enter") {
    e.preventDefault();
    submit();
  } else if (e.key === "Backspace") {
    e.preventDefault();
    pristine = false;
    setLetters(letters.slice(0, -1));
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    e.preventDefault();
    typeLetter(e.key.toLowerCase());
  }
}

function onPaste(e) {
  const text = (e.clipboardData.getData("text") || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!text) return;
  e.preventDefault();
  pristine = false;
  colors = "xxxxx";
  setLetters(text.slice(0, WORD_LENGTH));
}

function render() {
  const candidates = remainingWords(allWords, history);
  const turn = history.length + 1;
  const last = history[history.length - 1];
  const solved = last && last.feedback === "g".repeat(WORD_LENGTH);

  // Past guesses
  const board = $("history");
  board.replaceChildren();
  for (const h of history) {
    const row = document.createElement("div");
    row.className = "row";
    for (let i = 0; i < WORD_LENGTH; i++) row.appendChild(tile(h.guess[i], h.feedback[i]));
    board.appendChild(row);
  }

  // Candidate list
  $("cand-count").textContent = candidates.length;
  $("candidates").textContent = [...candidates].sort().join(" ");

  // End states
  let message = null;
  if (solved) {
    message = `Solved in ${history.length} guess${history.length > 1 ? "es" : ""}.`;
  } else if (history.length && candidates.length === 0) {
    message = "No words left that match. Check the colors you entered, " +
              "or the answer isn't in the word list.";
  } else if (history.length >= MAX_GUESSES) {
    message = "Out of guesses. Remaining possibilities:";
  }

  $("entry").hidden = message !== null;
  $("result").hidden = message === null;
  $("candidates-box").hidden = solved;

  if (message !== null) {
    $("result-text").textContent = message;
    const list = $("remaining");
    list.replaceChildren();
    if (!solved && history.length >= MAX_GUESSES) {
      for (const w of [...candidates].sort()) {
        const li = document.createElement("li");
        li.textContent = w;
        list.appendChild(li);
      }
    }
    return;
  }

  const suggestion = history.length ? bestWord(candidates, data.scores) : data.best_start;
  $("status").textContent =
    `Guess ${turn} of ${MAX_GUESSES} · ${candidates.length} possible word${candidates.length === 1 ? "" : "s"}`;
  $("suggestion").textContent = suggestion;
  $("error").textContent = "";
  letters = suggestion;
  colors = "xxxxx";
  pristine = true;
  renderTiles();
  $("tiles").focus();
}

async function save() {
  await api.storage.local.set({ history });
}

async function submit() {
  if (letters.length !== WORD_LENGTH) {
    $("error").textContent = `Type a ${WORD_LENGTH}-letter word first.`;
    return;
  }
  history.push({ guess: letters, feedback: colors });
  await save();
  render();
}

async function reset() {
  history = [];
  await save();
  render();
}

async function openSidebar() {
  // Must run straight from the click so Firefox treats it as a user action
  await api.sidebarAction.open();
  window.close();
}

// Re-render if the other view (popup or sidebar) changed the game
function onStorageChanged(changes, area) {
  if (area !== "local" || !changes.history) return;
  const next = Array.isArray(changes.history.newValue) ? changes.history.newValue : [];
  if (JSON.stringify(next) === JSON.stringify(history)) return;
  history = next;
  render();
}

async function init() {
  if (isSidebar) document.documentElement.classList.add("sidebar");

  const res = await fetch(api.runtime.getURL("word_scores.json"));
  data = await res.json();
  allWords = Object.keys(data.scores);

  const stored = await api.storage.local.get("history");
  history = Array.isArray(stored.history) ? stored.history : [];

  const row = $("tiles");
  row.addEventListener("keydown", onKeyDown);
  row.addEventListener("paste", onPaste);
  $("submit").addEventListener("click", submit);
  $("reset").addEventListener("click", reset);
  if (api.sidebarAction) {
    $("open-sidebar").addEventListener("click", openSidebar);
  } else {
    $("open-sidebar").hidden = true;
  }
  api.storage.onChanged.addListener(onStorageChanged);

  render();
}

init();
