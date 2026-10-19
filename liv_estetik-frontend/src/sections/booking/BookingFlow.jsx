import { useEffect, useMemo, useState } from "react";

function serviceId(slot) {
    return String(slot?.service?._id || slot?.service?.id || slot?.service || "");
}

function availableSlot(slot) {
    return slot?.selectable ?? (slot?.status === "available" && slot.bookedCount < slot.capacity);
}

function dateLabel(value) {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

export default function BookingSteps({
    step,
    form,
    services,
    slots,
    selectedService,
    selectedSlot,
    loadingServices,
    servicesError,
    servicesWakingUp,
    retryServices,
    loadingSlots,
    slotsError,
    slotsWakingUp,
    retrySlots,
    loading,
    submitError,
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
    const [selectedDate, setSelectedDate] = useState("");
    const bookableServices = services.filter((service) => service.visible && service.active && !service.isComingSoon);
    const selectedServiceName = services.find((service) => String(service._id || service.id) === selectedService)?.name;

    const filteredSlots = useMemo(() => slots.filter((slot) => {
        if (!availableSlot(slot) || serviceId(slot) !== selectedService) return false;
        const date = new Date(slot.startsAt);
        const day = date.getUTCDay();
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        if (day === 0) return false;
        if (day === 6) return hour >= 9 && (hour < 12 || (hour === 12 && minute < 30));
        return hour >= 9 && (hour < 17 || (hour === 17 && minute < 30));
    }), [slots, selectedService]);

    const slotGroups = useMemo(() => {
        const groups = new Map();
        filteredSlots.forEach((slot) => {
            const key = new Date(slot.startsAt).toISOString().slice(0, 10);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(slot);
        });
        return Array.from(groups, ([date, items]) => ({ date, label: dateLabel(`${date}T12:00:00Z`), slots: items }));
    }, [filteredSlots]);

    useEffect(() => {
        if (!slotGroups.some((group) => group.date === selectedDate)) {
            setSelectedDate(slotGroups[0]?.date || "");
        }
    }, [slotGroups, selectedDate]);

    return (
        <div className="booking-flow" aria-live="polite">
            {step === 1 && (
                <section className="booking-stage" aria-labelledby="booking-details-title">
                    <p className="eyebrow">Step 01 / Your details</p>
                    <h3 id="booking-details-title">First, a little about you.</h3>
                    <p className="stage-intro">We’ll use these details to follow up about your request.</p>
                    <form className="booking-form" onSubmit={goToStep2}>
                        <div className="booking-fields">
                            <label className="form-field">
                                <span>Full name</span>
                                <input name="fullName" autoComplete="name" value={form.fullName} onChange={handleChange} required minLength="2" />
                            </label>
                            <label className="form-field">
                                <span>Phone</span>
                                <input name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} required minLength="7" />
                            </label>
                            <label className="form-field">
                                <span>Email address <small>Optional</small></span>
                                <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} />
                            </label>
                        </div>
                        <label className="form-field">
                            <span>Anything you’d like us to know? <small>Optional</small></span>
                            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" />
                        </label>
                        <div className="booking-actions booking-actions-end">
                            <button type="submit" className="button-primary">Choose a treatment <span aria-hidden="true">→</span></button>
                        </div>
                    </form>
                </section>
            )}

            {step === 2 && (
                <section className="booking-stage" aria-labelledby="booking-service-title">
                    <p className="eyebrow">Step 02 / Treatment</p>
                    <h3 id="booking-service-title">What would you like to discuss?</h3>
                    {loadingServices ? (
                        <><div className="resource-skeleton resource-skeleton-service" aria-label="Loading treatments" aria-busy="true">{[0, 1, 2].map((item) => <div className="resource-skeleton-item" key={item}><span /><span /></div>)}</div>{servicesWakingUp && <p className="resource-waking" role="status">Waking things up, one moment...</p>}</>
                    ) : servicesError ? (
                        <div className="resource-failure" role="alert"><p>We couldn’t load the treatment list. {servicesError}</p><button type="button" onClick={retryServices}>Try again</button></div>
                    ) : (
                        <fieldset className="treatment-options">
                            <legend className="visually-hidden">Select one treatment</legend>
                            {bookableServices.length === 0 ? <p className="resource-empty">No bookable treatments are available right now.</p> : bookableServices.map((service, index) => (
                                <label className={`treatment-option${selectedService === String(service._id || service.id) ? " is-selected" : ""}`} key={service._id || service.id}>
                                    <input type="radio" name="service" value={service._id || service.id} checked={selectedService === String(service._id || service.id)} onChange={() => setSelectedService(String(service._id || service.id))} />
                                    <span className="option-number">{String(index + 1).padStart(2, "0")}</span>
                                    <span className="option-copy"><strong>{service.name}</strong><small>{service.category}{service.estimatedDurationMinutes ? ` · ${service.estimatedDurationMinutes} min` : ""}</small></span>
                                    <span className="option-indicator" aria-hidden="true">↗</span>
                                </label>
                            ))}
                        </fieldset>
                    )}
                    {services.some((service) => service.visible && (service.isComingSoon || service.comingSoon)) ? (
                        <p className="coming-soon-note">Also in the works: {services.filter((service) => service.visible && (service.isComingSoon || service.comingSoon)).map((service) => service.name).join(", ")}.</p>
                    ) : null}
                    <div className="booking-actions">
                        <button type="button" className="button-quiet" onClick={() => setStep(1)}>← Your details</button>
                        <button type="button" className="button-primary" onClick={goToStep3} disabled={!selectedService || loadingServices || Boolean(servicesError)}>Choose a time <span aria-hidden="true">→</span></button>
                    </div>
                </section>
            )}

            {step === 3 && (
                <section className="booking-stage" aria-labelledby="booking-time-title">
                    <p className="eyebrow">Step 03 / Appointment</p>
                    <h3 id="booking-time-title">Choose a time that suits you.</h3>
                    <p className="stage-intro">{selectedServiceName} · We’ll confirm your appointment with you.</p>
                    {loadingSlots ? (
                        <><div className="resource-skeleton resource-skeleton-slot" aria-label="Loading appointment times" aria-busy="true">{[0, 1, 2].map((item) => <div className="resource-skeleton-item" key={item}><span /><span /></div>)}</div>{slotsWakingUp && <p className="resource-waking" role="status">Waking things up, one moment...</p>}</>
                    ) : slotsError ? (
                        <div className="resource-failure" role="alert"><p>We couldn’t load appointment times. {slotsError}</p><button type="button" onClick={retrySlots}>Try again</button></div>
                    ) : filteredSlots.length === 0 ? (
                        <p className="resource-empty">There are no available times for this treatment over the next two weeks. Please contact us and we’ll help.</p>
                    ) : (
                        <>
                            <div className="date-options" role="group" aria-label="Filter appointment dates">
                                {slotGroups.map((group) => (
                                    <button type="button" key={group.date} aria-pressed={selectedDate === group.date} className={selectedDate === group.date ? "is-selected" : ""} onClick={() => setSelectedDate(group.date)}>{group.label}</button>
                                ))}
                            </div>
                            <fieldset className="slot-options">
                                <legend className="visually-hidden">Available appointment times for {slotGroups.find((group) => group.date === selectedDate)?.label}</legend>
                                {slotGroups.find((group) => group.date === selectedDate)?.slots.map((slot) => (
                                    <label className={`slot-option${String(selectedSlot) === String(slot._id || slot.id) ? " is-selected" : ""}`} key={slot._id || slot.id}>
                                        <input type="radio" name="requestedSlot" value={slot._id || slot.id} checked={String(selectedSlot) === String(slot._id || slot.id)} onChange={() => setSelectedSlot(String(slot._id || slot.id))} />
                                        <span>{formatSlot(slot)}</span>
                                        <small>{slot.capacity - slot.bookedCount} available</small>
                                    </label>
                                ))}
                            </fieldset>
                        </>
                    )}
                    <div className="booking-actions">
                        <button type="button" className="button-quiet" onClick={() => setStep(2)}>← Treatment</button>
                        <button type="button" className="button-primary" onClick={goToStep4} disabled={!selectedSlot || loadingSlots || Boolean(slotsError)}>Review request <span aria-hidden="true">→</span></button>
                    </div>
                </section>
            )}

            {step === 4 && (
                <section className="booking-stage" aria-labelledby="booking-confirm-title">
                    <p className="eyebrow">Step 04 / Review</p>
                    <h3 id="booking-confirm-title">Check the details.</h3>
                    <dl className="booking-summary">
                        <div><dt>Name</dt><dd>{form.fullName}</dd></div>
                        <div><dt>Email</dt><dd>{form.email}</dd></div>
                        <div><dt>Phone</dt><dd>{form.phone}</dd></div>
                        <div><dt>Treatment</dt><dd>{selectedServiceName}</dd></div>
                        <div><dt>Requested time</dt><dd>{formatSlot(slots.find((slot) => String(slot._id || slot.id) === String(selectedSlot)) || {})}</dd></div>
                    </dl>
                    <p className="booking-disclaimer">This is a request, not a confirmed appointment. Our team will contact you to agree the time.</p>
                    {submitError ? <p className="form-status error" role="alert">{submitError}</p> : null}
                    <form className="booking-actions" onSubmit={handleSubmit}>
                        <button type="button" className="button-quiet" onClick={() => setStep(3)}>← Appointment time</button>
                        <button type="submit" className="button-primary" disabled={loading}>{loading ? "Sending request..." : "Send appointment request"} <span aria-hidden="true">↗</span></button>
                    </form>
                </section>
            )}
        </div>
    );
}
