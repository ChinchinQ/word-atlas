import { CircleCheck, CircleHelp, CircleX, MinusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  roundScore,
  wordStatus,
  type WordStatus,
} from "../pronunciation/scoring";
import type { PronunciationAssessment } from "../pronunciation/types";

const STATUS_COPY: Record<WordStatus, string> = {
  correct: "读得清楚",
  low: "准确度较低",
  omitted: "遗漏",
  unassessed: "无评测数据",
};

const STATUS_ICON = {
  correct: CircleCheck,
  low: CircleX,
  omitted: MinusCircle,
  unassessed: CircleHelp,
} satisfies Record<WordStatus, typeof CircleCheck>;

function scoreText(score: number | undefined) {
  return score === undefined || !Number.isFinite(score)
    ? "—"
    : String(Math.round(score));
}

export function PronunciationFeedback({
  assessment,
}: {
  assessment: PronunciationAssessment;
}) {
  const [selected, setSelected] = useState(0);
  const progress = useMemo(
    () => roundScore(assessment.words),
    [assessment.words],
  );
  const word = assessment.words[selected];

  useEffect(() => setSelected(0), [assessment]);

  const scores = [
    ["总分", assessment.scores.overall],
    ["准确度", assessment.scores.accuracy],
    ["流利度", assessment.scores.fluency],
    ["完整度", assessment.scores.completeness],
  ] as const;

  return (
    <section
      className="pronunciation-feedback"
      aria-labelledby="pronunciation-result-title"
    >
      <div className="repeat-result-head">
        <div>
          <p className="eyebrow" id="pronunciation-result-title">
            Mock 评测结果
          </p>
          <h2>
            {progress.computable
              ? `读对 ${progress.correct}/${progress.total} 个词 · ${progress.percent}%`
              : "无法计算通关率"}
          </h2>
        </div>
        <span className={`repeat-pass ${progress.passed ? "is-pass" : ""}`}>
          {progress.passed ? "达到练习目标" : "建议再读一次"}
        </span>
      </div>

      <p className="mock-disclaimer">
        演示分数和音素仅用于确认界面，不代表真实发音评测。60%
        是可调整的初始练习规则。
      </p>

      <dl className="pronunciation-scores">
        {scores.map(([label, score]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{scoreText(score)}</dd>
          </div>
        ))}
      </dl>

      <div className="word-assessments" aria-label="单词发音反馈">
        {assessment.words.map((item, index) => {
          const status = wordStatus(item);
          const Icon = STATUS_ICON[status];
          return (
            <button
              key={`${item.referenceWord}-${index}`}
              className={`word-assessment is-${status} ${selected === index ? "is-selected" : ""}`}
              onClick={() => setSelected(index)}
              aria-pressed={selected === index}
              aria-label={`${item.referenceWord}，${STATUS_COPY[status]}，分数 ${scoreText(item.accuracyScore)}`}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{item.referenceWord}</span>
              <small>{scoreText(item.accuracyScore)}</small>
            </button>
          );
        })}
      </div>

      {word ? (
        <div className="phoneme-panel">
          <div>
            <p className="eyebrow">所选单词</p>
            <h3 lang="en">{word.referenceWord}</h3>
            <p className={`word-status-label is-${wordStatus(word)}`}>
              {STATUS_COPY[wordStatus(word)]}
            </p>
          </div>
          <div
            className="phoneme-list"
            aria-label={`${word.referenceWord} 的 Mock 音素`}
          >
            {word.phonemes?.length ? (
              word.phonemes.map((phoneme, index) => (
                <span key={`${phoneme.phoneme}-${index}`}>
                  /{phoneme.phoneme}/ <b>{scoreText(phoneme.accuracyScore)}</b>
                </span>
              ))
            ) : (
              <p className="muted">暂无音素数据</p>
            )}
          </div>
        </div>
      ) : (
        <p className="empty-note">没有可显示的单词评测数据。</p>
      )}
    </section>
  );
}
