export default function FeatureList({ bullets }: { bullets: string[] }) {
  return (
    <ul style={{ display: 'grid', gap: 12, listStyle: 'disc', paddingLeft: 18, margin: 0 }}>
      {bullets.map((b) => (
        <li key={b} style={{ color: '#000000', textAlign: 'left' }}>{b}</li>
      ))}
    </ul>
  )
}

