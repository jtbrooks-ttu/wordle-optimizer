import json
import string
import sys

WORD_FILE = "words.txt"          # one 5-letter word per line
OUTPUT_FILE = "word_scores.json"
WORD_LENGTH = 5


def main():
    word_file = sys.argv[1] if len(sys.argv) > 1 else WORD_FILE

    # load all words
    with open(word_file) as f:
        total_word_set = {
            w.strip().lower()
            for w in f
            if len(w.strip()) == WORD_LENGTH and w.strip().isalpha()
        }

    # 2d matrix 26 x 5
    letter_occurances = [[0] * WORD_LENGTH for _ in range(26)]

    # tally occurances of every letter for every position and map them to letter_occurances matrix
    for word in total_word_set:
        for pos, letter in enumerate(word):
            letter_occurances[ord(letter) - ord('a')][pos] += 1

    # using this matrix, create a dictionary that maps all words in set to their score,
    # score = sum of letter scores at respective positions
    word_scores = {
        word: sum(letter_occurances[ord(letter) - ord('a')][pos]
                  for pos, letter in enumerate(word))
        for word in total_word_set
    }

    # find the optimal starting word (highest score; ties broken alphabetically)
    best_start = min(word_scores, key=lambda w: (-word_scores[w], w))

    # save this dictionary to a file to be loaded easily
    output = {
        "best_start": best_start,
        "best_score": word_scores[best_start],
        "scores": word_scores,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2, sort_keys=True)

    print(f"Scored {len(word_scores)} words -> {OUTPUT_FILE}")
    print(f"Best starting word: {best_start} ({word_scores[best_start]})")


def load_scores(path=OUTPUT_FILE):
    """Load the saved data. Returns (best_start, scores_dict)."""
    with open(path) as f:
        data = json.load(f)
    return data["best_start"], data["scores"]


if __name__ == "__main__":
    main()