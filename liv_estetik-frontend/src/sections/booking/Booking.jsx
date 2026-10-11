import { useState, useEffect } from "react";
import { FadeUp } from "../../components.jsx";
import { getServices, getTimeSlots, postBooking } from "../../api";
import BookingBackground from "./BookingBackground";
import BookingStepper from "./BookingStepper";
import BookingSteps from "./BookingSteps";

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

    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        let mounted = true;
        getServices()
            .then((data) => {
                if (mounted) setServices(data || []);
            })
            .catch((err) => console.error("Failed to load services:", err))
            .finally(() => mounted && setLoadingServices(false));
        return () => (mounted = false);
    }, []);

    const loadSlots = async () => {
        setLoadingSlots(true);
        try {
            const now = new Date();
            const later = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            const data = await getTimeSlots(now.toISOString(), later.toISOString(), selectedService ? [selectedService] : []);
            setSlots(data || []);
        } catch (err) {
            console.error("Failed to load slots:", err);
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const goToStep2 = () => {
    if (
        !form.fullName.trim() ||
        !form.age ||
        !form.sex ||
        !form.email.trim()
    ) {
        alert("Please fill in all required fields.");
        return;
    }

    setStep(2);
};

    const goToStep3 = async () => {
        if (!selectedService) {
            alert("Please select a service.");
            return;
        }
        await loadSlots();
        setStep(3);
    };

    const goToStep4 = () => {
        if (!selectedSlot) {
            alert("Please select a time slot.");
            return;
        }
        setStep(4);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
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
            console.error("Booking failed:", err);
            alert("There was a problem submitting your booking. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="booking" className="le-booking" style={{ position: "relative", overflow: "hidden" }}>
            <BookingBackground />

            <div className="le-booking-grid" style={{ gridTemplateColumns: "1fr", position: "relative", zIndex: 1 }}>
                <FadeUp>
                    <p className="le-section-eyebrow">Book now</p>
                    <h2 className="le-section-title" style={{ color: "#fff" }}>
                        Begin with a thoughtful consultation
                    </h2>
                    <BookingStepper step={step} />
                </FadeUp>

                <FadeUp delay={0.1}>
                    <BookingSteps
                        step={step}
                        form={form}
                        services={services}
                        slots={slots}
                        selectedService={selectedService}
                        selectedSlot={selectedSlot}
                        loadingServices={loadingServices}
                        loadingSlots={loadingSlots}
                        loading={loading}
                        handleChange={handleChange}
                        goToStep2={goToStep2}
                        goToStep3={goToStep3}
                        goToStep4={goToStep4}
                        setStep={setStep}
                        setSelectedService={setSelectedService}
                        setSelectedSlot={setSelectedSlot}
                        handleSubmit={handleSubmit}
                        formatSlot={formatSlot}
                    />
                </FadeUp>
            </div>

            <div className={`le-toast${showToast ? " show" : ""}`}>
                <div className="le-toast-title">Request received</div>
                <div className="le-toast-sub">We'll reach out to schedule your consultation shortly.</div>
            </div>
        </section>
    );
}
