const GrainOverlay = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9998,
    pointerEvents: 'none',
    opacity: 0.04,
  }}>
    <svg width="100%" height="100%">
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity="1" />
    </svg>
  </div>
)

export default GrainOverlay
