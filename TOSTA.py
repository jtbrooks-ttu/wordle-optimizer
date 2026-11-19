"""
TOSTA: The Optimal Solving The wordle Algorithm
================================================

Every five-letter word is a suspect. Each guess turns up clues
(green, yellow, gray), and TOSTA uses them to narrow the lineup
until only the answer is left.

Run it from the folder that holds words.txt:

    python3 TOSTA.py

Clues are typed as five letters: g = green, y = yellow, x = gray.
"""


# ---- CODE SNIPPET 1 of 6 | Step 1: The Suspect List | from score.py ----
# Load every five-letter word from words.txt into a set.
with open("words.txt") as f:
    words = {w.strip().lower() for w in f if len(w.strip()) == 5}


# ---- CODE SNIPPET 2 of 6 | Step 2: Profiling the Suspects | from score.py ----
# Build a 26 x 5 table: how often each letter (row) appears in each position (column).
counts = [[0] * 5 for _ in range(26)]
for word in words:
    for pos, letter in enumerate(word):
        counts[ord(letter) - ord("a")][pos] += 1


# ---- CODE SNIPPET 3 of 6 | Step 3: Ranking the Suspects | from score.py ----
# Score each word by adding up the counts for its letters in their positions.
# The highest-scoring word is the best opening guess (SLATE).
scores = {
    word: sum(counts[ord(letter) - ord("a")][pos]
              for pos, letter in enumerate(word))
    for word in words
}
best_start = max(sorted(scores), key=scores.get)


# ---- CODE SNIPPET 4 of 6 | Step 4, Part 1: Reading the Clues (Positions) | from lookup.py ----
# Could `word` still be the answer, given our guess and the colors we got back?
# Feedback is 5 letters: g = green, y = yellow, x = gray.
def matches(word, guess, feedback):
    for i in range(5):
        # Green: the word must have this letter in this exact spot.
        if feedback[i] == "g" and word[i] != guess[i]:
            return False
        # Yellow or gray: the word must NOT have this letter in this spot.
        if feedback[i] != "g" and word[i] == guess[i]:
            return False

    # ---- CODE SNIPPET 5 of 6 | Step 4, Part 2: Reading the Clues (Letter Counts) | from lookup.py ----
    # (Still inside matches.) Check how many times each guessed letter must appear.
    for letter in set(guess):
        colors = [c for l, c in zip(guess, feedback) if l == letter]
        found = colors.count("g") + colors.count("y")
        # If the letter was also gray, the word has exactly `found` of it (0 = not in the word).
        if "x" in colors and word.count(letter) != found:
            return False
        # Otherwise the word needs at least `found` of it.
        if word.count(letter) < found:
            return False
    return True


# ---- CODE SNIPPET 6 of 6 | Step 5: Narrowing the Lineup | from lookup.py ----
# Pick the highest-scoring suspect still standing.
# Sorting first means ties always go to the alphabetically first word.
def best_word(candidates):
    return max(sorted(candidates), key=scores.get)

# The interrogation: up to 6 guesses.
suggestion = best_start
for turn in range(1, 7):
    print(f"Guess {turn}: try {suggestion.upper()} ({len(words)} suspects left)")
    guess = input("Word you guessed: ").strip().lower()
    feedback = input("Colors (g/y/x): ").strip().lower()
    if feedback == "ggggg":
        print("Case closed!")
        break
    # Keep only the words that fit the clues, then suggest the best one left.
    words = {w for w in words if matches(w, guess, feedback)}
    if not words:
        print("The trail's gone cold: no word fits those clues.")
        break
    suggestion = best_word(words)
else:
    print(f"Out of guesses. Still at large: {', '.join(sorted(words)).upper()}")
