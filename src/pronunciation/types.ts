export type PronunciationErrorType =
  "None" | "Omission" | "Insertion" | "Mispronunciation" | "Unknown";

export interface PhonemeAssessment {
  phoneme: string;
  accuracyScore?: number;
}

export interface WordAssessment {
  referenceWord: string;
  accuracyScore?: number;
  errorType?: PronunciationErrorType;
  phonemes?: PhonemeAssessment[];
}

export interface PronunciationAssessment {
  referenceText: string;
  recognizedText?: string;
  scores: {
    overall?: number;
    accuracy?: number;
    fluency?: number;
    completeness?: number;
  };
  words: WordAssessment[];
}

export interface AssessmentRequest {
  referenceText: string;
  signal?: AbortSignal;
}

export interface PronunciationService {
  assess(request: AssessmentRequest): Promise<PronunciationAssessment>;
}
