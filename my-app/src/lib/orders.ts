export type PaymentMethod = 'cod' | 'online'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered'

export interface OrderItem { productId: string; title: string; price: number; quantity: number }
export interface Address { country: FormDataEntryValue | null; line1: FormDataEntryValue | null; line2?: FormDataEntryValue | null; city: FormDataEntryValue | null; state: FormDataEntryValue | null; zip: FormDataEntryValue | null }
export interface Order {
  id: string
  items: OrderItem[]
  totals: { subtotal: number; shipping: number; tax: number; total: number }
  customer: { email: FormDataEntryValue | null; name: FormDataEntryValue | null; phone?: FormDataEntryValue | null }
  address: Address
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: string
}

const KEY = 'orders:v1'

export function saveOrderToLocal(order: Order) {
  try {
    const raw = localStorage.getItem(KEY)
    const arr: Order[] = raw ? JSON.parse(raw) : []
    arr.unshift(order)
    localStorage.setItem(KEY, JSON.stringify(arr))
  } catch {}
}

export function getOrderById(id: string): Order | null {
  try {
    const raw = localStorage.getItem(KEY)
    const arr: Order[] = raw ? JSON.parse(raw) : []
    return arr.find(o => o.id === id) ?? null
  } catch { return null }
}

