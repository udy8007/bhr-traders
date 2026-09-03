import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext.jsx";
import { CustomerProvider } from "./context/CustomerContext.jsx";
import { CustomerLoginModal } from "./components/CustomerLoginModal.jsx";
import { Home } from "./pages/Home.jsx";
import { Shop } from "./pages/Shop.jsx";
import { ProductDetail } from "./pages/ProductDetail.jsx";
import { Cart } from "./pages/Cart.jsx";
import { Checkout } from "./pages/Checkout.jsx";
import { Contact } from "./pages/Contact.jsx";
import { Track } from "./pages/Track.jsx";
import { Profile } from "./pages/Profile.jsx";

export default function App() {
  return (
    <CustomerProvider>
      <StoreProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track" element={<Track />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
        <CustomerLoginModal />
      </StoreProvider>
    </CustomerProvider>
  );
}
