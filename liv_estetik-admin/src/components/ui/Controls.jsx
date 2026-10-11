import { FiCheck, FiRefreshCw } from "react-icons/fi";

export const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-stone-100 text-stone-700 border-stone-200",
  canceled: "bg-stone-100 text-stone-700 border-stone-200",
  new: "bg-amber-50 text-amber-700 border-amber-200",
  read: "bg-sky-50 text-sky-700 border-sky-200",
  replied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-stone-100 text-stone-700 border-stone-200",
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unavailable: "bg-stone-100 text-stone-700 border-stone-200",
  reserved: "bg-sky-50 text-sky-700 border-sky-200",
  blocked: "bg-rose-50 text-rose-700 border-rose-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-stone-100 text-stone-700 border-stone-200",
};

export function formatDate(value) {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function getSlotLabel(slot) {
  if (!slot) return "No slot";
  if (typeof slot === "string") return slot;
  const startsAt = slot.startsAt || slot.start || slot.date;
  const endsAt = slot.endsAt || slot.end;
  return `${formatDate(startsAt)}${endsAt ? ` - ${formatDate(endsAt)}` : ""}`;
}

export function getServicesLabel(services) {
  if (!services) return "No services";
  const list = Array.isArray(services) ? services : [services];
  return list.map((service) => service?.name || service?.title || service).join(", ");
}

export function StatusPill({ value }) {
  const key = String(value || "pending").toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${STATUS_STYLES[key] || "bg-stone-100 text-stone-700 border-stone-200"}`}>
      {value || "pending"}
    </span>
  );
}

export function IconButton({ title, icon: Icon, onClick, disabled, tone = "default" }) {
  const tones = {
    default: "border-stone-200 bg-white text-stone-700 hover:border-evergreen-800 hover:text-evergreen-900",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    warn: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      <Icon />
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props) {
  return <input {...props} className={`rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-champagne-500 focus:ring-2 focus:ring-champagne-100 ${props.className || ""}`} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`min-h-24 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-champagne-500 focus:ring-2 focus:ring-champagne-100 ${props.className || ""}`} />;
}

export function Select(props) {
  return <select {...props} className={`rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-champagne-500 focus:ring-2 focus:ring-champagne-100 ${props.className || ""}`} />;
}

export function PrimaryButton({ children, icon: Icon, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-evergreen-900 px-4 py-2 text-sm font-semibold text-champagne-100 transition hover:bg-evergreen-800 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {Icon ? <Icon /> : null}
      {children}
    </button>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
      <p className="font-display text-2xl text-evergreen-900">{title}</p>
      <p className="mt-2 text-sm text-stone-500">{body}</p>
    </div>
  );
}

export function SectionShell({ title, subtitle, action, children }) {
  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-champagne-700">Liv Estetik</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-evergreen-950">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm text-stone-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
