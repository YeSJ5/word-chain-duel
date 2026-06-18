import { invokeLLM } from "./_core/llm";

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates a word submission in the word chain game.
 * Checks:
 * 1. Word is a real English word
 * 2. Word starts with the correct letter (last letter of previous word)
 * 3. Word hasn't been used before in this game
 */
export async function validateWord(
  word: string,
  previousWord: string | null,
  usedWords: string[]
): Promise<ValidationResult> {
  const trimmedWord = word.trim().toLowerCase();

  // Check if word is empty
  if (!trimmedWord) {
    return { isValid: false, reason: "Word cannot be empty" };
  }

  // Check if word has been used before
  if (usedWords.includes(trimmedWord)) {
    return { isValid: false, reason: "This word has already been used in this game" };
  }

  // Check if word starts with correct letter
  if (previousWord) {
    const previousWordLower = previousWord.toLowerCase();
    const lastLetter = previousWordLower[previousWordLower.length - 1];
    const firstLetter = trimmedWord[0];

    if (firstLetter !== lastLetter) {
      return {
        isValid: false,
        reason: `Word must start with "${lastLetter}" (the last letter of "${previousWord}")`,
      };
    }
  }

  // Use LLM to validate if it's a real English word
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            'You are a word validator. Respond with ONLY a JSON object in this format: {"isEnglishWord": true/false, "reason": "explanation if false"}. Do not include any other text.',
        },
        {
          role: "user",
          content: `Is "${trimmedWord}" a valid English word? Respond with JSON only.`,
        },
      ],
    });

    const message = response.choices[0]?.message;
    if (!message || typeof message.content !== 'string') {
      return { isValid: false, reason: "Could not validate word" };
    }

    const result = JSON.parse(message.content);
    if (!result.isEnglishWord) {
      return { isValid: false, reason: result.reason || "Not a valid English word" };
    }

    return { isValid: true };
  } catch (error) {
    console.error("[Word Validation] LLM error:", error);
    return { isValid: false, reason: "Validation service error" };
  }
}
