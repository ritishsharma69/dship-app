import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'

export default function CartPage() {
  const { items, update, remove } = useCart()
  const { navigate } = useRouter()

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <div className="container" style={{ padding: 24 }}>
      <div className="page-surface">
        <h1 style={{ marginBottom: 8 }}>Your Cart</h1>
        {!items.length ? (
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <p className="muted" style={{ marginBottom: 12 }}>Cart is empty.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 16, display: 'grid', gap: 8 }}>
              {items.map((i) => (
                <div key={i.product.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 8 }}>
                  <div>{i.product.title}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="stepper-btn" onClick={() => update(i.product.id, i.quantity - 1)}>-</button>
                    <span>{i.quantity}</span>
                    <button className="stepper-btn" onClick={() => update(i.product.id, i.quantity + 1)}>+</button>
                  </div>
                  <div>₹{i.product.price * i.quantity}</div>
                  <button className="btn btn-remove" onClick={() => remove(i.product.id)}>Remove</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <strong>Subtotal</strong>
              <strong>₹{subtotal}</strong>
            </div>
            <div style={{ height: 12 }} />
            <button className="btn btn-buy" onClick={() => navigate('/checkout')}>Checkout</button>
          </>
        )}
      </div>
    </div>
  )
}

