import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'

export default function CartBadge() {
  const { count } = useCart()
  const { navigate } = useRouter()
  return (
    <button onClick={() => navigate('/checkout')} aria-label="Cart" style={{
      position: 'fixed', right: 16, top: 16, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 1000
    }}>
      <i className="fa-solid fa-cart-shopping"></i>
      {count > 0 && (
        <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, padding: '2px 6px', fontSize: 12 }}>{count}</span>
      )}
    </button>
  )
}

