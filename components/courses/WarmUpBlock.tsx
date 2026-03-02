'use client';

interface WarmUpBlockProps {
  questions: string[];
}

export function WarmUpBlock({ questions }: WarmUpBlockProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="warmup-section">
      <h3>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Warm Up
      </h3>
      <ul className="warmup-questions">
        {questions.map((question, i) => (
          <li key={i}>{question}</li>
        ))}
      </ul>

      <style jsx>{`
        .warmup-section {
          background: #2E7D5E;
          border-radius: 8px;
          padding: 20px 24px;
          margin-bottom: 32px;
        }
        .warmup-section h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--course-accent, #D4A853);
          margin: 0 0 10px 0;
        }
        .warmup-questions {
          margin: 0;
          padding-left: 20px;
          color: #FFFFFF;
        }
        .warmup-questions li {
          margin-bottom: 8px;
          font-size: 1rem;
          line-height: 1.6;
        }
        .warmup-questions li:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
