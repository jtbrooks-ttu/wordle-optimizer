// Port of the solving logic in lookup.py.
// Feedback is a 5-char string: g = green, y = yellow, x = gray.

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

function countOf(word, letter) {
  let n = 0;
  for (const c of word) if (c === letter) n++;
  return n;
}

/** Return true if `word` is still possible given `guess` and its feedback. */
function matches(word, guess, feedback) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (feedback[i] === "g") {
      // Green -> the letter must be in this position
      if (word[i] !== guess[i]) return false;
    } else if (word[i] === guess[i]) {
      // Yellow or gray -> the letter is NOT in this position
      return false;
    }
  }

  for (const letter of new Set(guess)) {
    const colors = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === letter) colors.push(feedback[i]);
    }
    const minCount = colors.filter((c) => c === "g" || c === "y").length;
    const count = countOf(word, letter);
    if (colors.includes("x")) {
      // Gray -> word has exactly as many of this letter as were marked green/yellow
      if (count !== minCount) return false;
    } else if (count < minCount) {
      // Yellow/green only -> word has at least that many
      return false;
    }
  }
  return true;
}

/** Highest-scoring remaining word (ties broken alphabetically). */
function bestWord(candidates, scores) {
  let best = null;
  for (const w of candidates) {
    if (
      best === null ||
      (scores[w] || 0) > (scores[best] || 0) ||
      ((scores[w] || 0) === (scores[best] || 0) && w < best)
    ) {
      best = w;
    }
  }
  return best;
}

/** Filter the candidate list through every (guess, feedback) pair in history. */
function remainingWords(allWords, history) {
  return allWords.filter((w) =>
    history.every(({ guess, feedback }) => matches(w, guess, feedback))
  );
}

if (typeof module !== "undefined") {
  module.exports = { WORD_LENGTH, MAX_GUESSES, matches, bestWord, remainingWords };
}
