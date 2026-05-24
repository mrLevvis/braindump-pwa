import { BrainDumpDashboard } from './features/braindump/views/BrainDumpDashboard';

const MESH_BLOBS = [
  { color: '#7c3aed', top: '8%',  left: '10%', animation: 'blob-drift-1 52s ease-in-out infinite', opacity: 0.75 },
  { color: '#ec4899', top: '55%', left: '60%', animation: 'blob-drift-2 44s ease-in-out infinite', opacity: 0.70 },
  { color: '#06b6d4', top: '72%', left: '18%', animation: 'blob-drift-3 60s ease-in-out infinite', opacity: 0.65 },
  { color: '#a3e635', top: '18%', left: '68%', animation: 'blob-drift-4 48s ease-in-out infinite', opacity: 0.60 },
] as const;

function App() {
  return (
    <>
      {/* Animated vivid mesh background — aria-hidden so screen readers skip decorative blobs */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', background: '#0a0014' }}
      >
        {MESH_BLOBS.map((blob, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '640px',
              height: '640px',
              borderRadius: '50%',
              background: blob.color,
              top: blob.top,
              left: blob.left,
              filter: 'blur(120px)',
              opacity: blob.opacity,
              animation: blob.animation,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      <BrainDumpDashboard />
    </>
  );
}

export default App;