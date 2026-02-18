import { useEffect, useMemo, useRef, useState } from 'react'
import type { InventoryStatus, Product } from '../types'

import AdminGuard from '../admin/AdminGuard'
import AdminLayout from '../admin/AdminLayout'
import { getAuthToken } from '../lib/auth'
import { apiDeleteJson, apiGetJson, apiPatchJson, apiPostJson } from '../lib/api'
import { useToast } from '../lib/toast'

import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Tooltip from '@mui/material/Tooltip'

import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'

type AdminProduct = Product & { createdAt?: string | null; updatedAt?: string | null }

function linesToArr(s: string): string[] {
  return String(s || '')
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean)
}

function arrToLines(a?: string[]): string {
  return (Array.isArray(a) ? a : []).join('\n')
}

function testimonialsToLines(testimonials?: any[]): string {
  if (!Array.isArray(testimonials)) return ''
  return testimonials
    .map(t => `${t.author || ''}|${t.quote || ''}|${t.rating || 5}`)
    .join('\n')
}

function money(v?: number) {
  if (v == null) return ''
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

function inventoryChip(status: InventoryStatus) {
  if (status === 'OUT_OF_STOCK') return <Chip size="small" color="error" label="Out of stock" />
  if (status === 'LOW_STOCK') return <Chip size="small" color="warning" label="Low stock" />
  return <Chip size="small" color="success" label="In stock" />
}

function ProductDialog({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean
  mode: 'create' | 'edit'
  initial?: AdminProduct | null
  onClose: () => void
  onSaved: () => void
}) {
  const tok = useMemo(() => getAuthToken(), [])
  const { push } = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [title, setTitle] = useState('')
  const [sku, setSku] = useState('')
  const [brand, setBrand] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus>('IN_STOCK')
  const [images, setImages] = useState('')
  const [bullets, setBullets] = useState('')
  const [descriptionHeading, setDescriptionHeading] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionPoints, setDescriptionPoints] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [video, setVideo] = useState('')
  const [testimonials, setTestimonials] = useState('')

  useEffect(() => {
    if (!open) return
    setError(null)
    const p = initial || ({} as any)
    setTitle(p.title || '')
    setSku(p.sku || '')
    setBrand(p.brand || '')
    setSlug((p as any).slug || '')
    setPrice(p.price != null ? String(p.price) : '')
    setCompareAtPrice((p as any).compareAtPrice != null ? String((p as any).compareAtPrice) : '')
    setInventoryStatus((p.inventoryStatus as any) || 'IN_STOCK')
    setImages(arrToLines(p.images))
    setBullets(arrToLines(p.bullets))
    setDescriptionHeading((p as any).descriptionHeading || '')
    setDescription((p as any).description || '')
    setDescriptionPoints(arrToLines((p as any).descriptionPoints))
    setYoutubeUrl((p as any).youtubeUrl || '')
    setVideo((p as any).video || '')
    setTestimonials(testimonialsToLines((p as any).testimonials))
  }, [open, initial])

  const valid = title.trim().length > 0 && sku.trim().length > 0

  function appendImageUrls(urls: string[]) {
    if (!urls.length) return
    setImages(prev => {
      const left = String(prev || '').trimEnd()
      const right = urls.join('\n')
      return left ? `${left}\n${right}` : right
    })
  }

  async function uploadCloudinaryImages(files: FileList | null) {
    if (!files || !files.length) return
    if (busy || uploadingImages) return

    const maxFiles = 10
    const maxBytes = 2_000_000
    const picked = Array.from(files).slice(0, maxFiles)

    const allowedTypes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ])

    const wrongType = picked.filter(f => !allowedTypes.has(String(f.type || '').toLowerCase()))
    if (wrongType.length) {
      push(`Some files are not supported (jpg/png/webp/gif). Skipped: ${wrongType.slice(0, 3).map(f => f.name).join(', ')}`)
    }

    const tooBig = picked.filter(f => (f.size || 0) > maxBytes)
    if (tooBig.length) {
      push(`Some files are too large (max 2MB each). Skipped: ${tooBig.slice(0, 3).map(f => f.name).join(', ')}`)
    }

    const okFiles = picked.filter(f => (f.size || 0) <= maxBytes && allowedTypes.has(String(f.type || '').toLowerCase()))
    if (!okFiles.length) return

    setUploadingImages(true)
    try {
      const sign = await apiPostJson<{
        ok: true
        cloudName: string
        apiKey: string
        folder: string
        timestamp: number
        signature: string
      }>(
        '/api/cloudinary/sign',
        {},
        { authToken: tok, loaderText: 'Preparing Cloudinary upload…', timeoutMs: 20000 }
      )

      const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`

      const settled = await Promise.allSettled(
        okFiles.map(async (file) => {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('api_key', sign.apiKey)
          fd.append('timestamp', String(sign.timestamp))
          fd.append('signature', sign.signature)
          fd.append('folder', sign.folder)

          const r = await fetch(uploadUrl, { method: 'POST', body: fd })
          const j: any = await r.json().catch(() => ({}))
          if (!r.ok) {
            const msg = j?.error?.message || j?.message || `Upload failed (${r.status})`
            throw new Error(`${file.name}: ${msg}`)
          }
          const url = String(j?.secure_url || '')
          if (!url) throw new Error(`${file.name}: missing secure_url`)
          return url
        })
      )

      const okUrls: string[] = []
      const failed: string[] = []
      for (const s of settled) {
        if (s.status === 'fulfilled') okUrls.push(s.value)
        else failed.push(String((s.reason as any)?.message || s.reason || 'Upload failed'))
      }

      if (okUrls.length) {
        appendImageUrls(okUrls)
        push(`${okUrls.length} image(s) uploaded to Cloudinary`)
      }
      if (failed.length) {
        push(`Some uploads failed: ${failed.slice(0, 2).join(' | ')}${failed.length > 2 ? ' …' : ''}`)
      }
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('cloudinary_not_configured')) {
        push('Cloudinary is not configured on the server. Add CLOUDINARY_* in server/.env and restart server.')
      } else {
        push(msg || 'Image upload failed')
      }
    } finally {
      setUploadingImages(false)
      // allow selecting the same file again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function save() {
    setError(null)
    if (!valid) { setError('Title and SKU are required'); return }

    // Parse testimonials from text format: "Author|Quote|Rating" (one per line)
    const parseTestimonials = (text: string) => {
      return linesToArr(text).map(line => {
        const parts = line.split('|').map(p => p.trim())
        return {
          author: parts[0] || '',
          quote: parts[1] || '',
          rating: parts[2] ? Math.min(5, Math.max(1, Number(parts[2]) || 5)) : 5,
        }
      }).filter(t => t.author && t.quote)
    }

    const payload: any = {
      title: title.trim(),
      sku: sku.trim(),
      brand: brand.trim(),
      slug: slug.trim(),
      price: Number(price || 0),
      compareAtPrice: compareAtPrice.trim() ? Number(compareAtPrice) : null,
      inventoryStatus,
      images: linesToArr(images),
      bullets: linesToArr(bullets),
      description,
      descriptionHeading: descriptionHeading.trim(),
      descriptionPoints: linesToArr(descriptionPoints),
      youtubeUrl: youtubeUrl.trim(),
      video: video.trim(),
      testimonials: parseTestimonials(testimonials),
    }

    setBusy(true)
    try {
      if (mode === 'create') {
        await apiPostJson('/api/products/admin', payload, { authToken: tok, loaderText: 'Creating product…', timeoutMs: 45000 })
        push('Product created')
      } else {
        const id = String(initial?.id || '')
        if (!id) throw new Error('Missing product id')
        await apiPatchJson(`/api/products/admin/${id}`, payload, { authToken: tok, loaderText: 'Saving…', timeoutMs: 45000 })
        push('Product saved')
      }
      onSaved()
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
      push(e?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 950 }}>{mode === 'create' ? 'New Product' : 'Edit Product'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
	            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="e.g., Premium Wellness Massager" InputLabelProps={{ shrink: true }} />
	            <TextField label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} fullWidth placeholder="e.g., KHUSHIYAN-MASSAGER-001" InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
	            <TextField label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} fullWidth placeholder="e.g., Khushiyan" InputLabelProps={{ shrink: true }} />
	            <TextField label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} fullWidth placeholder="e.g., premium-wellness-massager" helperText="Optional: /p/:slug" InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
	            <TextField label="Price" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth inputMode="decimal" placeholder="e.g., 2999" InputLabelProps={{ shrink: true }} />
	            <TextField label="Compare at" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} fullWidth inputMode="decimal" placeholder="e.g., 4999" InputLabelProps={{ shrink: true }} />
	            <TextField select label="Inventory" value={inventoryStatus} onChange={(e) => setInventoryStatus(e.target.value as InventoryStatus)} fullWidth InputLabelProps={{ shrink: true }}>
              <MenuItem value="IN_STOCK">IN_STOCK</MenuItem>
              <MenuItem value="LOW_STOCK">LOW_STOCK</MenuItem>
              <MenuItem value="OUT_OF_STOCK">OUT_OF_STOCK</MenuItem>
            </TextField>
          </Stack>
          <Divider />
	          <TextField
	            label="Images (one URL per line)"
	            value={images}
	            onChange={(e) => setImages(e.target.value)}
	            multiline
	            minRows={3}
	            fullWidth
	            placeholder={'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=500&h=500&fit=crop\nhttps://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop'}
	            InputLabelProps={{ shrink: true }}
	          />
		          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
		            <Button
		              variant="outlined"
		              component="label"
		              disabled={busy || uploadingImages}
		            >
		              {uploadingImages ? 'Uploading…' : 'Upload images from device'}
		              <input
		                ref={fileInputRef}
		                type="file"
		                hidden
		                multiple
		                accept="image/*"
		                onChange={(e) => uploadCloudinaryImages(e.target.files)}
		              />
		            </Button>
		            <Typography variant="caption" color="text.secondary">
		              Tip: max 10 files, ≤ 2MB each. Uploaded images will be added as URLs above.
		            </Typography>
		          </Stack>
	          <TextField
	            label="Bullets (one per line)"
	            value={bullets}
	            onChange={(e) => setBullets(e.target.value)}
	            multiline
	            minRows={3}
	            fullWidth
	            placeholder={'Premium wellness device\nMultiple massage modes\nUSB rechargeable\nPortable design'}
	            InputLabelProps={{ shrink: true }}
	          />
	          <TextField label="Description heading" value={descriptionHeading} onChange={(e) => setDescriptionHeading(e.target.value)} fullWidth placeholder="e.g., Experience Ultimate Relaxation" InputLabelProps={{ shrink: true }} />
	          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={4} fullWidth placeholder="Detailed product description goes here. Explain features, benefits, and why customers should buy this product..." InputLabelProps={{ shrink: true }} />
	          <TextField
	            label="Description points (one per line)"
	            value={descriptionPoints}
	            onChange={(e) => setDescriptionPoints(e.target.value)}
	            multiline
	            minRows={3}
	            fullWidth
	            placeholder={'Designed for comfort and wellness\nHigh-quality materials and craftsmanship\nPerfect for daily use and recovery'}
	            InputLabelProps={{ shrink: true }}
	          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
	            <TextField label="YouTube URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} fullWidth placeholder="e.g., https://www.youtube.com/embed/dQw4w9WgXcQ" InputLabelProps={{ shrink: true }} />
	            <TextField label="Video URL (mp4/webm)" value={video} onChange={(e) => setVideo(e.target.value)} fullWidth placeholder="e.g., https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4" InputLabelProps={{ shrink: true }} />
          </Stack>
          <Divider />
          <TextField
            label="Testimonials (Author|Quote|Rating, one per line)"
            value={testimonials}
            onChange={(e) => setTestimonials(e.target.value)}
            multiline
            minRows={4}
            fullWidth
	            placeholder={'Rajeev P.|Night shift ke baad pair bahut dukhte the — 15 min is mat pe and relief mil jata hai.|5\nMegha T.|Foldable aur lightweight. TV dekhte hue daily use karti hoon.|5\nSuresh V.|Walking ke baad thakawat utar jati hai.|4'}
	            InputLabelProps={{ shrink: true }}
            helperText="Format: Author Name|Customer quote here|5 (rating 1-5, optional)"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={save} variant="contained" disabled={!valid || busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function AdminProductsPage() {
  const tok = useMemo(() => getAuthToken(), [])
  const { push } = useToast()
  const [rows, setRows] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [limit, setLimit] = useState(50)
  const [page, setPage] = useState(0)
  const skip = page * limit

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<AdminProduct | null>(null)

  const [confirmDel, setConfirmDel] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      params.set('limit', String(limit))
      params.set('skip', String(skip))
      const data = await apiGetJson<{ products: AdminProduct[] }>(`/api/products/admin?${params.toString()}`, { authToken: tok, timeoutMs: 45000 })
      setRows(data?.products || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [limit, page])

  useEffect(() => {
    const t = window.setTimeout(() => { setPage(0); load() }, 350)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const hasNext = rows.length === limit
  const openCreate = () => { setDialogMode('create'); setEditing(null); setDialogOpen(true) }
  const openEdit = (p: AdminProduct) => { setDialogMode('edit'); setEditing(p); setDialogOpen(true) }

  async function doDelete() {
    const p = confirmDel
    if (!p) return
    setDeleting(true)
    try {
      await apiDeleteJson(`/api/products/admin/${p.id}`, undefined, { authToken: tok, loaderText: 'Deleting…', timeoutMs: 45000 })
      push('Product deleted')
      setConfirmDel(null)
      await load()
    } catch (e: any) {
      push(e?.message || 'Failed to delete')
      setError(e?.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminGuard>
      <AdminLayout
        title="Products"
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={loading ? 'Loading…' : `${rows.length} shown`} variant="outlined" sx={{ fontWeight: 900 }} />
            <Tooltip title="Refresh">
              <IconButton color="inherit" onClick={load}><RefreshIcon /></IconButton>
            </Tooltip>
          </Stack>
        }
      >
        <Paper sx={{ p: 2.25, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              size="small"
              placeholder="Search title / sku / brand"
              sx={{ flex: 1, maxWidth: 520 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Per page"
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value || 50)); setPage(0) }}
              sx={{ width: 140 }}
            >
              {[25, 50, 100, 200].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New
            </Button>
          </Stack>
          {error ? <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert> : null}
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 950, width: 72 }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Inventory</TableCell>
                <TableCell sx={{ fontWeight: 950, width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Avatar variant="rounded" src={(p.images || [])[0] || undefined} sx={{ width: 48, height: 48 }}>
                      {String(p.title || 'P').slice(0, 1).toUpperCase()}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 900 }}>{p.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.brand || ''}</Typography>
                  </TableCell>
                  <TableCell><code>{p.sku}</code></TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 900 }}>{money(p.price)}</Typography>
                    {(p as any).compareAtPrice ? (
                      <Typography variant="caption" color="text.secondary">MRP {money((p as any).compareAtPrice)}</Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{inventoryChip(p.inventoryStatus)}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton onClick={() => openEdit(p)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton onClick={() => setConfirmDel(p)} color="error"><DeleteIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 && !loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No products found.</Typography>
          ) : null}
        </Paper>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
            Prev
          </Button>
          <Chip label={`Page ${page + 1}`} variant="outlined" />
          <Button variant="outlined" disabled={!hasNext} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </Stack>

        <ProductDialog
          open={dialogOpen}
          mode={dialogMode}
          initial={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={async () => { setDialogOpen(false); await load() }}
        />

        <Dialog open={!!confirmDel} onClose={deleting ? undefined : () => setConfirmDel(null)}>
          <DialogTitle sx={{ fontWeight: 950 }}>Delete product?</DialogTitle>
          <DialogContent dividers>
            <Typography>Are you sure you want to delete <b>{confirmDel?.title}</b>?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>This cannot be undone.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setConfirmDel(null)} disabled={deleting}>Cancel</Button>
            <Button color="error" variant="contained" onClick={doDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </AdminLayout>
    </AdminGuard>
  )
}
