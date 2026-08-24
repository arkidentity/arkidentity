'use client';

import { useEffect, useState } from 'react';

/**
 * Spark of the Day — today's conversation-starter from spark.arkidentity.com.
 *
 * Same source of truth as the Daily DNA card: Spark's own
 * /api/question-of-the-day. The question bank is never copied.
 *
 * Ember (#ff5a1f) rather than ARK gold, on purpose — this is a doorway into a
 * separate tool with its own brand, not another ARK resource.
 */

const SPARK_URL = 'https://spark.arkidentity.com';
const API = `${SPARK_URL}/api/question-of-the-day`;
const EMBER = '#ff5a1f';

interface SparkQuestion {
  id: number;
  text: string;
}

/** The visitor's LOCAL date — Spark keys the question off the caller's day. */
function localDateKey(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function SparkOfTheDay() {
  const [question, setQuestion] = useState<SparkQuestion | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}?date=${localDateKey()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { question: SparkQuestion }) => {
        if (!cancelled && data?.question?.text) setQuestion(data.question);
      })
      .catch(() => {
        /* leave null — the section renders its link-only fallback below */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.08em] mb-2">
        Spark of the Day
      </p>
      <a
        href={SPARK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${EMBER}4d`,
        }}
      >
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: EMBER }}
          >
            Start a conversation
          </div>
          <span
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
            style={{ background: EMBER, color: '#0a0a0b' }}
          >
            Open Spark →
          </span>
        </div>
        <div className="px-4 pb-4 text-white/90 font-semibold text-base leading-snug">
          {question
            ? question.text
            : 'Questions that spark real conversations about God.'}
        </div>
      </a>
    </section>
  );
}
