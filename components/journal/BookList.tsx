'use client';

/**
 * BookList - Bible book list with expandable chapter grids
 * Shows NT books first, then OT
 */

import type { BibleBook } from '@/types/journal';

export interface BookListProps {
  /** Books organized by testament */
  books: { nt: BibleBook[]; ot: BibleBook[] };
  /** Currently expanded book ID */
  expandedBook: string | null;
  /** Called when book row is clicked */
  onToggleBook: (bookId: string) => void;
  /** Called when chapter is selected */
  onSelectChapter: (book: BibleBook, chapter: number) => void;
}

export function BookList({
  books,
  expandedBook,
  onToggleBook,
  onSelectChapter,
}: BookListProps) {
  return (
    <div className="overflow-y-auto flex-1">
      {/* New Testament */}
      {books.nt.length > 0 && (
        <>
          <div className="sticky top-0 bg-[var(--ark-navy)] px-4 py-2 text-white/60 text-sm font-medium uppercase tracking-wide border-b border-white/10">
            New Testament
          </div>
          {books.nt.map(book => (
            <BookItem
              key={book.id}
              book={book}
              isExpanded={expandedBook === book.id}
              onToggle={() => onToggleBook(book.id)}
              onSelectChapter={(chapter) => onSelectChapter(book, chapter)}
            />
          ))}
        </>
      )}

      {/* Old Testament */}
      {books.ot.length > 0 && (
        <>
          <div className="sticky top-0 bg-[var(--ark-navy)] px-4 py-2 text-white/60 text-sm font-medium uppercase tracking-wide border-b border-white/10">
            Old Testament
          </div>
          {books.ot.map(book => (
            <BookItem
              key={book.id}
              book={book}
              isExpanded={expandedBook === book.id}
              onToggle={() => onToggleBook(book.id)}
              onSelectChapter={(chapter) => onSelectChapter(book, chapter)}
            />
          ))}
        </>
      )}
    </div>
  );
}

interface BookItemProps {
  book: BibleBook;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectChapter: (chapter: number) => void;
}

function BookItem({ book, isExpanded, onToggle, onSelectChapter }: BookItemProps) {
  // Generate chapter buttons
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className={`border-b border-white/10 ${isExpanded ? 'bg-white/5' : ''}`}>
      {/* Book row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium">{book.name}</span>
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">{book.chapters} ch</span>
          <svg
            className={`w-5 h-5 text-white/60 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 7.5l5 5 5-5" />
          </svg>
        </div>
      </button>

      {/* Chapter grid (expandable) */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-6 gap-2">
            {chapters.map(chapter => (
              <button
                key={chapter}
                type="button"
                onClick={() => onSelectChapter(chapter)}
                className="
                  aspect-square rounded-lg
                  bg-white/10 text-white font-medium
                  hover:bg-[var(--ark-gold)] hover:text-[var(--ark-navy)]
                  transition-colors
                  flex items-center justify-center
                  text-sm
                "
              >
                {chapter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
