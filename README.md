# Wordle Optimizer

Suggests the best next Wordle guess. Every word gets a score from how often each
of its letters appears in that position across the word list. After each guess,
words that don't fit the green/yellow/gray feedback are removed, and the
highest-scoring word left is suggested.

## Authorship

- **Algorithm:** designed and written by [jtbrooks-ttu](https://github.com/jtbrooks-ttu).
  This covers the positional letter-frequency scoring (`score.py`) and the
  feedback-filtering solver (`lookup.py`).
- **Implementation help:** Claude (Anthropic) helped build the Firefox extension in
  `extension/`, which is a JavaScript port of the algorithm above with a popup UI.

## Python (command line)

```bash
python3 score.py     # regenerate word_scores.json from words.txt
python3 lookup.py    # play interactively
```

When `lookup.py` asks for colors, type `g` for green, `y` for yellow and `x` for gray (for example `xgyxx`).

## Firefox extension

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…** and select `extension/manifest.json`.
3. Click the toolbar icon. Type the word you guessed, click each tile to set its
   color (gray → yellow → green), and submit.

The extension uses its own copy of `word_scores.json`. If you regenerate the
scores, copy the new file into `extension/`.
