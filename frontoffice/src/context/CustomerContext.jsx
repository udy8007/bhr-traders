import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setCustomerToken } from "../lib/api.js";
import { clearSession, loadProfile, loadToken, saveSession } from "../lib/customerSession.js";

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(() => loadProfile());
  const [token, setToken] = useState(() => loadToken());
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginHint, setLoginHint] = useState("");
  const [loginCallback, setLoginCallback] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const isLoggedIn = Boolean(token);

  useEffect(() => {
    setCustomerToken(token);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api
      .customerMe()
      .then((res) => {
        if (res.customer) {
          setCustomer(res.customer);
          saveSession(token, res.customer);
        }
      })
      .catch(() => {
        /* keep cached profile */
      });
  }, [token]);

  const openLogin = useCallback(({ hint, onDone } = {}) => {
    setLoginHint(hint || "");
    setLoginCallback(() => onDone || null);
    setLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    setLoginHint("");
    setLoginCallback(null);
  }, []);

  const completeLogin = useCallback((newToken, newCustomer) => {
    saveSession(newToken, newCustomer);
    setCustomerToken(newToken);
    setToken(newToken);
    setCustomer(newCustomer);
    setLoginOpen(false);
    setLoginHint("");
    const cb = loginCallback;
    setLoginCallback(null);
    if (cb) cb(newCustomer);
  }, [loginCallback]);

  const requireLogin = useCallback(
    (onDone, hint) => {
      if (isLoggedIn) {
        onDone?.(customer);
        return;
      }
      openLogin({ hint, onDone });
    },
    [isLoggedIn, customer, openLogin]
  );

  const logout = useCallback(() => {
    clearSession();
    setCustomerToken("");
    setToken("");
    setCustomer(null);
    setProfileOpen(false);
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      const res = await api.updateCustomer(patch);
      setCustomer(res.customer);
      saveSession(token, res.customer);
      return res.customer;
    },
    [token]
  );

  const refreshProfile = useCallback(async () => {
    const res = await api.customerMe();
    setCustomer(res.customer);
    saveSession(token, res.customer);
    return res.customer;
  }, [token]);

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoggedIn,
        loginOpen,
        loginHint,
        profileOpen,
        setProfileOpen,
        openLogin,
        closeLogin,
        completeLogin,
        requireLogin,
        logout,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer outside CustomerProvider");
  return ctx;
}
