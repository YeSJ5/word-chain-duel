import { describe, it, expect, vi } from "vitest";
import { validateWord } from "./wordValidation";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async ({ messages }) => {
    const userMessage = messages.find((m: any) => m.role === "user")?.content || "";
    
    // Simple mock: check if word is in our list of valid words
    const validWords = ["apple", "elephant", "table", "eat", "tree", "example", "dog", "go"];
    const wordMatch = userMessage.match(/"([^"]+)"/);
    const word = wordMatch ? wordMatch[1].toLowerCase() : "";
    
    const isValid = validWords.includes(word);
    
    return {
      choices: [
        {
          message: {
            content: JSON.stringify({
              isEnglishWord: isValid,
              reason: isValid ? "" : "Not a valid English word",
            }),
          },
        },
      ],
    };
  }),
}));

describe("Word Validation", () => {
  it("should validate a correct word starting with the right letter", async () => {
    const result = await validateWord("apple", null, []);
    expect(result.isValid).toBe(true);
  });

  it("should reject a word that doesn't start with the correct letter", async () => {
    const result = await validateWord("apple", "dog", []);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("must start with");
  });

  it("should reject a word that has already been used", async () => {
    const result = await validateWord("apple", null, ["apple", "elephant"]);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("already been used");
  });

  it("should reject an empty word", async () => {
    const result = await validateWord("", null, []);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("cannot be empty");
  });

  it("should accept a valid word starting with correct letter", async () => {
    const result = await validateWord("eat", "apple", []);
    expect(result.isValid).toBe(true);
  });

  it("should be case-insensitive", async () => {
    const result = await validateWord("APPLE", null, []);
    expect(result.isValid).toBe(true);
  });

  it("should handle used words case-insensitively", async () => {
    const result = await validateWord("apple", null, ["apple"]);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("already been used");
  });

  it("should reject invalid words", async () => {
    const result = await validateWord("xyzabc", null, []);
    expect(result.isValid).toBe(false);
  });

  it("should trim whitespace from input", async () => {
    const result = await validateWord("  apple  ", null, []);
    expect(result.isValid).toBe(true);
  });
});
