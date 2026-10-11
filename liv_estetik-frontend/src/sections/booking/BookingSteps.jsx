import { useEffect, useState } from "react";

export default function BookingSteps({
    step,
    form,
    services,
    slots,
    selectedService,
    selectedSlot,
    loadingServices,
    loadingSlots,
    loading,
    handleChange,
    goToStep2,
    goToStep3,
    goToStep4,
    setStep,
    setSelectedService,
    setSelectedSlot,
    handleSubmit,
    formatSlot,
}) {
    const [selectedDateFilter, setSelectedDateFilter] = useState(null);

    const filteredSlots = slots.filter(s => {
        if (!s || !s.selectable) return false;

        const slotDate = new Date(s.startsAt);
        const dayOfWeek = slotDate.getUTCDay();
        const hour = slotDate.getUTCHours();
        const minute = slotDate.getUTCMinutes();

        if (dayOfWeek === 0) return false;

        const isSaturday = dayOfWeek === 6;
        const withinWeekdayWindow = hour >= 9 && (hour < 17 || (hour === 17 && minute < 30));
        const withinSaturdayWindow = hour >= 9 && (hour < 12 || (hour === 12 && minute < 30));
        if (!isSaturday ? withinWeekdayWindow : withinSaturdayWindow) {
            if (!selectedService) return false;
            if (!s.service) return false;
            const sid = String(s.service._id || s.service.id || s.service);
            return selectedService === sid;
        }

        return false;
    });

    const groupedSlots = Object.values(filteredSlots.reduce((acc, slot) => {
        const date = new Date(slot.startsAt);
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

    return (
        <>
            {step === 1 && (
                <form className="le-form-card le-panel-card" style={{ maxWidth: "840px", margin: "0 auto" }}>
                    <div className="le-card-meta" style={{ marginBottom: 24 }}>Start with your contact details, then choose the treatments and appointment time that suits you.</div>
                    <div className="le-form-row">
                        <div className="le-form-group">
                            <label className="le-form-label">Full Name</label>
                            <input className="le-form-input" name="fullName" value={form.fullName} onChange={handleChange} required />
                        </div>
                        <div className="le-form-group">
                            <label className="le-form-label">Age</label>
                            <input className="le-form-input" name="age" type="number" min="1" value={form.age} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="le-form-row">
                        <div className="le-form-group">
                            <label className="le-form-label">Gender</label>
                            <select className="le-form-select" name="sex" value={form.sex} onChange={handleChange} required>
                                <option value="">Select</option>
                                <option>Female</option>
                                <option>Male</option>
                                <option>Prefer not to say</option>
                            </select>
                        </div>
                        <div className="le-form-group">
                            <label className="le-form-label">Phone</label>
                            <input className="le-form-input" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="le-form-row">
                        <div className="le-form-group">
                            <label className="le-form-label">Address</label>
                            <input className="le-form-input" name="address" value={form.address} onChange={handleChange} />
                        </div>
                        <div className="le-form-group">
                            <label className="le-form-label">Email</label>
                            <input className="le-form-input" name="email" type="email" value={form.email} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="le-form-group" style={{ marginBottom: "1.5rem" }}>
                        <label className="le-form-label">Notes</label>
                        <textarea className="le-form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Tell us about your timing or goals." />
                    </div>
                    <button type="button" className="le-form-submit" onClick={goToStep2}>
                        Next
                    </button>
                </form>
            )}

            {step === 2 && (
                <div className="le-form-card le-panel-card" style={{ maxWidth: "840px", margin: "0 auto" }}>
                    <h3 className="le-card-heading">Step 2: Choose Service</h3>
                    <div className="le-card-meta" style={{ marginBottom: 20 }}>
                        Select the treatment that matches your goals.
                    </div>
                    {loadingServices ? (
                        <div>Loading services…</div>
                    ) : (
                        <div className="le-card-grid" style={{ marginBottom: 20 }}>
                            {services.filter(s => s.visible && !s.isComingSoon).map(s => (
                                <label key={s._id} className={`le-choice-card${selectedService === String(s._id) ? " active" : ""}`}>
                                    <input 
                                        type="radio" 
                                        name="service" 
                                        checked={selectedService === String(s._id)} 
                                        onChange={() => setSelectedService(String(s._id))} 
                                    />
                                    <div>
                                        <div>{s.name}</div>
                                        <div className="le-card-meta">{s.category} · {s.active ? "Bookable" : "Not available"}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                    {services.some(s => s.visible && s.isComingSoon) && (
                        <div style={{ marginBottom: 20, padding: "12px 16px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "8px", color: "#666" }}>Coming Soon:</div>
                            <div className="le-card-grid">
                                {services.filter(s => s.visible && s.isComingSoon).map(s => (
                                    <div key={s._id} className="le-choice-card" style={{ opacity: 0.6, pointerEvents: "none" }}>
                                        <div>
                                            <div>{s.name}</div>
                                            <div className="le-card-meta" style={{ color: "#d97706" }}>🚀 Coming Soon</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="button" className="le-btn-secondary" onClick={() => setStep(1)}>Back</button>
                        <button type="button" className="le-form-submit" onClick={goToStep3}>Next</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="le-form-card le-panel-card" style={{ maxWidth: "840px", margin: "0 auto" }}>
                    <h3 className="le-card-heading">Step 3: Choose Time Slot</h3>
                    <div className="le-card-meta" style={{ marginBottom: 20 }}>
                        Select the most convenient available appointment time. We will confirm availability once your request is submitted.
                    </div>
                    <div className="le-card-meta" style={{ marginBottom: 20 }}>
                        Service: <strong>{services.find(s => String(s._id) === selectedService)?.name || selectedService}</strong>
                    </div>
                    {loadingSlots ? (
                        <div>Loading available slots…</div>
                    ) : filteredSlots.length === 0 ? (
                        <div>No available slots for the selected service in the next 2 weeks.</div>
                    ) : (
                        <div style={{ marginBottom: 20 }}>
                            <div className="le-day-filter-bar">
                                {dateFilterOptions.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`le-day-filter-btn${selectedDateFilter === day ? " active" : ""}`}
                                        onClick={() => setSelectedDateFilter(selectedDateFilter === day ? null : day)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>

                            {visibleGroups.map(group => (
                                <div key={group.dateKey} className="le-slot-group">
                                    <div className="le-slot-group-title">{group.dateLabel}</div>
                                    <div className="le-card-grid">
                                        {group.slots.map(s => (
                                            <label key={s._id} className={`le-slot-card${String(selectedSlot) === String(s._id) ? " active" : ""}`}>
                                                <input type="radio" name="slot" checked={String(selectedSlot) === String(s._id)} onChange={() => setSelectedSlot(String(s._id))} />
                                                <div>
                                                    <div className="le-slot-time">{formatSlot(s)}</div>
                                                    <div className="le-card-meta">{s.capacity - s.bookedCount} seats available</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="button" className="le-btn-secondary" onClick={() => setStep(2)}>Back</button>
                        <button type="button" className="le-form-submit" onClick={goToStep4}>Next</button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="le-form-card le-panel-card" style={{ maxWidth: "840px", margin: "0 auto" }}>
                    <h3 className="le-card-heading">Step 4: Confirm Your Booking</h3>
                    <div className="le-card-meta" style={{ marginBottom: 24 }}>Review your appointment summary and confirm your request.</div>

                    <div className="le-summary-grid" style={{ marginBottom: 24 }}>
                        <div className="le-summary-card">
                            <div className="le-summary-card-title">Contact details</div>
                            <div className="le-summary-row"><span>Name</span><strong>{form.fullName}</strong></div>
                            <div className="le-summary-row"><span>Email</span><strong>{form.email}</strong></div>
                            <div className="le-summary-row"><span>Phone</span><strong>{form.phone || "Not provided"}</strong></div>
                        </div>

                        <div className="le-summary-card">
                            <div className="le-summary-card-title">Selected service</div>
                            <div className="le-summary-row">
                                <strong>{services.find(s => String(s._id) === selectedService)?.name || selectedService}</strong>
                            </div>
                        </div>

                        <div className="le-summary-card">
                            <div className="le-summary-card-title">Appointment slot</div>
                            <div className="le-summary-row"><span>Time</span><strong>{(() => {
                                const slot = slots.find(s => String(s._id) === String(selectedSlot));
                                return slot ? formatSlot(slot) : selectedSlot;
                            })()}</strong></div>
                        </div>
                    </div>

                    <div className="le-summary-banner">
                        Your request will be sent immediately, and our team will contact you to finalize the appointment.
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="button" className="le-btn-secondary" onClick={() => setStep(3)}>Back</button>
                        <button type="submit" className="le-form-submit" disabled={loading}>
                            {loading ? "Booking..." : "Confirm & Book"}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
