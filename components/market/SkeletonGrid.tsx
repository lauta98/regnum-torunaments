function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--dark-card)',
      border: '1px solid var(--dark-border)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Image area */}
      <div style={{ height: 120, background: 'var(--dark-surface)', position: 'relative', overflow: 'hidden' }}>
        <div className="sk-shimmer" />
      </div>
      {/* Content */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="sk-line" style={{ width: '72%', height: 14 }} />
        <div className="sk-line" style={{ width: '48%', height: 11 }} />
        <div className="sk-line" style={{ width: '60%', height: 11 }} />
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--dark-border)' }}>
          <div className="sk-line" style={{ width: '42%', height: 14, marginBottom: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="sk-line" style={{ width: '34%', height: 10 }} />
            <div className="sk-line" style={{ width: '20%', height: 10 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14,
        alignItems: 'stretch',
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <style>{`
        .sk-line {
          border-radius: 6px;
          background: var(--dark-surface);
          position: relative;
          overflow: hidden;
        }
        .sk-line::after,
        .sk-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.055) 50%,
            transparent 100%
          );
          animation: skShimmer 1.6s infinite;
        }
        .sk-shimmer {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .sk-shimmer::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.04) 50%,
            transparent 100%
          );
        }
        @keyframes skShimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
      `}</style>
    </>
  )
}
