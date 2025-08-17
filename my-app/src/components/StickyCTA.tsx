import type { Product } from '../types'
import { events } from '../analytics'
import { useLayoutEffect, useRef } from 'react'
import { gsap, canAnimate } from '../lib/gsap'
import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

export default function StickyCTA({ product }: { product: Product }) {
  const out = product.inventoryStatus === 'OUT_OF_STOCK'
  const ref = useRef<HTMLDivElement>(null)
  const { add } = useCart()
  const { navigate } = useRouter()

  useLayoutEffect(() => {
    if (!canAnimate()) return
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { y: 24, opacity: 0, duration: 0.4, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [])

  const handleClick = () => {
    if (out) {
      events.cta_click({ id: product.id, step: 'add_to_cart' })
      return
    }
    add({ product, quantity: 1 })
    events.cta_click({ id: product.id, step: 'begin_checkout' })
    navigate('/checkout')
  }

  return (
    <Paper ref={ref} className="sticky-cta" elevation={8} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 0 }}>
      <Box>
        <strong>
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price)}
        </strong>
        {product.compareAtPrice ? (
          <Box component="span" sx={{ ml: 1, color: 'text.secondary', textDecoration: 'line-through' }}>
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.compareAtPrice)}
          </Box>
        ) : null}
      </Box>
      <Button onClick={handleClick} disabled={out} variant={out ? 'contained' : 'contained'} sx={!out ? { backgroundColor:'#FF3F6C', '&:hover': { backgroundColor:'#e73962' } } : undefined}>
        {out ? 'Notify Me' : 'Buy Now'}
      </Button>
    </Paper>
  )
}

