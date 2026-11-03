// Popup UI. The game state (list of guesses + feedback) is kept in
// browser.storage.local because Firefox closes the popup whenever you click
// back into the page to type your guess.

const api = typeof browser !== "undefined" ? browser : chrome;
const NEXT_COLOR = { x: "y", y: "g", g: "x" };

let data;           // { best_start, scores }
let allWords;       // every word in the score table
let history = [];   // [{ guess, feedback }]
let feedback = "xxxxx";

const $ = (id) => document.getElementById(id);

function tile(letter, color) {
  const el = document.createElement("div");
  el.className = `tile ${letter ? color : "empty"}`;
  el.textContent = letter || "";
  return el;
}

function currentGuess() {
  return $("guess").value.trim().toLowerCase();
}

function renderTiles() {
  const guess = currentGuess();
  const row = $("tiles");
  row.replaceChildren();
  for (let i = 0; i < WORD_LENGTH; i++) {
    const el = tile(guess[i], feedback[i]);
    el.addEventListener("click", () => {
      feedback = feedback.slice(0, i) + NEXT_COLOR[feedback[i]] + feedback.slice(i + 1);
      renderTiles();
    });
    row.appendChild(el);
  }
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
    message = `Solved in ${history.length} guess${history.length > 1 ? "es" : ""}!`;
  } else if (history.length && candidates.length === 0) {
    message = "No words left that match — check the colors you entered, " +
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
    `Guess ${turn}/${MAX_GUESSES} — ${candidates.length} possible word${candidates.length === 1 ? "" : "s"} left`;
  $("suggestion").textContent = suggestion;
  $("guess").value = suggestion;
  $("error").textContent = "";
  feedback = "xxxxx";
  renderTiles();
}

async function save() {
  await api.storage.local.set({ history });
}

async function submit() {
  const guess = currentGuess();
  if (guess.length !== WORD_LENGTH || !/^[a-z]+$/.test(guess)) {
    $("error").textContent = `Please enter a ${WORD_LENGTH}-letter word.`;
    return;
  }
  history.push({ guess, feedback });
  await save();
  render();
}

async function reset() {
  history = [];
  await save();
  render();
}

async function init() {
  const res = await fetch(api.runtime.getURL("word_scores.json"));
  data = await res.json();
  allWords = Object.keys(data.scores);

  const stored = await api.storage.local.get("history");
  history = Array.isArray(stored.history) ? stored.history : [];

  $("guess").addEventListener("input", () => {
    $("error").textContent = "";
    renderTiles();
  });
  $("guess").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
  $("submit").addEventListener("click", submit);
  $("reset").addEventListener("click", reset);

  render();
  $("guess").select();
}

init();
