import { useState, useCallback } from "react";
import { FadeUp } from "../../components.jsx";
import { getServices, getTimeSlots, postBooking } from "../../api";
import useRemoteResource from "../../hooks/useRemoteResource";
import BookingStepper from "./BookingStepper";
import BookingSteps from "./BookingFlow";

const EMPTY_FORM = {
    fullName: "", age: "", sex: "", phone: "", address: "", email: "", notes: ""
};

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
    } catch (_) {
        return String(slot.startsAt);
    }
}

export default function Booking() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(EMPTY_FORM);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const loadServices = useCallback(() => getServices(), []);
    const {
        data: services,
        loading: loadingServices,
        error: servicesError,
        isWakingUp: servicesWakingUp,
        retry: retryServices,
    } = useRemoteResource(loadServices);
    const loadSlots = useCallback(() => {
        const now = new Date();
        const later = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        return getTimeSlots(now.toISOString(), later.toISOString(), selectedService ? [selectedService] : []);
    }, [selectedService]);
    const {
        data: slots,
        loading: loadingSlots,
        error: slotsError,
        isWakingUp: slotsWakingUp,
        retry: retrySlots,
    } = useRemoteResource(loadSlots, { enabled: step === 3 });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const goToStep2 = (event) => {
        event.preventDefault();
        setStep(2);
    };

    const chooseService = (serviceId) => {
        setSelectedService(serviceId);
        setSelectedSlot(null);
    };

    const goToStep3 = () => setStep(3);
    const goToStep4 = () => setStep(4);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSubmitError("");
        try {
            const bookingData = {
                ...form,
                service: selectedService,
                requestedSlot: selectedSlot,
            };
            await postBooking(bookingData);
            setForm(EMPTY_FORM);
            setSelectedService(null);
            setSelectedSlot(null);
            setStep(1);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4200);
        } catch (err) {
            setSubmitError(err.message || "We couldn't send your request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="booking" className="booking-section">
            <div className="booking-layout section-wrap">
                <div className="booking-intro">
                    <FadeUp>
                    <p className="eyebrow">Appointments / 04</p>
                    <h2 className="display-heading">Start with a <em>conversation.</em></h2>
                    <p className="booking-copy">Tell us what you have in mind. Our team will review your request and confirm a time with you.</p>
                    <BookingStepper step={step} />
                    </FadeUp>
                </div>

                <FadeUp className="booking-form-wrap" delay={0.1}>
                    <BookingSteps
                        step={step}
                        form={form}
                        services={services}
                        slots={slots}
                        selectedService={selectedService}
                        selectedSlot={selectedSlot}
                        loadingServices={loadingServices}
                        servicesError={servicesError}
                        servicesWakingUp={servicesWakingUp}
                        retryServices={retryServices}
                        loadingSlots={loadingSlots}
                        slotsError={slotsError}
                        slotsWakingUp={slotsWakingUp}
                        retrySlots={retrySlots}
                        loading={loading}
                        submitError={submitError}
                        handleChange={handleChange}
                        goToStep2={goToStep2}
                        goToStep3={goToStep3}
                        goToStep4={goToStep4}
                        setStep={setStep}
                        setSelectedService={chooseService}
                        setSelectedSlot={setSelectedSlot}
                        handleSubmit={handleSubmit}
                        formatSlot={formatSlot}
                    />
                </FadeUp>
            </div>

            <div className={`booking-toast${showToast ? " is-visible" : ""}`} role="status" aria-live="polite">
                <strong>Request received.</strong> Our team will be in touch to confirm your appointment.
            </div>
        </section>
    );
}
