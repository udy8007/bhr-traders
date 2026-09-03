import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useCustomer } from "../context/CustomerContext.jsx";
import { MyOrdersPanel, ProfileTabHero, AccountFormField, AccountFormShell, AccountFormActions, AccountUserChip } from "./CustomerAccountUI.jsx";

export function CustomerLoginModal() {
  const { loginOpen, closeLogin, completeLogin, loginHint } = useCustomer();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [fieldErr, setFieldErr] = useState("");

  useEffect(() => {
    if (!loginOpen) {
      setMode("signin");
      setEmail("");
      setPassword("");
      setConfirm("");
      setName("");
      setPhone("");
      setMsg("");
      setFieldErr("");
    }
  }, [loginOpen]);

  if (!loginOpen) return null;

  function switchMode(next) {
    setMode(next);
    setMsg("");
    setFieldErr("");
    setPassword("");
    setConfirm("");
  }

  function isError(text) {
    return /invalid|required|failed|exists|least|password|email|registered|already|sign in/i.test(String(text || ""));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setFieldErr("");
    try {
      if (mode === "register") {
        if (password !== confirm) {
          setMsg("Passwords do not match.");
          setFieldErr("confirm");
          return;
        }
        const res = await api.registerCustomer({ email: email.trim(), password, name: name.trim(), phone: phone.trim() });
        completeLogin(res.token, res.customer);
      } else {
        const res = await api.loginCustomer({ email: email.trim(), password });
        completeLogin(res.token, res.customer);
      }
    } catch (err) {
      setMsg(err.message);
      setFieldErr(err.field || "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "register" ? "Register" : "Sign in"}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLogin();
      }}
    >
      <div className="modal-box customer-auth-box">
        <div className="auth-hero auth-hero-desktop">
          <span className="auth-hero-emoji" aria-hidden="true">🌾</span>
          <div>
            <strong>BHR Traders</strong>
            <span>{mode === "register" ? "Wholesale customer account" : "Sign in to your account"}</span>
          </div>
        </div>

        <div className="modal-head">
          <h2>{mode === "register" ? "Create account" : "Sign in"}</h2>
          <button type="button" className="modal-close" onClick={closeLogin} aria-label="Close">
            ×
          </button>
        </div>

        {loginHint ? <p className="customer-auth-hint">{loginHint}</p> : null}

        <div className="auth-mode-tabs">
          <button type="button" className={mode === "signin" ? "on" : ""} onClick={() => switchMode("signin")}>
            Sign in
          </button>
          <button type="button" className={mode === "register" ? "on" : ""} onClick={() => switchMode("register")}>
            Register
          </button>
        </div>

        <form onSubmit={submit}>
          <p className="customer-auth-sub">
            {mode === "register" ? "Register with email and password." : "Sign in with your email and password."}
          </p>

          {mode === "register" ? (
            <>
              <label className="field">
                <span>Full name *</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </label>
              <label className={"field" + (fieldErr === "phone" ? " field-err" : "")}>
                <span>Phone *</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" placeholder="+91 …" />
              </label>
            </>
          ) : null}

          <label className={"field" + (fieldErr === "email" ? " field-err" : "")}>
            <span>Email *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>

          <label className={"field" + (fieldErr === "password" || fieldErr === "confirm" ? " field-err" : "")}>
            <span>Password *</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={6}
              placeholder="At least 6 characters"
            />
          </label>

          {mode === "register" ? (
            <label className={"field" + (fieldErr === "confirm" ? " field-err" : "")}>
              <span>Confirm password *</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" minLength={6} />
            </label>
          ) : null}

          {msg ? <p className={"customer-auth-msg" + (isError(msg) ? " err" : "")}>{msg}</p> : null}

          <button className="btn btn-green btn-block" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
          </button>

          <p className="auth-switch">
            {mode === "signin" ? (
              <>
                New customer?{" "}
                <button type="button" className="link-btn inline" onClick={() => switchMode("register")}>
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" className="link-btn inline" onClick={() => switchMode("signin")}>
                  Sign in here
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}

export function CustomerProfileModal() {
  const { profileOpen, setProfileOpen, profileTab, setProfileTab, customer, isLoggedIn, openLogin, logout, updateProfile } = useCustomer();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewKey, setReviewKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profileTab) setTab(profileTab);
  }, [profileTab, profileOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    if (!isLoggedIn) {
      setProfileOpen(false);
      openLogin({ hint: "Sign in to view your profile and orders." });
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
  }, [profileOpen, isLoggedIn, customer, openLogin, setProfileOpen]);

  if (!profileOpen) return null;

  function switchTab(next) {
    setTab(next);
    setProfileTab(next);
    setMsg("");
  }

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

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-label="My account"
      onClick={(e) => {
        if (e.target === e.currentTarget) setProfileOpen(false);
      }}
    >
      <div className="modal-box customer-profile-box">
        <ProfileTabHero tab={tab} customer={customer} onClose={() => setProfileOpen(false)} />

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
          <MyOrdersPanel
            orders={orders}
            loading={loading}
            reviewKey={reviewKey}
            setReviewKey={setReviewKey}
            onReload={reloadOrders}
          />
        )}
      </div>
    </div>
  );
}
