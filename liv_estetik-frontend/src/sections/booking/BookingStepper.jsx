export default function BookingStepper({ step }) {
    const steps = [
        { label: "Your details", key: 1 },
        { label: "Services", key: 2 },
        { label: "Slot", key: 3 },
        { label: "Confirm", key: 4 },
    ];

    return (
        <div className="le-stepper">
            {steps.map((item) => (
                <div key={item.key} className={`le-step${step === item.key ? " active" : ""}`} data-step={item.key}>
                    <div>{item.label}</div>
                </div>
            ))}
        </div>
    );
}
