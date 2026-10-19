import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiRefreshCw, FiSave, FiTrash2 } from "react-icons/fi";
import { getClinicSettings, updateClinicSettings } from "../api";
import { Field, TextInput, PrimaryButton, SectionShell, IconButton, EmptyState } from "../components/ui/Controls";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_WINDOWS = [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startMinute: 540, endMinute: 1050 })).concat({ dayOfWeek: 6, startMinute: 540, endMinute: 750 });
const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const toMinutes = (time) => { const [hour, minute] = time.split(":").map(Number); return hour * 60 + minute; };

export default function ClinicSettings() {
  const [windows, setWindows] = useState(DEFAULT_WINDOWS);
  const [breaks, setBreaks] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [reportSettings, setReportSettings] = useState({ reportSchedulesEnabled: false, reportDailyTime: "20:00", reportWeeklyDay: 0, reportWeeklyTime: "20:00", reportMonthlyTime: "20:00" });
  const [blockedDate, setBlockedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await getClinicSettings(); setWindows(data.operatingWindows || []); setBreaks(data.breaks || []); setBlockedDates(data.blockedLocalDates || []); setReportSettings({ reportSchedulesEnabled: Boolean(data.reportSchedulesEnabled), reportDailyTime: data.reportDailyTime || "20:00", reportWeeklyDay: data.reportWeeklyDay ?? 0, reportWeeklyTime: data.reportWeeklyTime || "20:00", reportMonthlyTime: data.reportMonthlyTime || "20:00" }); }
    catch (err) { setError(err.message || "Unable to load clinic settings."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setWindow = (day, field, value) => {
    setWindows((current) => {
      const found = current.find((item) => item.dayOfWeek === day);
      if (!found) return [...current, { dayOfWeek: day, startMinute: 540, endMinute: 1020, [field]: value }].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      return current.map((item) => item.dayOfWeek === day ? { ...item, [field]: value } : item);
    });
  };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try { await updateClinicSettings({ operatingWindows: windows, breaks, blockedLocalDates: blockedDates, ...reportSettings }); setNotice("Clinic schedule and report schedule saved. New availability uses these settings; scheduled reports require the hosting cron job to be configured."); }
    catch (err) { setError(err.message || "Unable to save clinic settings."); }
    finally { setSaving(false); }
  };

  const addBlockedDate = () => { if (blockedDate && !blockedDates.includes(blockedDate)) setBlockedDates([...blockedDates, blockedDate].sort()); setBlockedDate(""); };

  return <SectionShell title="Clinic settings" subtitle="Manage bookable hours and planned closures. Times and report periods use Africa/Addis_Ababa (EAT)." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Loading…" : "Refresh"}</PrimaryButton>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
    <form onSubmit={save} className="grid gap-5">
      <section className="rounded-lg border border-stone-200 bg-white p-4"><h2 className="font-display text-xl font-semibold text-evergreen-950">Operating hours</h2><p className="mb-3 mt-1 text-sm text-stone-500">The starting values reflect the hours already used by the slot generator. Adjust them to the clinic’s confirmed schedule.</p>
        <div className="grid gap-3">{DAYS.map((day, dayOfWeek) => { const window = windows.find((item) => item.dayOfWeek === dayOfWeek); return <div key={day} className="grid gap-2 border-t border-stone-100 pt-3 sm:grid-cols-[8rem_auto_1fr_1fr] sm:items-end"><label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-evergreen-950"><input type="checkbox" checked={Boolean(window)} onChange={(e) => e.target.checked ? setWindow(dayOfWeek, "startMinute", 540) : setWindows(windows.filter((item) => item.dayOfWeek !== dayOfWeek))} />{day}</label>{window ? <><Field label="Opens"><TextInput type="time" value={toTime(window.startMinute)} onChange={(e) => setWindow(dayOfWeek, "startMinute", toMinutes(e.target.value))} required /></Field><Field label="Closes"><TextInput type="time" value={toTime(window.endMinute)} onChange={(e) => setWindow(dayOfWeek, "endMinute", toMinutes(e.target.value))} required /></Field></> : <p className="text-sm text-stone-400 sm:col-span-3">Closed</p>}</div>; })}</div>
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-semibold text-evergreen-950">Daily breaks</h2><p className="text-sm text-stone-500">No break times are configured by default.</p></div><button type="button" className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-evergreen-950" onClick={() => setBreaks([...breaks, { name: "Break", startMinute: 780, endMinute: 810 }])}><FiPlus />Add break</button></div>
        {breaks.length ? <div className="mt-3 grid gap-3">{breaks.map((item, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"><Field label="Name"><TextInput value={item.name || "Break"} onChange={(e) => setBreaks(breaks.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} /></Field><Field label="Starts"><TextInput type="time" value={toTime(item.startMinute)} onChange={(e) => setBreaks(breaks.map((row, i) => i === index ? { ...row, startMinute: toMinutes(e.target.value) } : row))} /></Field><Field label="Ends"><TextInput type="time" value={toTime(item.endMinute)} onChange={(e) => setBreaks(breaks.map((row, i) => i === index ? { ...row, endMinute: toMinutes(e.target.value) } : row))} /></Field><IconButton title="Remove break" icon={FiTrash2} tone="danger" onClick={() => setBreaks(breaks.filter((_, i) => i !== index))} /></div>)}</div> : <div className="mt-3"><EmptyState title="No breaks configured" body="Appointment slots will not be generated during any break until one is added." /></div>}
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-4"><h2 className="font-display text-xl font-semibold text-evergreen-950">Closed dates</h2><p className="mb-3 mt-1 text-sm text-stone-500">Exclude full local calendar dates from public appointment availability.</p><div className="flex flex-wrap items-end gap-2"><Field label="Add closed date"><TextInput type="date" value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} /></Field><button type="button" className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold" onClick={addBlockedDate}><FiPlus />Add date</button></div>
        {!blockedDates.length ? <p className="mt-3 text-sm text-stone-400">No closed dates saved.</p> : <div className="mt-3 flex flex-wrap gap-2">{blockedDates.map((date) => <span key={date} className="inline-flex items-center gap-2 rounded border border-stone-200 px-3 py-2 text-sm">{date}<button type="button" aria-label={`Remove ${date}`} onClick={() => setBlockedDates(blockedDates.filter((item) => item !== date))}>×</button></span>)}</div>}
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-4"><h2 className="font-display text-xl font-semibold text-evergreen-950">Report schedule</h2><p className="mb-3 mt-1 text-sm text-stone-500">All times are Addis Ababa time. Scheduled delivery is disabled until the cPanel cron trigger is configured.</p>
        <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-evergreen-950"><input type="checkbox" checked={reportSettings.reportSchedulesEnabled} onChange={(e) => setReportSettings({ ...reportSettings, reportSchedulesEnabled: e.target.checked })} />Enable scheduled report generation</label>
        <div className="grid gap-3 md:grid-cols-3"><Field label="Daily report time"><TextInput type="time" step="300" value={reportSettings.reportDailyTime} onChange={(e) => setReportSettings({ ...reportSettings, reportDailyTime: e.target.value })} /></Field><Field label="Weekly report day"><select className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm" value={reportSettings.reportWeeklyDay} onChange={(e) => setReportSettings({ ...reportSettings, reportWeeklyDay: Number(e.target.value) })}>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></Field><Field label="Weekly report time"><TextInput type="time" step="300" value={reportSettings.reportWeeklyTime} onChange={(e) => setReportSettings({ ...reportSettings, reportWeeklyTime: e.target.value })} /></Field><Field label="Monthly report time"><TextInput type="time" step="300" value={reportSettings.reportMonthlyTime} onChange={(e) => setReportSettings({ ...reportSettings, reportMonthlyTime: e.target.value })} /></Field></div>
      </section>
      <div><PrimaryButton icon={FiSave} type="submit" disabled={saving}>{saving ? "Saving…" : "Save clinic schedule"}</PrimaryButton></div>
    </form>
  </SectionShell>;
}
