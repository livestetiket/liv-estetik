import { PHILOSOPHY_VALUES } from "../siteContent";
import { FadeUp } from "../components.jsx";

export default function Philosophy() {
    return (
        <section id="philosophy" className="philosophy-section">
            <div className="philosophy-grid section-wrap">
                <figure className="philosophy-visual" data-reveal>
                    <div className="image-frame philosophy-image" data-parallax>
                        <img src="/images/treatment-room-placeholder.svg" alt="Placeholder for the clinic treatment room" width="900" height="1100" loading="lazy" />
                    </div>
                    <figcaption>Liv Estetik · Bole, Addis Ababa</figcaption>
                </figure>
                <div className="philosophy-copy">
                    <FadeUp>
                        <p className="eyebrow">Our approach / 02</p>
                        <h2 className="display-heading">Good care starts with a <em>conversation.</em></h2>
                        <p className="philosophy-lead">A visit should feel considered from the first question to the last follow-up.</p>
                    </FadeUp>
                    <ol className="approach-list">
                        {PHILOSOPHY_VALUES.map((value, index) => (
                            <li key={value.num} data-reveal style={{ "--row-index": index }}>
                                <span className="approach-number">{value.num}</span>
                                <div><h3>{value.title}</h3><p>{value.body}</p></div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}