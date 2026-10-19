import { FiLogOut, FiSettings } from "react-icons/fi";

export default function DashboardLayout({ user, navItems, activeView, setActiveView, onLogout, children }) {
  return (
    <main className="min-h-screen bg-[#f7f4ef] text-stone-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-stone-200 bg-evergreen-950 text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <img src="/image/logo_liv-removebg-preview.png" alt="Liv Estetik" className="h-auto w-32" />
            <button
              type="button"
              onClick={() => setActiveView("account")}
              className={`mt-5 w-full rounded-lg border transition ${
                activeView === "account"
                  ? "border-champagne-500 bg-champagne-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              } p-3 text-left`}
            >
              <p className="text-sm font-semibold text-champagne-100">{user?.name || "Staff member"}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/45">{user?.role}</p>
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
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${active ? "bg-champagne-500 text-evergreen-950" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
                >
                  <Icon />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto p-3">
            <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/8 hover:text-white">
              <FiLogOut />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="no-print sticky top-0 z-10 border-b border-stone-200 bg-[#f7f4ef]/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/image/logo_liv-removebg-preview.png" alt="Liv Estetik" className="h-10 w-auto lg:hidden" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-evergreen-950">{user?.name || "Staff member"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("account")}
                title="Account settings"
                className="inline-flex items-center justify-center rounded-md border border-stone-200 bg-white p-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                <FiSettings />
              </button>
              <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
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
                  className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${activeView === item.id ? "bg-evergreen-900 text-champagne-100" : "bg-white text-stone-600"}`}
                >
                  <Icon />
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
      </div>
    </main>
  );
}
