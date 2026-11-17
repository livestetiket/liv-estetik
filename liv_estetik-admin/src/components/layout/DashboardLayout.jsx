import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiX,
  FiBell,
} from "react-icons/fi";
import BrandLogo from "../BrandLogo";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../../api";

const GROUPS = [
  { label: "Workspace", ids: ["overview"] },
  { label: "Appointments", ids: ["bookings", "patients", "calls", "visits", "messages", "slots"] },
  { label: "Clinic", ids: ["users", "roles", "services", "testimonials", "emails", "reports", "audit", "settings"] },
];

const VIEW_LABELS = {
  overview: "Overview",
  bookings: "Bookings",
  patients: "Patients",
  calls: "Call activity",
  visits: "Daily visits",
  messages: "Messages",
  slots: "Time slots",
  users: "Users",
  roles: "Role management",
  services: "Services",
  testimonials: "Testimonials",
  emails: "Email notifications",
  audit: "Audit logs",
  reports: "Reports",
  settings: "Clinic settings",
  account: "Account settings",
};

function Navigation({ items, activeView, setActiveView, collapsed, onNavigate }) {
  return (
    <nav className="admin-navigation" aria-label="Workspace navigation">
      {GROUPS.map((group) => {
        const groupItems = items.filter((item) => group.ids.includes(item.id));
        if (!groupItems.length) return null;

        return (
          <div className="admin-nav-group" key={group.label}>
            {!collapsed ? <p className="admin-nav-label">{group.label}</p> : null}
            {groupItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setActiveView(item.id);
                    onNavigate();
                  }}
                  className={`admin-nav-item${active ? " is-active" : ""}`}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ user, navItems, activeView, setActiveView, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationData, setNotificationData] = useState({ notifications: [], unreadCount: 0 });
  const currentLabel = VIEW_LABELS[activeView] || "Workspace";
  const today = useMemo(
    () => new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "Africa/Addis_Ababa",
    }).format(new Date()),
    [],
  );

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeView]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

  const refreshNotifications = useCallback(async () => {
    try { setNotificationData(await getNotifications()); } catch { /* keep the last count if the API is temporarily unavailable */ }
  }, []);

  useEffect(() => {
    refreshNotifications();
    const timer = window.setInterval(refreshNotifications, 60000);
    return () => window.clearInterval(timer);
  }, [refreshNotifications]);

  const openNotification = async (notification) => {
    const id = notification.id || notification._id;
    if (!notification.readAt) {
      try { await markNotificationRead(id); } catch { /* opening a record should still work */ }
    }
    const view = { Booking: "bookings", Customer: "patients", PrpCourse: "patients", Message: "messages", CallActivity: "calls", Role: "roles", User: "users", ClinicSettings: "settings", EmailNotification: "emails" }[notification.entityType];
    if (view) setActiveView(view);
    setNotificationsOpen(false);
    refreshNotifications();
  };

  const markAllRead = async () => {
    try { await markAllNotificationsRead(); await refreshNotifications(); } catch { /* keep the current notifications visible */ }
  };

  return (
    <div className={`admin-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      {mobileNavOpen ? (
        <button
          type="button"
          className="admin-mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside className={`admin-sidebar${mobileNavOpen ? " is-open" : ""}`} aria-label="Main sidebar">
        <div className="admin-sidebar-top">
          <button type="button" className="admin-brand" onClick={() => setActiveView("overview")} aria-label="Liv Estetik workspace overview">
            <BrandLogo className="dashboard-logo" />
          </button>
          <button
            type="button"
            className="admin-collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FiChevronRight aria-hidden="true" /> : <FiChevronLeft aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="admin-mobile-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveView("account")}
          className={`admin-profile${activeView === "account" ? " is-active" : ""}`}
          title={collapsed ? `${user?.name || "Staff member"} · ${user?.role || "staff"}` : undefined}
        >
          <span className="admin-avatar" aria-hidden="true">{(user?.name || "S").trim().charAt(0).toUpperCase()}</span>
          <span className="admin-profile-copy">
            <strong>{user?.name || "Staff member"}</strong>
            <small>{user?.role || "staff"}</small>
          </span>
          <FiSettings className="admin-profile-settings" aria-hidden="true" />
        </button>

        <Navigation
          items={navItems}
          activeView={activeView}
          setActiveView={setActiveView}
          collapsed={collapsed}
          onNavigate={() => setMobileNavOpen(false)}
        />

        <div className="admin-sidebar-bottom">
          <div className="admin-location">
            <FiClock aria-hidden="true" />
            <span>Addis Ababa · EAT</span>
          </div>
          <button type="button" className="admin-logout" onClick={onLogout} title={collapsed ? "Sign out" : undefined}>
            <FiLogOut aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-leading">
            <button
              type="button"
              className="admin-mobile-menu"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
            >
              <FiMenu aria-hidden="true" />
            </button>
            <div className="admin-breadcrumb">
              <span>Workspace</span>
              <span aria-hidden="true">/</span>
              <strong>{currentLabel}</strong>
            </div>
          </div>
          <div className="admin-topbar-actions">
            <p className="admin-date">{today}</p>
            <div className="relative">
              <button type="button" className="admin-quick-action relative" aria-label={`Notifications${notificationData.unreadCount ? `, ${notificationData.unreadCount} unread` : ""}`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); refreshNotifications(); }}>
                <FiBell aria-hidden="true" /><span>Alerts</span>
                {notificationData.unreadCount ? <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-rose-700 px-1 text-[10px] font-bold text-white">{notificationData.unreadCount > 99 ? "99+" : notificationData.unreadCount}</span> : null}
              </button>
              {notificationsOpen ? <section className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3"><div><h2 className="font-semibold text-evergreen-950">Notifications</h2><p className="text-xs text-stone-500">{notificationData.unreadCount} unread</p></div><button type="button" className="text-xs font-semibold text-evergreen-800 underline disabled:text-stone-400" onClick={markAllRead} disabled={!notificationData.unreadCount}>Mark all read</button></div>
                <div className="max-h-[65vh] overflow-y-auto">{notificationData.notifications.length ? notificationData.notifications.map((notification) => <button key={notification.id || notification._id} type="button" onClick={() => openNotification(notification)} className={`block w-full border-b border-stone-100 px-4 py-3 text-left hover:bg-stone-50 ${notification.readAt ? "bg-white" : "bg-amber-50/50"}`}><span className="flex items-start justify-between gap-3"><strong className="text-sm text-evergreen-950">{notification.title}</strong>{!notification.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-champagne-700" aria-label="Unread" /> : null}</span><span className="mt-1 block text-xs leading-5 text-stone-600">{notification.message}</span><time className="mt-1 block text-[11px] text-stone-400">{new Date(notification.createdAt).toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" })} EAT</time></button>) : <p className="px-4 py-8 text-center text-sm text-stone-500">No notifications yet.</p>}</div>
              </section> : null}
            </div>
            <button type="button" className="admin-quick-action" onClick={() => setActiveView("bookings")}>
              <FiCalendar aria-hidden="true" />
              <span>Bookings</span>
            </button>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
