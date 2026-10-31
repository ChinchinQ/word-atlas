import type { WordAssessment } from "./types";

/** Initial UX heuristics, not validated language-learning thresholds. */
export const WORD_CORRECT_SCORE = 60;
export const ROUND_PASS_PERCENT = 60;

export type WordStatus = "correct" | "low" | "omitted" | "unassessed";

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*(?:-[\p{L}\p{N}]+)*/gu;

export function tokenizeReference(text: string): string[] {
  return text.match(WORD_PATTERN) ?? [];
}

export function wordStatus(word: WordAssessment): WordStatus {
  if (word.errorType === "Omission") return "omitted";
  if (word.accuracyScore === undefined || !Number.isFinite(word.accuracyScore))
    return "unassessed";
  if (word.errorType !== undefined && word.errorType !== "None") return "low";
  return word.accuracyScore >= WORD_CORRECT_SCORE ? "correct" : "low";
}

export interface RoundScore {
  correct: number;
  total: number;
  percent: number;
  computable: boolean;
  passed: boolean;
}

export function roundScore(words: WordAssessment[]): RoundScore {
  const referenceWords = words.filter(
    (word) =>
      word.errorType !== "Insertion" &&
      tokenizeReference(word.referenceWord).length > 0,
  );
  const total = referenceWords.length;
  const correct = referenceWords.filter(
    (word) => wordStatus(word) === "correct",
  ).length;
  if (total === 0)
    return {
      correct: 0,
      total: 0,
      percent: 0,
      computable: false,
      passed: false,
    };
  const percent = Math.round((correct / total) * 100);
  return {
    correct,
    total,
    percent,
    computable: true,
    passed: percent >= ROUND_PASS_PERCENT,
  };
}
