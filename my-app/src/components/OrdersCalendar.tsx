import { useMemo, useState } from 'react'

function pad(n: number) { return n < 10 ? '0' + n : String(n) }
function fmtYmd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function OrdersCalendar({ markedDates, selected, onSelect }: { markedDates: Set<string> | string[]; selected?: string; onSelect: (date: string | null) => void }) {
  const marked = useMemo(() => markedDates instanceof Set ? markedDates : new Set(markedDates), [markedDates])
  const [monthStart, setMonthStart] = useState(() => { const d = new Date(); d.setDate(1); return d })

  function buildMatrix(d0: Date) {
    const y = d0.getFullYear(); const m = d0.getMonth()
    const firstDow = new Date(y, m, 1).getDay() // 0..6
    const daysInPrev = new Date(y, m, 0).getDate()
    const daysInCurr = new Date(y, m + 1, 0).getDate()
    const cells: { date: Date; inMonth: boolean }[] = []
    // prev tail
    for (let i = firstDow - 1; i >= 0; i--) {
      cells.push({ date: new Date(y, m - 1, daysInPrev - i), inMonth: false })
    }
    // current month
    for (let d = 1; d <= daysInCurr; d++) {
      cells.push({ date: new Date(y, m, d), inMonth: true })
    }
    // next head to fill to 42
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false })
    }
    // ensure 6 rows
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false })
    }
    return cells
  }

  const cells = useMemo(() => buildMatrix(monthStart), [monthStart])

  function gotoMonth(delta: number) {
    setMonthStart(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + delta); d.setDate(1); return d })
  }

  function handleSelect(d: Date) {
    const ymd = fmtYmd(d)
    if (selected === ymd) onSelect(null)
    else onSelect(ymd)
  }

  return (
    <div className="orders-calendar card" style={{ border:'1px solid var(--color-border)', borderRadius: 8, padding: 8, background:'#fff' }}>
      <div className="cal-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6 }}>
        <button className="btn" onClick={() => gotoMonth(-1)} aria-label="Previous month"><span className="fa-solid fa-chevron-left"/></button>
        <div style={{ fontWeight: 800 }}>{MONTHS[monthStart.getMonth()]} {monthStart.getFullYear()}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {selected && <button className="btn" onClick={() => onSelect(null)} title="Clear date">Clear</button>}
          <button className="btn" onClick={() => gotoMonth(1)} aria-label="Next month"><span className="fa-solid fa-chevron-right"/></button>
        </div>
      </div>
      <div className="cal-week" style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4, marginBottom:4 }}>
        {WEEKDAYS.map(w => (<div key={w} className="cal-weekday" style={{ textAlign:'center', fontSize:12, color:'#6b7280', fontWeight:700 }}>{w}</div>))}
      </div>
      <div className="cal-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((c, idx) => {
          const ymd = fmtYmd(c.date)
          const isMarked = marked.has(ymd)
          const isSelected = selected === ymd
          return (
            <button
              key={idx}
              className={`cal-cell${c.inMonth ? '' : ' cal-outside'}${isMarked ? ' cal-marked' : ''}${isSelected ? ' cal-selected' : ''}`}
              onClick={() => handleSelect(c.date)}
              style={{
                all:'unset', display:'grid', placeItems:'center', padding: 8, height: 38,
                border: isMarked ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--color-border)',
                borderRadius: 8, cursor:'pointer',
                background: isMarked ? 'linear-gradient(90deg, #0b0b0b 0%, #15121a 35%, #2a1946 65%, #4c1d95 85%, #30124f 100%)' : (isSelected ? 'linear-gradient(180deg,#FF3F6C22,#FF3F6C11)' : '#fff'),
                boxShadow: isSelected ? 'inset 0 0 0 2px #FF3F6C' : 'none',
                color: isMarked ? '#fff' : (c.inMonth ? '#111827' : '#9ca3af')
              }}
            >
              <span style={{ position:'relative', fontWeight: 800 }}>
                {c.date.getDate()}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ marginTop:6, color:'#6b7280', fontSize:12 }}>Tap a date to see orders for that day. Purple-filled dates indicate orders.</div>
    </div>
  )
}

