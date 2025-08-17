import './App.css'
import MainPage from './pages/MainPage'
import CheckoutPage from './pages/CheckoutPage'
import SuccessPage from './pages/SuccessPage' // legacy
import OrderSuccessPage from './pages/OrderSuccessPage'
// import OrderTrackPage from './pages/OrderTrackPage' // temporarily disabled
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import OrdersPage from './pages/OrdersPage'
import ReturnRequestPage from './pages/ReturnRequestPage'
import { Route, Switch } from './lib/router'
import TopBar from './components/TopBar'

export default function App() {
  return (
    <>
      <TopBar />
      <Switch>
        <Route path="/">
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
    </>
  )
}
