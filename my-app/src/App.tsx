import './App.css'
import { lazy, Suspense, useEffect } from 'react'
import { Route, Switch, useRouter } from './lib/router'
import TopBar from './components/TopBar'

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
        </Switch>
      </Suspense>
    </>
  )
}
