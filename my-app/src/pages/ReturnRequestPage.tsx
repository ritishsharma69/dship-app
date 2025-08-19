import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from '../lib/router'

export default function ReturnRequestPage() {
  const { navigate } = useRouter()
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const orderId = params.get('orderId') || ''
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState<string[]>([])
  const [customReason, setCustomReason] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  // Prefill email from login (Orders page saves it to localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('auth_email') || ''
      if (saved) setEmail(saved)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reasons = [
    'Damaged or leaked item',
    'Wrong product received',
    'Missing items in the package',
    'Product not effective / not as expected',
    'Ordered by mistake',
    'Other'
  ]

  function toggle(r: string) {
    setReason(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : []
    setImages(list.slice(0, 5)) // up to 5 images
  }

  // Build and clean up preview URLs when files change
  useEffect(() => {
    const urls = images.map(f => URL.createObjectURL(f))
    setPreviews(urls)
    return () => { urls.forEach(u => URL.revokeObjectURL(u)) }
  }, [images])

  async function submit() {
    setError(null)
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }
    if (!orderId) { setError('Missing orderId'); return }

    const payload = {
      orderId,
      email,
      reasons: reason,
      customReason: customReason.trim() || undefined,
      images: [] as string[],
    }

    // Read images as data URLs (small demo only). In production use uploads/storage.
    try {
      for (const f of images) {
        const data = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => resolve(String(r.result))
          r.onerror = () => reject(new Error('read failed'))
          r.readAsDataURL(f)
        })
        if (data.length < 2_000_000) payload.images.push(data) // limit size
      }
    } catch (e) {
      // ignore file read errors
    }

    setSubmitting(true)
    // show pink loader
    const overlay = document.createElement('div')
    overlay.id = 'pink-loader-overlay'
    overlay.className = 'pink-loader-overlay'
    overlay.innerHTML = '<div class="pink-loader-card"><div class="pink-spinner"><span class="blob a"></span><span class="blob b"></span><span class="blob c"></span><span class="ring"></span></div><div class="pink-loader-text">Submitting…</div></div>'
    document.body.appendChild(overlay)
    try {
      const base = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const res = await fetch(`${base}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      setOk(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to submit return request')
    } finally {
      setSubmitting(false)
      const el = document.getElementById('pink-loader-overlay'); if (el) el.remove()
    }
  }

  if (ok) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <div className="card" style={{ maxWidth: 820, margin: '0 auto', padding: 24 }}>
          <h2>Return request submitted</h2>
          <p className="muted">We have emailed you a confirmation. Our team will reach out shortly.</p>
          <button className="btn" onClick={() => navigate('/orders')}>Go to Your Orders</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: 24 }}>
      <div className="card" style={{ maxWidth: 820, margin: '0 auto', padding: 24, textAlign:'left' }}>
        <h2 style={{ marginTop: 0 }}>Return / Replacement</h2>
        <p className="muted" style={{ marginTop: 4 }}>Please select a reason and (optional) add description and photos.</p>

        <div style={{ display:'grid', gap: 12, marginTop: 12 }}>
          {error && <div style={{ color:'crimson' }}>{error}</div>}
          <label>
            <div style={{ fontWeight: 700 }}>Order ID</div>
            <input className="input" value={orderId} readOnly />
          </label>

          <label>
            <div style={{ fontWeight: 700 }}>Your email</div>
            <input className="input" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </label>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Reason</div>
            <div style={{ display:'grid', gap: 8 }}>
              {reasons.map(r => (
                <label key={r} style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="checkbox" checked={reason.includes(r)} onChange={()=>toggle(r)} />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <label>
            <div style={{ fontWeight: 700 }}>Describe the issue (optional)</div>
            <textarea className="input" rows={4} placeholder="Add details that can help us process faster" value={customReason} onChange={(e)=>setCustomReason(e.target.value)} />
          </label>

          <label>
            <div style={{ fontWeight: 700 }}>Photos (optional, up to 5)</div>
            <input type="file" accept="image/*" multiple onChange={onFiles} />
          </label>

          {previews.length > 0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {previews.map((src, i) => (
                <img key={i} src={src} alt={`photo ${i+1}`} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              ))}
            </div>
          )}

          <div>
            <button className="btn btn-primary" disabled={submitting} onClick={submit}>
              {submitting ? 'Submitting…' : 'Submit Return Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

