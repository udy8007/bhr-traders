import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useCustomer } from "../context/CustomerContext.jsx";
import { AccountFormField, AccountFormShell } from "./CustomerAccountUI.jsx";

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

  const heroEmoji = mode === "register" ? "👤" : "🌾";
  const heroSub = mode === "register" ? "Create your wholesale account" : "Welcome back";
  const formLead =
    loginHint ||
    (mode === "register" ? "Register with email and password to track orders." : "Sign in with your email and password.");

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

        <div className="auth-mode-tabs">
          <button type="button" className={mode === "signin" ? "on" : ""} onClick={() => switchMode("signin")}>
            Sign in
          </button>
          <button type="button" className={mode === "register" ? "on" : ""} onClick={() => switchMode("register")}>
            Register
          </button>
        </div>

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
      </div>
    </div>
  );
}
