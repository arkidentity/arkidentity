// Shows the instant a tab is tapped while the server gathers the page, so the
// app never looks frozen. Also lets the tab bar prefetch screens ahead of time.
export default function Loading() {
  const bar = (w: string) => <div className="h-4 rounded bg-[#ebe6dd] animate-pulse" style={{ width: w }} />;
  return (
    <div style={{ background: '#f8f6f2', minHeight: '100dvh' }} aria-busy="true" aria-label="Loading">
      <div className="max-w-xl mx-auto px-4 pt-8 space-y-4">
        <div className="h-8 w-40 rounded bg-[#ebe6dd] animate-pulse" />
        {bar('60%')}
        <div className="rounded-xl bg-white p-4 space-y-4" style={{ border: '1px solid #e7e2d9' }}>
          {bar('80%')}
          {bar('65%')}
          {bar('72%')}
          {bar('55%')}
        </div>
      </div>
    </div>
  );
}
