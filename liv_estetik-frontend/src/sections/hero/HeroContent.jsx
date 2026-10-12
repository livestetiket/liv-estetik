export default function HeroContent() {
    return (
        <div className="hero-grid">
            <div className="hero-copy">
                <p className="eyebrow hero-location">Aesthetic care · Addis Ababa</p>
                <h1 className="hero-title">
                    Hair. Skin.<br />
                    <span className="hero-line-mask"><span>Body, <em>well</em> cared for.</span></span>
                </h1>
                <p className="hero-intro">
                    Thoughtful aesthetic treatments, clear advice, and time to decide what feels right for you.
                </p>
                <div className="hero-actions">
                    <a href="#booking" className="button-primary">Request an appointment</a>
                    <a href="#services" className="text-link">Explore treatments <span aria-hidden="true">↗</span></a>
                </div>
                <p className="hero-note"><span>01</span> Bole · Addis Ababa</p>
            </div>
            <figure className="hero-visual" data-reveal>
                <div className="image-frame hero-image" data-parallax>
                    <img src="/images/clinic-consultation-placeholder.svg" alt="Placeholder for a Liv Estetik consultation portrait" width="960" height="1180" fetchPriority="high" />
                </div>
                <figcaption><span>01 / 03</span> Private consultations, at your pace</figcaption>
            </figure>
        </div>
    );
}
