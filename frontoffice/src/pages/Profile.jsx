import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { api } from "../lib/api.js";
import { useCustomer } from "../context/CustomerContext.jsx";
import { MyOrdersPanel, ProfileTabHero, AccountFormField, AccountFormShell, AccountFormActions, AccountUserChip, PROFILE_TAB_META } from "../components/CustomerAccountUI.jsx";

export function Profile() {
  const { customer, isLoggedIn, openLogin, logout, updateProfile } = useCustomer();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") || "profile");
  const [profile, setProfile] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewKey, setReviewKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next = searchParams.get("tab");
    if (next) setTab(next);
  }, [searchParams]);

  useEffect(() => {
    if (!isLoggedIn) {
      openLogin({ hint: "Sign in or register to view your orders and profile." });
      return;
    }
    setProfile({
      name: customer?.name || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      city: customer?.city || "",
      pincode: customer?.pincode || ""
    });
    setPasswordForm({ current: "", next: "", confirm: "" });
    setLoading(true);
    api
      .customerOrders()
      .then((res) => setOrders(res.orders || []))
      .catch((err) => setMsg(err.message))
      .finally(() => setLoading(false));
  }, [isLoggedIn, customer, openLogin]);

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await updateProfile(profile);
      setMsg("Profile saved.");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveAddress(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await updateProfile({
        address: profile.address,
        city: profile.city,
        pincode: profile.pincode
      });
      setMsg("Delivery address saved.");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setMsg("New passwords do not match.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await api.changeCustomerPassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next
      });
      setPasswordForm({ current: "", next: "", confirm: "" });
      setMsg("Password updated.");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  function reloadOrders() {
    api.customerOrders().then((res) => setOrders(res.orders || []));
  }

  function switchTab(next) {
    setTab(next);
    setMsg("");
  }

  const tabLabels = Object.fromEntries(Object.entries(PROFILE_TAB_META).map(([k, v]) => [k, v.title]));

  if (!isLoggedIn) {
    return (
      <MobileLayout title="Profile">
        <div className="account-empty-state account-empty-state-page">
          <span className="account-empty-emoji" aria-hidden="true">
            👤
          </span>
          <strong>Sign in to your account</strong>
          <p>View orders, update address, and leave product reviews.</p>
          <button type="button" className="btn btn-accent" onClick={() => openLogin()}>
            Sign in / Register
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={tabLabels[tab] || "My profile"}>
      <div className="profile-page">
        <ProfileTabHero tab={tab} customer={customer} />

        <div className="profile-tabs profile-tabs-icons profile-tabs-grid">
          <button type="button" className={tab === "profile" ? "on" : ""} onClick={() => switchTab("profile")}>
            <span aria-hidden="true">👤</span> Profile
          </button>
          <button type="button" className={tab === "orders" ? "on" : ""} onClick={() => switchTab("orders")}>
            <span aria-hidden="true">📦</span> Orders
          </button>
          <button type="button" className={tab === "address" ? "on" : ""} onClick={() => switchTab("address")}>
            <span aria-hidden="true">📍</span> Delivery
          </button>
          <button type="button" className={tab === "password" ? "on" : ""} onClick={() => switchTab("password")}>
            <span aria-hidden="true">🔒</span> Password
          </button>
        </div>

        {msg ? <p className={"account-toast" + (/fail|incorrect|invalid|match/i.test(msg) ? " err" : " ok")}>{msg}</p> : null}

        {tab === "password" ? (
          <form onSubmit={savePassword}>
            <AccountFormShell
              lead="Choose a strong password you don't use elsewhere."
              footer={<AccountFormActions primaryLabel="Update password" primaryBusy={busy} />}
            >
              <AccountFormField icon="🔒" label="Current password" required>
                <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} required autoComplete="current-password" placeholder="Enter current password" />
              </AccountFormField>
              <AccountFormField icon="✨" label="New password" required hint="At least 6 characters">
                <input type="password" value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} required minLength={6} autoComplete="new-password" placeholder="Create new password" />
              </AccountFormField>
              <AccountFormField icon="✓" label="Confirm new password" required>
                <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} required minLength={6} autoComplete="new-password" placeholder="Re-enter new password" />
              </AccountFormField>
            </AccountFormShell>
          </form>
        ) : tab === "address" ? (
          <form onSubmit={saveAddress}>
            <AccountFormShell
              lead="We'll use this address for all future deliveries."
              footer={<AccountFormActions primaryLabel="Save delivery address" primaryBusy={busy} />}
            >
              <AccountFormField icon="🏠" label="Street address" required>
                <textarea rows={3} value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} required placeholder="Door no, street, area, landmark" />
              </AccountFormField>
              <div className="account-form-row">
                <AccountFormField icon="🌆" label="City" required>
                  <input value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} required placeholder="City" />
                </AccountFormField>
                <AccountFormField icon="📮" label="Pincode" required>
                  <input value={profile.pincode} onChange={(e) => setProfile((p) => ({ ...p, pincode: e.target.value }))} required placeholder="Pincode" inputMode="numeric" />
                </AccountFormField>
              </div>
            </AccountFormShell>
          </form>
        ) : tab === "profile" ? (
          <form onSubmit={saveProfile}>
            <AccountFormShell
              lead="Update how we address you on invoices and orders."
              footer={<AccountFormActions primaryLabel="Save profile" primaryBusy={busy} secondary={logout} secondaryLabel="Sign out" />}
            >
              <AccountUserChip customer={customer} />
              <AccountFormField icon="👤" label="Full name">
                <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Your full name" autoComplete="name" />
              </AccountFormField>
              <AccountFormField icon="📱" label="Phone" hint="For delivery updates">
                <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 mobile number" autoComplete="tel" inputMode="tel" />
              </AccountFormField>
              <AccountFormField icon="✉️" label="Email" hint="Email cannot be changed">
                <input value={customer?.email || ""} readOnly disabled className="is-readonly" />
              </AccountFormField>
            </AccountFormShell>
          </form>
        ) : (
          <>
            <MyOrdersPanel orders={orders} loading={loading} reviewKey={reviewKey} setReviewKey={setReviewKey} onReload={reloadOrders} />
            {!loading && !orders.length ? (
              <Link to="/shop" className="btn btn-accent btn-block account-shop-link">
                Start shopping
              </Link>
            ) : null}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
