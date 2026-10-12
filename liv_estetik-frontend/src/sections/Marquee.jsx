import { MARQUEE_ITEMS } from "../siteContent";

export default function Marquee() {
    return (
        <aside className="practice-strip" aria-label="Clinic specialties">
            {MARQUEE_ITEMS.map((item, index) => (
                <span key={item}><span className="practice-index">0{index + 1}</span>{item}</span>
            ))}
        </aside>
    );
}