export default function BookingStepper({ step }) {
    const steps = [
        { label: "Your details", key: 1 },
        { label: "Services", key: 2 },
        { label: "Slot", key: 3 },
        { label: "Confirm", key: 4 },
    ];

    return (
        <nav className="booking-stepper" aria-label="Booking progress">
            <div className="step-progress-track" aria-hidden="true"><span style={{ "--progress": (step - 1) / (steps.length - 1) }} /></div>
            <ol>
                {steps.map((item) => (
                    <li key={item.key} className={step === item.key ? "is-current" : step > item.key ? "is-complete" : ""} aria-current={step === item.key ? "step" : undefined}>
                        <span className="step-index">{String(item.key).padStart(2, "0")}</span>
                        <span className="step-label">{item.label}</span>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
