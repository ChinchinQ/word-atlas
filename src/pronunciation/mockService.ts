import { tokenizeReference } from "./scoring";
import type {
  PhonemeAssessment,
  PronunciationAssessment,
  PronunciationService,
  WordAssessment,
} from "./types";

export type MockScenario = "pass" | "retry" | "missing" | "error";

const MOCK_PHONEMES = ["ə", "n", "t", "ɪ", "s", "k"];

function mockPhonemes(word: string, baseScore: number): PhonemeAssessment[] {
  const count = Math.min(
    4,
    Math.max(1, Math.ceil(Array.from(word).length / 3)),
  );
  return Array.from({ length: count }, (_, index) => ({
    phoneme: MOCK_PHONEMES[(word.length + index) % MOCK_PHONEMES.length],
    accuracyScore: Math.max(0, Math.min(100, baseScore - index * 4)),
  }));
}

function mockWord(
  referenceWord: string,
  index: number,
  scenario: Exclude<MockScenario, "error">,
): WordAssessment {
  if (scenario === "missing" && index % 3 === 1)
    return { referenceWord, errorType: "Unknown" };

  if (scenario === "retry") {
    if (index % 4 === 1)
      return {
        referenceWord,
        accuracyScore: 0,
        errorType: "Omission",
        phonemes: [],
      };
    const correct = index % 3 === 0;
    const score = correct ? 82 + (index % 12) : 38 + (index % 16);
    return {
      referenceWord,
      accuracyScore: score,
      errorType: correct ? "None" : "Mispronunciation",
      phonemes: mockPhonemes(referenceWord, score),
    };
  }

  const low = index % 5 === 3;
  const omitted = scenario === "pass" && index > 4 && index % 7 === 6;
  if (omitted)
    return {
      referenceWord,
      accuracyScore: 0,
      errorType: "Omission",
      phonemes: [],
    };
  const score = low ? 44 : 82 + (index % 15);
  return {
    referenceWord,
    accuracyScore: score,
    errorType: low ? "Mispronunciation" : "None",
    phonemes: mockPhonemes(referenceWord, score),
  };
}

function resultFor(
  referenceText: string,
  scenario: Exclude<MockScenario, "error">,
): PronunciationAssessment {
  const words = tokenizeReference(referenceText).map((word, index) =>
    mockWord(word, index, scenario),
  );
  const missing = scenario === "missing";
  return {
    referenceText,
    recognizedText: referenceText,
    scores: {
      overall: missing ? undefined : scenario === "pass" ? 78 : 48,
      accuracy:
        scenario === "pass" ? 76 : scenario === "retry" ? 43 : undefined,
      fluency: missing ? 71 : scenario === "pass" ? 82 : 55,
      completeness:
        scenario === "pass" ? 88 : scenario === "retry" ? 62 : undefined,
    },
    words,
  };
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Assessment cancelled", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Assessment cancelled", "AbortError"));
      },
      { once: true },
    );
  });
}

export function createMockPronunciationService(
  scenario: MockScenario,
): PronunciationService {
  return {
    async assess({ referenceText, signal }) {
      await wait(850, signal);
      if (scenario === "error")
        throw new Error("Mock 服务暂时无法完成评测，请重试。");
      return resultFor(referenceText, scenario);
    },
  };
}
