export default function FeatureList({ bullets }: { bullets: string[] }) {
  return (
    <ul style={{ display: 'grid', gap: 10, listStyle: 'none', paddingLeft: 0, margin: 0 }}>
      {bullets.map((b, idx) => (
        <li key={b+idx} style={{ color: '#000000', textAlign: 'left', display:'flex', alignItems:'flex-start', gap:8, fontSize: 16, lineHeight: 1.5 }}>
          <i className="fa-solid fa-circle-check" style={{ color: '#FF3F6C', marginTop: 2 }} />
          <span style={{ fontWeight: 600 }}>{b}</span>
        </li>
      ))}
    </ul>
  )
}

