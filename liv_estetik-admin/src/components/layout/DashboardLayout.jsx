import { FiLogOut, FiSettings } from "react-icons/fi";
import BrandLogo from "../BrandLogo";

export default function DashboardLayout({ user, navItems, activeView, setActiveView, onLogout, children }) {
  return (
    <main className="admin-shell min-h-screen text-stone-900">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-stone-200 lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-stone-200 p-5">
            <BrandLogo className="dashboard-logo" />
            <button
              type="button"
              onClick={() => setActiveView("account")}
              className={`mt-5 w-full rounded-lg border transition ${
                activeView === "account"
                  ? "border-evergreen-900/15 bg-evergreen-900/5"
                  : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
              } p-3 text-left`}
            >
              <p className="text-sm font-semibold text-evergreen-950">{user?.name || "Staff member"}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">{user?.role}</p>
            </button>
          </div>
          <nav className="grid gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${active ? "bg-evergreen-900 text-white shadow-sm" : "text-stone-600 hover:bg-white hover:text-evergreen-950"}`}
                >
                  <Icon />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto p-3">
            <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-white hover:text-evergreen-950">
              <FiLogOut />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="admin-topbar no-print sticky top-0 z-10 border-b border-stone-200 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLogo className="dashboard-logo dashboard-logo-mobile lg:hidden" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-evergreen-950">{user?.name || "Staff member"}<span className="ml-2 text-xs font-normal capitalize text-stone-500">· {user?.role}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("account")}
                title="Account settings"
                className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                <FiSettings />
              </button>
              <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
                <FiLogOut />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${activeView === item.id ? "bg-evergreen-900 text-white" : "bg-white text-stone-600"}`}
                >
                  <Icon />
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </main>
  );
}
