import './App.css'
import { lazy, Suspense } from 'react'
import { Route, Switch } from './lib/router'
import TopBar from './components/TopBar'

const HomePage = lazy(() => import('./pages/SimpleHomePage'))
const MainPage = lazy(() => import('./pages/MainPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const SuccessPage = lazy(() => import('./pages/SuccessPage')) // legacy
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'))
// const OrderTrackPage = lazy(() => import('./pages/OrderTrackPage')) // temporarily disabled
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const ReturnRequestPage = lazy(() => import('./pages/ReturnRequestPage'))

export default function App() {
  return (
    <>
      <TopBar />
      <Suspense fallback={<div style={{ padding: 16 }} />}> {/* small, non-blocking fallback */}
        <Switch>
          {/* Home / Landing */}
          <Route path="/">
            <HomePage />
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
          <Route path="/orders">
            <OrdersPage />
          </Route>
          <Route path="/order/return">
            <ReturnRequestPage />
          </Route>
          <Route path="/checkout">
            <CheckoutPage />
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
