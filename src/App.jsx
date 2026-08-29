import { VisitTracker } from "./components/VisitTracker.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";
import { Topbar, Navbar } from "./components/Header.jsx";
import { Footer } from "./components/Footer.jsx";
import { CartDrawer, Toast } from "./components/CartDrawer.jsx";
import { TrackModal } from "./components/TrackModal.jsx";
import { CheckoutModal } from "./components/CheckoutModal.jsx";
import { PdpModal } from "./components/PdpModal.jsx";
import { Hero, Services } from "./sections/Hero.jsx";
import { Products } from "./sections/Products.jsx";
import { Guide, Packs } from "./sections/GuidePacks.jsx";
import { About, Quality, Testimonials, CtaStats, Shop, Location, Enquiry } from "./sections/Content.jsx";

export default function App() {
  return (
    <StoreProvider>
      <VisitTracker />
      <Topbar />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Products />
        <Guide />
        <Packs />
        <About />
        <Quality />
        <Testimonials />
        <CtaStats />
        <Shop />
        <Location />
        <Enquiry />
      </main>
      <Footer />
      <CartDrawer />
      <PdpModal />
      <TrackModal />
      <CheckoutModal />
      <Toast />
    </StoreProvider>
  );
}
