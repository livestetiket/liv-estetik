import { MARQUEE_ITEMS } from "../constants";

export default function Marquee() {
    const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
    return (
        <div className="le-marquee" aria-hidden="true">
            <div className="le-marquee-track">
                {doubled.map((item, i) => (
                    <span key={i} className="le-marquee-item">
                        <span>{item}</span>
                        <span className="le-marquee-dot" />
                    </span>
                ))}
            </div>
        </div>
    );
}