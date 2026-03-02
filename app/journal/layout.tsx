// Force dynamic rendering for journal pages (requires auth context)
export const dynamic = 'force-dynamic';

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
