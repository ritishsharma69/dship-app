import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from '../lib/router'
import { apiPostJson } from '../lib/api'

export default function ReturnRequestPage() {
  const { navigate } = useRouter()
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const orderId = params.get('orderId') || ''
  const [email, setEmail] = useState('')

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

    // Validate required: description and at least 1 image
    if (!customReason.trim()) { setError('Please describe the issue'); return }
    if (images.length === 0) { setError('Please add at least one photo'); return }

    setSubmitting(true)
    try {
      await apiPostJson('/api/returns', payload)
      setOk(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to submit return request')
    } finally {
      setSubmitting(false)
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
        <p className="muted" style={{ marginTop: 4 }}>Please describe the issue and add photos (both required).</p>

        <div style={{ display:'grid', gap: 12, marginTop: 12 }}>
          {error && <div style={{ color:'crimson' }}>{error}</div>}
          <label>
            <div style={{ fontWeight: 700 }}>Order ID</div>
            <input className="input" value={orderId} readOnly disabled />
          </label>

          <label>
            <div style={{ fontWeight: 700 }}>Your email</div>
            <input className="input" value={email} readOnly disabled />
          </label>



          <label>
            <div style={{ fontWeight: 700 }}>Describe the issue <span style={{ color:'#7f1d1d' }}>(required)</span></div>
            <textarea className="input" rows={4} placeholder="Add details that can help us process faster" value={customReason} onChange={(e)=>setCustomReason(e.target.value)} />
          </label>

          <label>
            <div style={{ fontWeight: 700 }}>Photos <span style={{ color:'#7f1d1d' }}>(required, up to 5)</span></div>
            <input type="file" accept="image/*" multiple onChange={onFiles} />
          </label>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap', minHeight: previews.length ? 100 : 0 }}>
            {previews.map((src, i) => (
              <img key={i} src={src} alt={`photo ${i+1}`} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            ))}
          </div>

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

