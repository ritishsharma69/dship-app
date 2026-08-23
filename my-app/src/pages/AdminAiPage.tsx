import { useEffect, useMemo, useRef, useState } from 'react'
import AdminGuard from '../admin/AdminGuard'
import { getAuthToken } from '../lib/auth'
import { apiPostJson } from '../lib/api'
import { useRouter } from '../lib/router'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Drawer from '@mui/material/Drawer'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'

interface Msg { role: 'user' | 'assistant'; content: string; images?: string[] }
interface Chat { id: string; title: string; messages: Msg[]; createdAt: number }

const STORE_KEY = 'khushiyan_gpt_chats'
const SIDEBAR_W = 264

function loadChats(): Chat[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]') } catch { return [] }
}
function saveChats(chats: Chat[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(chats.slice(0, 50))) } catch { /* ignore */ }
}

// Downscale an image file to a compact JPEG data URL (keeps request payload small)
async function fileToDataUrl(file: File, maxDim = 1280): Promise<string> {
  const raw: string = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
  try {
    const img = document.createElement('img')
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = raw })
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    if (scale >= 1 && raw.length < 900_000) return raw
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    return raw
  }
}

// Minimal markdown-ish rendering: code blocks + inline code + bold, keeps bundle small
function renderContent(text: string) {
  const blocks = text.split(/```/)
  return blocks.map((b, i) => {
    if (i % 2 === 1) {
      const code = b.replace(/^[a-z0-9+#-]*\n/i, '')
      return (
        <Box key={i} component="pre" sx={{ m: 0, my: 1, p: 1.5, borderRadius: '12px', bgcolor: '#0F172A', color: '#E2E8F0', fontSize: 12.5, overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre' }}>{code}</Box>
      )
    }
    const parts = b.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    return (
      <Typography key={i} component="span" sx={{ fontSize: 14.5, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {parts.map((p, j) => {
          if (p.startsWith('**') && p.endsWith('**')) return <Box key={j} component="strong" sx={{ fontWeight: 800 }}>{p.slice(2, -2)}</Box>
          if (p.startsWith('`') && p.endsWith('`')) return <Box key={j} component="code" sx={{ px: 0.6, py: 0.1, borderRadius: '6px', bgcolor: 'rgba(124,58,237,0.10)', color: '#6D28D9', fontSize: 13, fontFamily: 'ui-monospace, Menlo, monospace' }}>{p.slice(1, -1)}</Box>
          return p
        })}
      </Typography>
    )
  })
}

export default function AdminAiPage() {
  return (
    <AdminGuard>
      <KhushiyanGpt />
    </AdminGuard>
  )
}

function KhushiyanGpt() {
  const { navigate } = useRouter()
  const theme = useTheme()
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const tok = getAuthToken()

  const [chats, setChats] = useState<Chat[]>(() => loadChats())
  const [activeId, setActiveId] = useState<string | null>(() => loadChats()[0]?.id || null)
  const [input, setInput] = useState('')
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const active = useMemo(() => chats.find(c => c.id === activeId) || null, [chats, activeId])

  useEffect(() => { saveChats(chats) }, [chats])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [active?.messages.length, loading])

  const newChat = () => { setActiveId(null); setInput(''); setPendingImages([]); setMobileNav(false) }

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const list = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 6 - pendingImages.length)
    const urls = await Promise.all(list.map(f => fileToDataUrl(f)))
    setPendingImages(prev => [...prev, ...urls].slice(0, 6))
    if (fileRef.current) fileRef.current.value = ''
  }

  const send = async () => {
    const text = input.trim()
    if ((!text && !pendingImages.length) || loading) return
    const userMsg: Msg = { role: 'user', content: text, images: pendingImages.length ? pendingImages : undefined }

    let chatId = activeId
    let history: Msg[] = []
    if (!chatId) {
      chatId = `c${Date.now()}`
      const title = (text || 'Image query').slice(0, 42)
      setChats(prev => [{ id: chatId!, title, messages: [userMsg], createdAt: Date.now() }, ...prev])
      setActiveId(chatId)
      history = [userMsg]
    } else {
      history = [...(active?.messages || []), userMsg]
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: history } : c))
    }
    setInput(''); setPendingImages([]); setLoading(true)

    try {
      const payload = { messages: history.map(m => ({ role: m.role, content: m.content, images: m.images })) }
      const data = await apiPostJson<{ reply: string; provider: string }>('/api/admin/ai', payload, { authToken: tok, timeoutMs: 90000 })
      const aiMsg: Msg = { role: 'assistant', content: data.reply || '…' }
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, aiMsg] } : c))
    } catch (err: any) {
      const aiMsg: Msg = { role: 'assistant', content: `⚠️ Error: ${String(err?.message || 'request failed')}` }
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, aiMsg] } : c))
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const copyText = (t: string) => { try { navigator.clipboard.writeText(t) } catch { /* ignore */ } }

  // ---------- Sidebar (chat history) ----------
  const sidebar = (
    <Box sx={{ width: SIDEBAR_W, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#171122', color: '#EDE9FE' }}>
      <Box sx={{ p: 1.5, display: 'grid', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5, py: 0.5 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: '9px', background: 'linear-gradient(135deg, #7C3AED, #A855F7)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <AutoAwesomeRoundedIcon sx={{ fontSize: 17, color: '#fff' }} />
          </Box>
          <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: 0.2 }}>Khushiyan GPT</Typography>
        </Box>
        <Button fullWidth startIcon={<AddRoundedIcon />} onClick={newChat}
          sx={{ justifyContent: 'flex-start', borderRadius: '12px', px: 1.5, py: 1, color: '#EDE9FE', border: '1px solid rgba(255,255,255,0.14)', textTransform: 'none', fontWeight: 700, fontSize: 13.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
          New chat
        </Button>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 1, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 99 } }}>
        {chats.length === 0 && (
          <Typography sx={{ px: 1.5, py: 2, fontSize: 12.5, color: 'rgba(237,233,254,0.5)' }}>No chats yet</Typography>
        )}
        {chats.map((c) => (
          <Box key={c.id} onClick={() => { setActiveId(c.id); setMobileNav(false) }}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1, borderRadius: '10px', cursor: 'pointer', mb: 0.25,
              bgcolor: c.id === activeId ? 'rgba(124,58,237,0.28)' : 'transparent',
              '&:hover': { bgcolor: c.id === activeId ? 'rgba(124,58,237,0.32)' : 'rgba(255,255,255,0.06)', '& .del': { opacity: 1 } } }}>
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 15, color: 'rgba(237,233,254,0.55)', flexShrink: 0 }} />
            <Typography noWrap sx={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#EDE9FE' }}>{c.title}</Typography>
            <IconButton className="del" size="small" onClick={(e) => { e.stopPropagation(); deleteChat(c.id) }}
              sx={{ opacity: { xs: 1, md: 0 }, color: 'rgba(237,233,254,0.5)', p: 0.25, '&:hover': { color: '#F87171' } }}>
              <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <Button fullWidth startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/admin/dashboard')}
          sx={{ justifyContent: 'flex-start', borderRadius: '12px', px: 1.5, py: 0.9, color: 'rgba(237,233,254,0.75)', textTransform: 'none', fontWeight: 700, fontSize: 13, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
          Back to Admin
        </Button>
      </Box>
    </Box>
  )

  // ---------- Composer ----------
  const composer = (
    <Box sx={{ px: { xs: 1.5, md: 3 }, pb: { xs: 1.5, md: 2.5 }, pt: 1 }}>
      <Box sx={{ maxWidth: 820, mx: 'auto' }}>
        {pendingImages.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {pendingImages.map((src, i) => (
              <Box key={i} sx={{ position: 'relative', width: 64, height: 64, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                <img src={src} alt="attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconButton size="small" onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))}
                  sx={{ position: 'absolute', top: 2, right: 2, p: 0.2, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}>
                  <CloseRoundedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: 1, borderRadius: '24px', bgcolor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onPickFiles(e.target.files)} />
          <Tooltip title="Attach images">
            <IconButton onClick={() => fileRef.current?.click()} sx={{ color: '#7C3AED', flexShrink: 0 }}>
              <ImageOutlinedIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
          <Box component="textarea" value={input} onChange={(e: any) => setInput(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Message Khushiyan GPT…" rows={1}
            sx={{ flex: 1, resize: 'none', border: 'none', outline: 'none', fontSize: 14.5, lineHeight: 1.5, fontFamily: 'inherit', py: 1, maxHeight: 160, overflowY: 'auto', bgcolor: 'transparent',
              minHeight: 24, height: 'auto' }}
            onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }} />
          <IconButton onClick={send} disabled={loading || (!input.trim() && !pendingImages.length)}
            sx={{ flexShrink: 0, width: 40, height: 40, background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: '#fff', '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #9333EA)' }, '&.Mui-disabled': { background: '#E5E7EB', color: '#9CA3AF' } }}>
            {loading ? <CircularProgress size={18} sx={{ color: '#9CA3AF' }} /> : <SendRoundedIcon sx={{ fontSize: 19 }} />}
          </IconButton>
        </Box>
        <Typography sx={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', mt: 1 }}>
          Gemini + OpenAI combined · Enter to send · Shift+Enter for new line
        </Typography>
      </Box>
    </Box>
  )

  // ---------- Message thread ----------
  const thread = active ? (
    <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 1.5, md: 3 }, py: 2 }}>
      <Box sx={{ maxWidth: 820, mx: 'auto', display: 'grid', gap: 2 }}>
        {active.messages.map((m, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <Box sx={{ width: 30, height: 30, borderRadius: '9px', background: 'linear-gradient(135deg, #7C3AED, #A855F7)', display: 'grid', placeItems: 'center', flexShrink: 0, mr: 1.25, mt: 0.25 }}>
                <AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: '#fff' }} />
              </Box>
            )}
            <Box sx={{ maxWidth: m.role === 'user' ? '80%' : 'calc(100% - 42px)', position: 'relative',
              ...(m.role === 'user'
                ? { bgcolor: '#7C3AED', color: '#fff', borderRadius: '18px 18px 4px 18px', px: 2, py: 1.25 }
                : { bgcolor: '#fff', border: '1px solid #EEE9F8', borderRadius: '4px 18px 18px 18px', px: 2, py: 1.5, '&:hover .copy': { opacity: 1 } }) }}>
              {m.images && m.images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: m.content ? 1 : 0 }}>
                  {m.images.map((src, j) => (
                    <img key={j} src={src} alt="upload" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12 }} />
                  ))}
                </Box>
              )}
              {m.role === 'user'
                ? <Typography sx={{ fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</Typography>
                : (
                  <>
                    {renderContent(m.content)}
                    <IconButton className="copy" size="small" onClick={() => copyText(m.content)}
                      sx={{ position: 'absolute', top: 6, right: 6, opacity: { xs: 1, md: 0 }, color: '#9CA3AF', p: 0.4, '&:hover': { color: '#7C3AED' } }}>
                      <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </>
                )}
            </Box>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '9px', background: 'linear-gradient(135deg, #7C3AED, #A855F7)', display: 'grid', placeItems: 'center', flexShrink: 0, mr: 1.25 }}>
              <AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: '#fff' }} />
            </Box>
            <Box sx={{ bgcolor: '#fff', border: '1px solid #EEE9F8', borderRadius: '4px 18px 18px 18px', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={14} sx={{ color: '#7C3AED' }} />
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Thinking…</Typography>
            </Box>
          </Box>
        )}
        <div ref={endRef} />
      </Box>
    </Box>
  ) : (
    // Empty state — ChatGPT-style welcome
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', px: 2 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 560 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '16px', background: 'linear-gradient(135deg, #7C3AED, #A855F7)', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 30, color: '#fff' }} />
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: { xs: 22, md: 26 }, color: '#111114' }}>Khushiyan GPT</Typography>
        <Typography sx={{ fontSize: 14, color: '#6B7280', mt: 0.75, mb: 2.5 }}>
          Kuch bhi pucho — text likho ya image upload karo. Gemini + OpenAI combined.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
          {['Is product image ke liye SEO title likho', 'Mera Instagram caption banao Hindi me', 'Order refund policy draft karo', 'Is screenshot me kya problem hai batao'].map((s) => (
            <Box key={s} onClick={() => setInput(s)}
              sx={{ px: 1.75, py: 1.25, borderRadius: '14px', border: '1px solid #E5E7EB', bgcolor: '#fff', fontSize: 13, color: '#374151', textAlign: 'left', cursor: 'pointer', fontWeight: 600, '&:hover': { borderColor: '#C4B5FD', bgcolor: '#FAF7FF' } }}>
              {s}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )

  // ---------- Layout ----------
  return (
    <Box sx={{ display: 'flex', height: '100dvh', bgcolor: '#F7F5FB', overflow: 'hidden' }}>
      {mdUp ? (
        <Box sx={{ flexShrink: 0 }}>{sidebar}</Box>
      ) : (
        <Drawer open={mobileNav} onClose={() => setMobileNav(false)} ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_W, border: 'none' } }}>
          {sidebar}
        </Drawer>
      )}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1, md: 3 }, py: 1.25, borderBottom: '1px solid #ECE8F5', bgcolor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
          {!mdUp && (
            <IconButton onClick={() => setMobileNav(true)} sx={{ color: '#111114' }}>
              <MenuRoundedIcon />
            </IconButton>
          )}
          <Typography noWrap sx={{ flex: 1, fontWeight: 800, fontSize: 15, color: '#111114' }}>
            {active ? active.title : 'New chat'}
          </Typography>
          {!mdUp && (
            <IconButton onClick={newChat} sx={{ color: '#7C3AED' }}>
              <AddRoundedIcon />
            </IconButton>
          )}
        </Box>
        {thread}
        {composer}
      </Box>
    </Box>
  )
}
