import { useEffect, useMemo, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { getStoredSession, clearSession, fetchCurrentUser, setAuthToken } from "./api";
import LoginScreen from "./components/auth/LoginScreen";
import DashboardLayout from "./components/layout/DashboardLayout";
import ActiveView from "./components/ActiveView";
import { ROLE_NAV } from "./dashboardConfig";

export default function Dashboard() {
  const initial = useMemo(() => {
    const stored = getStoredSession();
    if (stored.token) {
      setAuthToken(stored.token);
    }
    return stored;
  }, []);
  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);
  const [activeView, setActiveView] = useState("overview");
  const [checking, setChecking] = useState(Boolean(initial.token));
  const navItems = user?.role ? ROLE_NAV[user.role] || ROLE_NAV.reception : ROLE_NAV.reception;

  useEffect(() => {
    let ignore = false;

    async function checkSession() {
      if (!token) {
        setChecking(false);
        return;
      }

      setChecking(true);
      try {
        const current = await fetchCurrentUser(token);
        if (!ignore) {
          setUser(current);
        }
      } catch {
        clearSession();
        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setChecking(false);
        }
      }
    }

    checkSession();
    return () => {
      ignore = true;
    };
  }, [token]);

  const handleLogin = (nextToken, nextUser) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setActiveView("overview");
  };

  const handleLogout = () => {
    clearSession();
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setActiveView("overview");
  };

  if (!token || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f4ef]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm">
          <FiRefreshCw className="mx-auto animate-spin text-2xl text-champagne-500" />
          <p className="mt-3 text-sm font-semibold text-evergreen-950">Checking staff session</p>
        </div>
      </main>
    );
  }

  return (
    <DashboardLayout user={user} navItems={navItems} activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout}>
      <ActiveView view={activeView} user={user} role={user.role} setActiveView={setActiveView} />
    </DashboardLayout>
  );
}
