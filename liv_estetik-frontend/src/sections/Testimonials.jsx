import { useEffect, useState } from "react";
import { FadeUp } from "../components.jsx";
import { getTestimonials } from "../api";

export default function Testimonials() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        getTestimonials()
            .then((data) => mounted && setTestimonials(data || []))
            .catch((err) => console.error("Failed to load testimonials:", err))
            .finally(() => mounted && setLoading(false));
        return () => (mounted = false);
    }, []);

    return (
        <section id="testimonials" className="le-testimonials">
            <FadeUp>
                <p className="le-section-eyebrow">Client words</p>
                <h2 className="le-section-title">Quiet confidence,<br />beautifully reflected</h2>
                <p className="le-section-desc">What our clients say about their experience at Liv Estetik.</p>
            </FadeUp>

            <FadeUp delay={0.1}>
                <div className="le-testimonials-grid">
                    {loading ? <div>Loading testimonials…</div> : testimonials.map((t) => (
                        <figure key={String(t._id || t.name)} className="le-testim-card">
                            <div className="le-quote-mark">"</div>
                            <div className="le-stars">{"★★★★★".split("").map((s, j) => <span key={j}>{s}</span>)}</div>
                            <blockquote className="le-quote">"{t.quote || t.quotes || ''}"</blockquote>
                            <figcaption className="le-testim-author">
                                <div className="le-testim-avatar">{(t.initials || (t.name || "").split(" ").map(n=>n[0]).join("") )}</div>
                                <div>
                                    <div className="le-testim-name">{t.name}</div>
                                    <div className="le-testim-service">{t.service}</div>
                                </div>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </FadeUp>
        </section>
    );
}