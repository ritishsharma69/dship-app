import { useState, useRef, useEffect, useCallback } from 'react'
import { Box, IconButton, TextField, Typography, Paper, Fab, Zoom, Slide, Avatar, Fade } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

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
        content: 'Namaste! 🙏 Main Khushiyan Store ka AI assistant hoon. Aapki kaise madad kar sakta hoon? 😊',
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
          width: { xs: 'calc(100vw - 24px)', sm: 400 }, maxWidth: 440, height: { xs: 480, sm: 560 },
          borderRadius: '28px', overflow: 'hidden', zIndex: 1400, display: 'flex', flexDirection: 'column',
          background: '#fff',
          boxShadow: '0 25px 80px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}>
          {/* Header - Premium Glassmorphism */}
          <Box sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            display: 'flex', alignItems: 'center', gap: 2,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
              pointerEvents: 'none'
            },
            '&::after': {
              content: '""', position: 'absolute', top: '-50%', right: '-20%', width: '200px', height: '200px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
              pointerEvents: 'none', borderRadius: '50%'
            }
          }}>
            {/* Logo Avatar with glow */}
            <Box sx={{
              width: 52, height: 52, borderRadius: '16px',
              background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 -2px 4px rgba(0,0,0,0.05)',
              position: 'relative', zIndex: 1,
              border: '2px solid rgba(255,255,255,0.5)',
              overflow: 'hidden', p: 0.8
            }}>
              <img src="/mainlogo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: 17, letterSpacing: '-0.3px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  Khushiyan AI
                </Typography>
                <AutoAwesomeIcon sx={{ fontSize: 14, color: '#ffd700' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
                <Box sx={{
                  width: 8, height: 8, borderRadius: '50%',
                  bgcolor: '#4ade80',
                  boxShadow: '0 0 8px #4ade80',
                  animation: 'glow 2s ease-in-out infinite',
                  '@keyframes glow': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } }
                }} />
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  Always here to help
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{
              color: '#fff', bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)', width: 36, height: 36,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)', transform: 'rotate(90deg)' },
              transition: 'all 0.3s ease', position: 'relative', zIndex: 1
            }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Messages Area - Clean White */}
          <Box sx={{
            flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2,
            background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '3px' },
          }}>
            {messages.map((msg, i) => (
              <Fade in key={i} timeout={400}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1.2,
                  animation: 'slideIn 0.3s ease-out',
                  '@keyframes slideIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
                }}>
                  {msg.role === 'assistant' && (
                    <Box sx={{
                      width: 34, height: 34, borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      overflow: 'hidden', p: 0.5
                    }}>
                      <img src="/mainlogo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    </Box>
                  )}
                  <Box sx={{
                    maxWidth: '78%', p: 1.8,
                    borderRadius: msg.role === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#1a1a2e',
                    boxShadow: msg.role === 'user'
                      ? '0 4px 20px rgba(102, 126, 234, 0.35)'
                      : '0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                  }}>
                    <Typography sx={{ fontSize: 14.5, lineHeight: 1.65, whiteSpace: 'pre-wrap', fontWeight: 450 }}>
                      {msg.content}
                    </Typography>
                  </Box>
                  {msg.role === 'user' && (
                    <Avatar sx={{
                      width: 34, height: 34,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      fontSize: 14, boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
                    }}>
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}
                </Box>
              </Fade>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  overflow: 'hidden', p: 0.5
                }}>
                  <img src="/mainlogo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                </Box>
                <Box sx={{
                  bgcolor: '#fff', p: 2, borderRadius: '20px 20px 20px 6px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)'
                }}>
                  <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <Box key={i} sx={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        animation: 'bounce 1.4s infinite ease-in-out',
                        animationDelay: `${i * 0.16}s`,
                        '@keyframes bounce': {
                          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                          '40%': { transform: 'scale(1)', opacity: 1 }
                        }
                      }} />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area - Modern Floating Style */}
          <Box sx={{
            p: 2,
            background: '#fff',
            borderTop: '1px solid rgba(0,0,0,0.06)',
          }}>
            <Box sx={{
              display: 'flex', gap: 1.2, alignItems: 'center',
              bgcolor: '#f5f5f7', borderRadius: '16px', p: 0.8, pl: 2,
              border: '1px solid rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:focus-within': {
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.15)',
                borderColor: '#667eea'
              }
            }}>
              <TextField
                inputRef={inputRef}
                fullWidth
                size="small"
                placeholder="Type a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  '& input': {
                    fontSize: 15, color: '#1a1a2e', py: 0.8, fontWeight: 450,
                    '&::placeholder': { color: '#9ca3af', opacity: 1 }
                  }
                }}
              />
              <IconButton
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: input.trim()
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#e5e7eb',
                  color: '#fff',
                  boxShadow: input.trim() ? '0 4px 16px rgba(102, 126, 234, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': {
                    bgcolor: '#e5e7eb',
                    color: '#9ca3af',
                    boxShadow: 'none',
                    transform: 'none'
                  }
                }}
              >
                <SendIcon sx={{ fontSize: 20, transform: 'rotate(-30deg)', ml: 0.3 }} />
              </IconButton>
            </Box>
            <Typography sx={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', mt: 1.2, fontWeight: 500 }}>
              Powered by AI ✨ • Always available
            </Typography>
          </Box>
        </Paper>
      </Slide>

      {/* FAB Button - Premium Floating */}
      <Zoom in>
        <Fab onClick={() => { setOpen(!open); setHasNewMessage(false) }}
          sx={{
            position: 'fixed', bottom: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 1300,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.45), 0 0 0 4px rgba(102, 126, 234, 0.15)',
            width: 64, height: 64,
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              transform: 'scale(1.08)',
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.55), 0 0 0 6px rgba(102, 126, 234, 0.2)'
            },
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::before': {
              content: '""', position: 'absolute', inset: -3,
              background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
              borderRadius: '50%', zIndex: -1, opacity: 0.4,
              animation: 'pulse-ring 2s ease-in-out infinite',
              '@keyframes pulse-ring': { '0%, 100%': { transform: 'scale(1)', opacity: 0.4 }, '50%': { transform: 'scale(1.1)', opacity: 0.2 } }
            }
          }}>
          {open ? <CloseIcon sx={{ fontSize: 28 }} /> : <ChatIcon sx={{ fontSize: 28 }} />}
        </Fab>
      </Zoom>

      {/* Notification badge */}
      {hasNewMessage && !open && (
        <Box sx={{
          position: 'fixed', bottom: { xs: 70, sm: 78 }, right: { xs: 16, sm: 24 }, zIndex: 1301,
          width: 22, height: 22, borderRadius: '50%',
          bgcolor: '#ef4444',
          border: '3px solid #fff',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'bounce-badge 1s ease infinite',
          '@keyframes bounce-badge': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } }
        }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>1</Typography>
        </Box>
      )}
    </>
  )
}

