import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.className = "bhr-graphic";
    return () => {
      document.body.className = "g-sidenav-show bhr-graphic";
    };
  }, []);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.login(email, password);
      login(res.token, res.user);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="main-content mt-0">
      <div className="page-header min-vh-100 bhr-login-bg">
        <div className="container my-auto">
          <div className="row">
            <div className="col-lg-4 col-md-8 col-12 mx-auto">
              <div className="card z-index-0 bhr-login-card">
                <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                  <div className="bhr-login-head border-radius-lg py-4 pe-1">
                    <p className="text-center mb-1 bhr-hero-kicker">Wholesale rice · Chennai</p>
                    <h4 className="text-white font-weight-bolder text-center mt-1 mb-0">Sign in</h4>
                    <p className="text-white text-sm text-center mb-2">BHR Traders backoffice</p>
                  </div>
                </div>
                <div className="card-body">
                  <form className="text-start" onSubmit={onSubmit}>
                    <div className={"input-group input-group-outline my-3" + (email ? " is-filled" : "")}>
                      <label className="form-label">Email</label>
                      <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className={"input-group input-group-outline mb-3" + (password ? " is-filled" : "")}>
                      <label className="form-label">Password</label>
                      <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error ? <p className="text-danger text-sm">{error}</p> : null}
                    <div className="text-center">
                      <button type="submit" className="btn bg-gradient-warning w-100 my-4 mb-2" disabled={busy}>
                        {busy ? "Signing in…" : "Sign in"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
