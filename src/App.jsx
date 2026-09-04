import { VisitTracker } from "./components/VisitTracker.jsx";
import { SeoHead } from "./components/SeoHead.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";
import { CustomerProvider } from "./context/CustomerContext.jsx";
import { CustomerLoginModal, CustomerProfileModal } from "./components/CustomerAuth.jsx";
import { Topbar, Navbar } from "./components/Header.jsx";
import { Footer } from "./components/Footer.jsx";
import { CartDrawer, Toast } from "./components/CartDrawer.jsx";
import { CheckoutModal } from "./components/CheckoutModal.jsx";
import { TrackModal } from "./components/TrackModal.jsx";
import { PdpModal } from "./components/PdpModal.jsx";
import { Hero, Services } from "./sections/Hero.jsx";
import { Products } from "./sections/Products.jsx";
import { Guide } from "./sections/GuidePacks.jsx";
import { About, CtaStats, Shop, Location, Enquiry } from "./sections/Content.jsx";
import { RangeShow } from "./sections/Range.jsx";
import { WhyBhr } from "./sections/WhyBhr.jsx";

export default function App() {
  return (
    <CustomerProvider>
      <StoreProvider>
        <SeoHead />
        <VisitTracker />
        <a className="skip-link" href="#home">
          Skip to content
        </a>
        <Topbar />
        <Navbar />
        <main>
          <Hero />
          <Services />
          <Products />
          <Guide />
          <About />
          <RangeShow />
          <WhyBhr />
          <CtaStats />
          <Shop />
          <Location />
          <Enquiry />
        </main>
        <Footer />
        <CartDrawer />
        <PdpModal />
        <CheckoutModal />
        <TrackModal />
        <CustomerLoginModal />
        <CustomerProfileModal />
        <Toast />
      </StoreProvider>
    </CustomerProvider>
  );
}
