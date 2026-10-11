import { useEffect, useState } from "react";
import { FadeUp } from "../components.jsx";
import { getServices, getTimeSlots } from "../api";

function formatSlot(slot) {
  try {
    const start = new Date(slot.startsAt);
    const end = new Date(slot.endsAt || slot.startsAt);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const slotDay = new Date(start);
    slotDay.setHours(0, 0, 0, 0);

    const label = slotDay.getTime() === tomorrow.getTime()
      ? "Tomorrow"
      : start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
    const startTime = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    const endTime = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    return `${label} • ${startTime}–${endTime}`;
  } catch (_) { return String(slot.startsAt); }
}

export default function ChooseServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  useEffect(() => {
    let mounted = true;
    getServices().then(d => mounted && setServices(d || [])).catch(err => console.error(err)).finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const showSlots = async () => {
    setLoadingSlots(true);
    try {
      const now = new Date();
      const later = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const data = await getTimeSlots(now.toISOString(), later.toISOString(), Array.from(selected));
      setSlots(data || []);
    } catch (err) {
      console.error("Failed to load slots:", err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const groupedSlots = Object.values(slots.filter(s => s.selectable).reduce((acc, slot) => {
    const date = new Date(slot.startsAt);
    const dayOfWeek = date.getUTCDay();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();

    if (dayOfWeek === 0) return acc;

    const isSaturday = dayOfWeek === 6;
    const withinWeekdayWindow = hour >= 9 && (hour < 17 || (hour === 17 && minute < 30));
    const withinSaturdayWindow = hour >= 9 && (hour < 12 || (hour === 12 && minute < 30));
    if (!isSaturday ? withinWeekdayWindow : withinSaturdayWindow) {
      const dateKey = date.toDateString();
    if (!acc[dateKey]) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      acc[dateKey] = {
        dateKey,
        weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
        dateLabel: dayStart.getTime() === tomorrow.getTime()
          ? "Tomorrow"
          : date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        slots: []
      };
    }
      acc[dateKey].slots.push(slot);
      return acc;
    }

    return acc;
  }, {})).sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));

  useEffect(() => {
    if (!selectedDateFilter && groupedSlots.length > 0) {
      setSelectedDateFilter(groupedSlots[0].weekday);
    }
  }, [groupedSlots, selectedDateFilter]);

  const dateFilterOptions = Array.from(new Set(groupedSlots.map(group => group.weekday)));
  const visibleGroups = selectedDateFilter
    ? groupedSlots.filter(group => group.weekday === selectedDateFilter)
    : groupedSlots;

  const continueToBooking = () => {
    // persist selections and navigate
    const ids = Array.from(selected);
    if (!ids.length) return alert("Please choose at least one service to continue.");
    sessionStorage.setItem("le_selected_services", JSON.stringify(ids));
    if (selectedSlot) sessionStorage.setItem("le_selected_slot", String(selectedSlot));
    window.location.hash = "#booking";
  };

  return (
    <section id="choose-services" className="le-services" style={{ paddingTop: 32 }}>
      <FadeUp>
        <p className="le-section-eyebrow">Choose services</p>
        <h2 className="le-section-title">Select the treatments you're interested in</h2>
      </FadeUp>

      <div style={{ padding: "1rem 2rem" }}>
        {loading ? <div>Loading services…</div> : (
          <div style={{ display: "grid", gap: 8 }}>
            {services.filter(s => s.visible).map(s => {
              const isComingSoon = Boolean(s.isComingSoon || s.comingSoon || (!s.active && s.visible));
              return (
                <label key={s._id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={selected.has(String(s._id))} onChange={() => toggle(String(s._id))} disabled={isComingSoon} />
                  <div>{s.name}{isComingSoon ? " (coming soon)" : ""}</div>
                </label>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button className="le-btn-primary" onClick={showSlots} disabled={loadingSlots || loading}>Show available slots</button>
        </div>

        <div style={{ marginTop: 16 }}>
          {loadingSlots ? <div>Loading slots…</div> : (
            <div style={{ display: "grid", gap: 12 }}>
              {slots.length === 0 && <div>No slots found in the next 2 weeks.</div>}
              {groupedSlots.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {dateFilterOptions.map(day => (
                    <button
                      key={day}
                      type="button"
                      style={{
                        borderRadius: 999,
                        border: selectedDateFilter === day ? "1px solid #c9a84c" : "1px solid rgba(0,0,0,0.15)",
                        background: selectedDateFilter === day ? "rgba(201, 168, 76, 0.12)" : "transparent",
                        padding: "0.45rem 0.9rem",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                      onClick={() => setSelectedDateFilter(selectedDateFilter === day ? null : day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
              {visibleGroups.map(group => (
                <div key={group.dateKey}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 8, color: "#c9a84c" }}>
                    {group.dateLabel}
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {group.slots.map(s => (
                      <label key={s._id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="radio" name="slot" checked={String(selectedSlot) === String(s._id)} onChange={() => setSelectedSlot(String(s._id))} />
                        <div>{formatSlot(s)} — capacity {s.capacity - s.bookedCount} available</div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="le-btn-primary" onClick={continueToBooking}>Continue to booking</button>
        </div>
      </div>
    </section>
  );
}
