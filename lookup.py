import json

WORD_FILE = "words.txt"
SCORE_FILE = "word_scores.json"
WORD_LENGTH = 5
MAX_GUESSES = 6


def matches(word, guess, feedback):
    """Return True if `word` is still possible given `guess` and its feedback.

    feedback is a 5-char string: g = green, y = yellow, x = gray.
    """
    for i, (letter, color) in enumerate(zip(guess, feedback)):
        if color == "g":
            # Green -> eliminate all words without letter l in position p
            if word[i] != letter:
                return False
        else:
            # Yellow or gray -> the letter is NOT in this position
            if word[i] == letter:
                return False

    for letter in set(guess):
        colors = [c for l, c in zip(guess, feedback) if l == letter]
        min_count = sum(c in "gy" for c in colors)
        if "x" in colors:
            # Gray -> word has no more of this letter than were marked green/yellow
            # (for a plain gray letter, min_count is 0, so the word can't contain it)
            if word.count(letter) != min_count:
                return False
        else:
            # Yellow -> word must contain the letter (at least as many times as marked)
            if word.count(letter) < min_count:
                return False
    return True


def best_word(candidates, scores):
    """Highest-scoring remaining word (ties broken alphabetically)."""
    return min(candidates, key=lambda w: (-scores.get(w, 0), w))


def read_guess(suggestion):
    while True:
        guess = input(f"Word you guessed [Enter = {suggestion}]: ").strip().lower()
        if not guess:
            return suggestion
        if len(guess) == WORD_LENGTH and guess.isalpha():
            return guess
        print(f"  Please enter a {WORD_LENGTH}-letter word.")


def read_feedback():
    while True:
        fb = input("Colors (g=green, y=yellow, x=gray, e.g. xgyxx): ").strip().lower()
        if len(fb) == WORD_LENGTH and all(c in "gyx" for c in fb):
            return fb
        print(f"  Please enter exactly {WORD_LENGTH} characters using only g, y, x.")


def main():
    # load words from words.txt
    with open(WORD_FILE) as f:
        words = {
            w.strip().lower()
            for w in f
            if len(w.strip()) == WORD_LENGTH and w.strip().isalpha()
        }

    # load dictionary of scores
    with open(SCORE_FILE) as f:
        data = json.load(f)
    scores = data["scores"]

    # extract starting word
    suggestion = data["best_start"]

    for turn in range(1, MAX_GUESSES + 1):
        print(f"\nGuess {turn}/{MAX_GUESSES} - suggested word: {suggestion.upper()}"
              f"  ({len(words)} possible words left)")

        # user makes the guess; program accepts positional information
        guess = read_guess(suggestion)
        feedback = read_feedback()

        # if win then done
        if feedback == "g" * WORD_LENGTH:
            print(f"\nSolved in {turn} guess{'es' if turn > 1 else ''}!")
            return

        # refine the word set using green / yellow / gray rules
        words = {w for w in words if matches(w, guess, feedback)}

        if not words:
            print("\nNo words left that match - check the colors you entered "
                  "or whether the answer is in words.txt.")
            return

        # if 6th guess, done
        if turn == MAX_GUESSES:
            print("\nOut of guesses. Remaining possibilities:")
            print(", ".join(sorted(words)))
            return

        # otherwise, loop back with new refined word set
        suggestion = best_word(words, scores)


if __name__ == "__main__":
    main()