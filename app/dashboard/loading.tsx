/** Shown while any dashboard page loads: the page's shape, shimmering. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="page-head">
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="skeleton" style={{ width: 220, height: 28 }} />
          <div className="skeleton" style={{ width: 320, height: 14 }} />
        </div>
        <div className="skeleton" style={{ width: 130, height: 40 }} />
      </div>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        {[0, 1, 2, 3].map((i) => <div key={i} className="card card-pad" style={{ display: 'grid', gap: 10 }}><div className="skeleton" style={{ width: '50%', height: 12 }} /><div className="skeleton" style={{ width: '70%', height: 26 }} /></div>)}
      </div>
      <div className="grid grid-2">
        {[0, 1].map((i) => (
          <div key={i} className="card card-pad" style={{ display: 'grid', gap: 14 }}>
            <div className="skeleton" style={{ width: '40%', height: 16 }} />
            {[0, 1, 2, 3].map((j) => <div key={j} className="skeleton" style={{ height: 38 }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
