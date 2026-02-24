import './App.css'
import { lazy, Suspense, useEffect } from 'react'
import { Route, Switch, useRouter } from './lib/router'
import TopBar from './components/TopBar'
import ErrorBoundary from './components/ErrorBoundary'

import PageLoader from './components/PageLoader'


const MainPage = lazy(() => import('./pages/MainPage'))
const SimpleHomePage = lazy(() => import('./pages/SimpleHomePage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const SuccessPage = lazy(() => import('./pages/SuccessPage')) // legacy
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'))
// const OrderTrackPage = lazy(() => import('./pages/OrderTrackPage')) // temporarily disabled
const ContactPage = lazy(() => import('./pages/ContactUsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const ShippingReturnsPage = lazy(() => import('./pages/ShippingReturnsPage'))
const ShippingPage = lazy(() => import('./pages/ShippingPage'))
const CancellationRefundPage = lazy(() => import('./pages/CancellationRefundPage'))
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage'))

const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const ReturnRequestPage = lazy(() => import('./pages/ReturnRequestPage'))

// Admin
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'))
const AdminReturnsPage = lazy(() => import('./pages/AdminReturnsPage'))


const PaymentPhonePeReturnPage = lazy(() => import('./pages/PaymentPhonePeReturnPage'))

function NotFoundPage() {
  const { navigate } = useRouter()
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center', gap:12, padding:32 }}>
      <div style={{ fontSize: 56 }}>🔍</div>
      <h2 style={{ margin: 0, fontSize: 22, color: '#1f2937' }}>Page not found</h2>
      <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/')} style={{ marginTop: 8, padding:'10px 28px', borderRadius:10, border:'none', background:'#6D28D9', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>
        Go Home
      </button>
    </div>
  )
}

function AdminIndexRedirect() {
  const { navigate } = useRouter()
  // If a token exists, go to dashboard; else go to login.
  // We avoid importing auth helpers here to keep this file very lightweight.
  const hasToken = (() => {
    try { return !!localStorage.getItem('auth_token') } catch { return false }
  })()

  useEffect(() => {
    navigate(hasToken ? '/admin/dashboard' : '/admin/login', { replace: true })
  }, [hasToken, navigate])
  return null
}

export default function App() {
  const { path } = useRouter()
  const isAdminRoute = path === '/admin' || path.startsWith('/admin/')

  return (
    <>
      {!isAdminRoute ? <TopBar /> : null}
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}> {/* show full-screen loader until page resolves */}
        <Switch>
          {/* Home: show all products (SimpleHomePage) */}
          <Route path="/">
            <SimpleHomePage />
          </Route>

          {/* Product details (slugged) */}
          <Route path="/p/:slug">
            <MainPage />
          </Route>

          <Route path="/contact">
            <ContactPage />
          </Route>
          <Route path="/privacy">
            <PrivacyPage />
          </Route>
          <Route path="/shipping">
            <ShippingPage />
          </Route>
          <Route path="/cancellation-refund">
            <CancellationRefundPage />
          </Route>
          <Route path="/terms-conditions">
            <TermsConditionsPage />
          </Route>
          {/* Backward-compat route */}
          <Route path="/shipping-returns">
            <ShippingReturnsPage />
          </Route>
          <Route path="/orders">
            <OrdersPage />
          </Route>
          <Route path="/order/return">
            <ReturnRequestPage />
          </Route>
          <Route path="/admin/returns">
            <AdminReturnsPage />
          </Route>
          <Route path="/admin/login">
            <AdminLoginPage />
          </Route>
          <Route path="/admin/dashboard">
            <AdminDashboardPage />
          </Route>
          <Route path="/admin/products">
            <AdminProductsPage />
          </Route>
          <Route path="/admin/orders">
            <AdminOrdersPage />
          </Route>
          <Route path="/admin">
            <AdminIndexRedirect />
          </Route>
          <Route path="/checkout">
            <CheckoutPage />
          </Route>
          <Route path="/payment/phonepe/return">
            <PaymentPhonePeReturnPage />
          </Route>
          <Route path="/success">
            <SuccessPage />
          </Route>
          <Route path="/order/success">
            <OrderSuccessPage />
          </Route>
          {/* <Route path="/order/track/:id">
            <OrderTrackPage />
          </Route> */}

          {/* 404 fallback — no path prop, Switch renders this if nothing matches */}
          <NotFoundPage />
        </Switch>
      </Suspense>
      </ErrorBoundary>
    </>
  )
}
