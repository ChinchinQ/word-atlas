import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ROUND_PASS_PERCENT,
  WORD_CORRECT_SCORE,
  roundScore,
  tokenizeReference,
  wordStatus,
} from "./scoring";

test("keeps contractions and hyphenated words while removing punctuation", () => {
  assert.deepEqual(tokenizeReference("I'm sure we don't need a check-in."), [
    "I'm",
    "sure",
    "we",
    "don't",
    "need",
    "a",
    "check-in",
  ]);
  assert.deepEqual(tokenizeReference("“Hello,” she said…"), [
    "Hello",
    "she",
    "said",
  ]);
});

test("distinguishes low accuracy, omissions, and missing assessment data", () => {
  assert.equal(
    wordStatus({
      referenceWord: "clear",
      accuracyScore: WORD_CORRECT_SCORE,
      errorType: "None",
    }),
    "correct",
  );
  assert.equal(
    wordStatus({
      referenceWord: "quiet",
      accuracyScore: WORD_CORRECT_SCORE - 1,
      errorType: "None",
    }),
    "low",
  );
  assert.equal(
    wordStatus({
      referenceWord: "word",
      accuracyScore: 0,
      errorType: "Omission",
    }),
    "omitted",
  );
  assert.equal(
    wordStatus({ referenceWord: "unknown", errorType: "Unknown" }),
    "unassessed",
  );
});

test("calculates the heuristic pass percentage and ignores inserted words", () => {
  const score = roundScore([
    { referenceWord: "one", accuracyScore: 90, errorType: "None" },
    { referenceWord: "two", accuracyScore: 80, errorType: "None" },
    {
      referenceWord: "three",
      accuracyScore: 20,
      errorType: "Mispronunciation",
    },
    { referenceWord: "extra", accuracyScore: 99, errorType: "Insertion" },
  ]);
  assert.deepEqual(score, {
    correct: 2,
    total: 3,
    percent: 67,
    computable: true,
    passed: 67 >= ROUND_PASS_PERCENT,
  });
});

test("handles zero valid reference words without NaN, Infinity, or passing", () => {
  assert.deepEqual(roundScore([]), {
    correct: 0,
    total: 0,
    percent: 0,
    computable: false,
    passed: false,
  });
  assert.deepEqual(
    roundScore([
      { referenceWord: "...", accuracyScore: 100, errorType: "None" },
    ]),
    {
      correct: 0,
      total: 0,
      percent: 0,
      computable: false,
      passed: false,
    },
  );
});
