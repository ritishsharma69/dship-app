import './App.css'
import { lazy, Suspense } from 'react'
import { Route, Switch } from './lib/router'
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

const PaymentPhonePeReturnPage = lazy(() => import('./pages/PaymentPhonePeReturnPage'))

export default function App() {
  return (
    <>
      <TopBar />
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
