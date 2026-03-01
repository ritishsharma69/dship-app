import { useState, useRef, useEffect, useCallback } from 'react'
import { Box, IconButton, TextField, Typography, Paper, Fab, Zoom, Slide, Avatar, Fade } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  // Show welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Namaste! 🙏 Main Khushiyan Store ka assistant hoon. Aapki kaise madad kar sakta hoon? 😊',
        timestamp: new Date()
      }])
    }
  }, [open, messages.length])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    
    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }])
        if (!open) setHasNewMessage(true)
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Oops! Kuch technical issue aa gaya. Please thodi der baad try karein. 🙏',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Window */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper elevation={24} sx={{
          position: 'fixed', bottom: { xs: 80, sm: 100 }, right: { xs: 12, sm: 24 },
          width: { xs: 'calc(100vw - 24px)', sm: 380 }, maxWidth: 420, height: { xs: 450, sm: 520 },
          borderRadius: 4, overflow: 'hidden', zIndex: 1400, display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        }}>
          {/* Header */}
          <Box sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src="/mainlogo.png" alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>Khushiyan Assistant</Typography>
              <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ade80', display: 'inline-block' }} />
                Online • Typically replies instantly
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {messages.map((msg, i) => (
              <Fade in key={i} timeout={300}>
                <Box sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 1 }}>
                  {msg.role === 'assistant' && <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><img src="/mainlogo.png" alt="" style={{ width: '75%', height: '75%', objectFit: 'contain' }} /></Box>}
                  <Box sx={{
                    maxWidth: '80%', p: 1.5, borderRadius: 3,
                    bgcolor: msg.role === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: 14, lineHeight: 1.5,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
                  }}>
                    <Typography sx={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                  </Box>
                  {msg.role === 'user' && <Avatar sx={{ width: 28, height: 28, bgcolor: '#4ade80', fontSize: 14 }}><PersonIcon sx={{ fontSize: 16 }} /></Avatar>}
                </Box>
              </Fade>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><img src="/mainlogo.png" alt="" style={{ width: '75%', height: '75%', objectFit: 'contain' }} /></Box>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', p: 1.5, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[0, 1, 2].map(i => (
                      <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#764ba2',
                        animation: 'bounce 1.4s infinite ease-in-out', animationDelay: `${i * 0.16}s`,
                        '@keyframes bounce': { '0%, 80%, 100%': { transform: 'scale(0.6)' }, '40%': { transform: 'scale(1)' } }
                      }} />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 1, bgcolor: 'rgba(0,0,0,0.2)' }}>
            <TextField inputRef={inputRef} fullWidth size="small" placeholder="Type your message..." value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 3, color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#764ba2' } },
                '& input::placeholder': { color: 'rgba(255,255,255,0.5)' }
              }} />
            <IconButton onClick={sendMessage} disabled={!input.trim() || loading}
              sx={{ bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff', '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)' }, '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
              }}><SendIcon /></IconButton>
          </Box>
        </Paper>
      </Slide>

      {/* FAB Button */}
      <Zoom in>
        <Fab onClick={() => { setOpen(!open); setHasNewMessage(false) }}
          sx={{ position: 'fixed', bottom: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 1300,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)', width: 60, height: 60,
            '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)', transform: 'scale(1.05)' },
            transition: 'all 0.2s ease-in-out',
          }}>
          {open ? <CloseIcon sx={{ fontSize: 28 }} /> : <ChatIcon sx={{ fontSize: 28 }} />}
        </Fab>
      </Zoom>

      {/* Notification badge */}
      {hasNewMessage && !open && (
        <Box sx={{ position: 'fixed', bottom: { xs: 68, sm: 76 }, right: { xs: 16, sm: 24 }, zIndex: 1301,
          width: 18, height: 18, borderRadius: '50%', bgcolor: '#ef4444', border: '2px solid #fff',
          animation: 'pulse 2s infinite', '@keyframes pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.1)' } }
        }} />
      )}
    </>
  )
}

