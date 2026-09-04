import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useCustomer } from "../context/CustomerContext.jsx";
import { AccountFormField, AccountFormShell } from "./CustomerAccountUI.jsx";

export function CustomerLoginModal() {
  const { loginOpen, closeLogin, completeLogin, loginHint, loginMode } = useCustomer();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [fieldErr, setFieldErr] = useState("");
  const [accountLocked, setAccountLocked] = useState(false);
  const [unlockRequested, setUnlockRequested] = useState(false);
  const [unlockNote, setUnlockNote] = useState("");

  useEffect(() => {
    if (loginOpen) {
      setMode(loginMode === "register" ? "register" : "signin");
      return;
    }
    if (!loginOpen) {
      setMode("signin");
      setEmail("");
      setPassword("");
      setConfirm("");
      setName("");
      setPhone("");
      setMsg("");
      setFieldErr("");
      setAccountLocked(false);
      setUnlockRequested(false);
      setUnlockNote("");
    }
  }, [loginOpen, loginMode]);

  if (!loginOpen) return null;

  function switchMode(next) {
    setMode(next);
    setMsg("");
    setFieldErr("");
    setPassword("");
    setConfirm("");
    setAccountLocked(false);
    setUnlockRequested(false);
  }

  function isError(text) {
    return /invalid|required|failed|exists|least|password|email|registered|already|sign in|locked|attempt/i.test(String(text || ""));
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
      if (err.code === "ACCOUNT_LOCKED") {
        setAccountLocked(true);
        setUnlockRequested(false);
      }
      setMsg(err.message);
      setFieldErr(err.field || "");
    } finally {
      setBusy(false);
    }
  }

  async function requestUnlock() {
    setBusy(true);
    setMsg("");
    try {
      const res = await api.requestAccountUnlock({
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim(),
        message: unlockNote.trim() || "Please unlock my BHR Traders account."
      });
      setUnlockRequested(true);
      setMsg(res.message || "Unlock request sent to admin.");
    } catch (err) {
      setMsg(err.message);
      setFieldErr(err.field || "");
    } finally {
      setBusy(false);
    }
  }

  const heroEmoji = mode === "register" ? "👤" : accountLocked ? "🔒" : "🌾";
  const heroSub = mode === "register" ? "Create your wholesale account" : accountLocked ? "Account locked" : "Welcome back";
  const formLead =
    loginHint ||
    (accountLocked
      ? "Too many wrong passwords. Request admin help to unlock your account."
      : mode === "register"
        ? "Register with email and password to track orders."
        : "Sign in with your email and password.");

  return (
    <div className={"auth-sheet" + (loginOpen ? " open" : "")}>
      <div className="auth-sheet-backdrop" onClick={closeLogin} aria-hidden="true" />
      <div className="auth-sheet-panel" role="dialog" aria-modal="true" aria-label={mode === "register" ? "Register" : "Sign in"}>
        <div className="auth-hero">
          <div className="auth-hero-icon" aria-hidden="true">
            {heroEmoji}
          </div>
          <div className="auth-hero-text">
            <strong>BHR Traders</strong>
            <span>{heroSub}</span>
            <small>{mode === "register" ? "Register" : "Sign in"}</small>
          </div>
          <button type="button" className="auth-hero-close" onClick={closeLogin} aria-label="Close">
            ×
          </button>
        </div>

        {!accountLocked ? (
          <div className="auth-mode-tabs">
            <button type="button" className={mode === "signin" ? "on" : ""} onClick={() => switchMode("signin")}>
              Sign in
            </button>
            <button type="button" className={mode === "register" ? "on" : ""} onClick={() => switchMode("register")}>
              Register
            </button>
          </div>
        ) : null}

        {accountLocked ? (
          <div className="auth-locked-panel">
            <div className="auth-locked-card">
              <span className="auth-locked-icon" aria-hidden="true">🛡️</span>
              <h3>Profile locked for security</h3>
              <p>After {5} failed sign-in attempts, your account is temporarily locked.</p>
              {!unlockRequested ? (
                <>
                  <AccountFormField icon="✉️" label="Account email">
                    <input type="email" value={email} readOnly />
                  </AccountFormField>
                  <AccountFormField icon="👤" label="Your name">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" />
                  </AccountFormField>
                  <AccountFormField icon="📱" label="Phone (optional)">
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 mobile number" autoComplete="tel" />
                  </AccountFormField>
                  <AccountFormField icon="💬" label="Message to admin">
                    <textarea
                      rows={3}
                      value={unlockNote}
                      onChange={(e) => setUnlockNote(e.target.value)}
                      placeholder="Briefly explain if needed…"
                    />
                  </AccountFormField>
                  {msg ? <p className={"auth-msg" + (isError(msg) ? " err" : " ok")}>{msg}</p> : null}
                  <button type="button" className="btn btn-gold btn-block auth-submit" disabled={busy || !email.trim()} onClick={requestUnlock}>
                    {busy ? "Sending…" : "Request admin to unlock"}
                  </button>
                </>
              ) : (
                <div className="auth-locked-success">
                  <p className="auth-msg ok">{msg || "Unlock request sent. Our team will contact you shortly."}</p>
                  <p className="auth-locked-note">You can also call us from the Contact section on Home.</p>
                </div>
              )}
              <button type="button" className="auth-link auth-locked-back" onClick={() => { setAccountLocked(false); setMsg(""); }}>
                ← Back to sign in
              </button>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <AccountFormShell
              lead={formLead}
              footer={
                <>
                  {msg ? <p className={"auth-msg" + (isError(msg) ? " err" : " ok")}>{msg}</p> : null}
                  <button className="btn btn-gold btn-block auth-submit" type="submit" disabled={busy}>
                    {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
                  </button>
                  <p className="auth-switch">
                    {mode === "signin" ? (
                      <>
                        New here?{" "}
                        <button type="button" className="auth-link" onClick={() => switchMode("register")}>
                          Register
                        </button>
                      </>
                    ) : (
                      <>
                        Have an account?{" "}
                        <button type="button" className="auth-link" onClick={() => switchMode("signin")}>
                          Sign in
                        </button>
                      </>
                    )}
                  </p>
                </>
              }
            >
              {mode === "register" ? (
                <>
                  <AccountFormField icon="👤" label="Full name" required>
                    <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Your full name" />
                  </AccountFormField>
                  <AccountFormField icon="📱" label="Phone" required hint={fieldErr === "phone" ? "Phone already registered" : undefined}>
                    <input
                      className={fieldErr === "phone" ? "is-err" : ""}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      autoComplete="tel"
                      placeholder="+91 mobile number"
                      inputMode="tel"
                    />
                  </AccountFormField>
                </>
              ) : null}

              <AccountFormField icon="✉️" label="Email" required>
                <input
                  className={fieldErr === "email" ? "is-err" : ""}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                />
              </AccountFormField>

              <AccountFormField icon="🔒" label="Password" required hint="At least 6 characters">
                <input
                  className={fieldErr === "password" || fieldErr === "confirm" ? "is-err" : ""}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  minLength={6}
                  placeholder="Enter password"
                />
              </AccountFormField>

              {mode === "register" ? (
                <AccountFormField icon="✓" label="Confirm password" required>
                  <input
                    className={fieldErr === "confirm" ? "is-err" : ""}
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="Re-enter password"
                  />
                </AccountFormField>
              ) : null}
            </AccountFormShell>
          </form>
        )}
      </div>
    </div>
  );
}
