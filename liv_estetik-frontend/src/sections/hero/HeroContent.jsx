import { useState } from "react";

export default function HeroContent() {
    const [photoLoaded, setPhotoLoaded] = useState(false);

    return (
        <div className="hero-grid">
            <div className="hero-copy">
                <p className="eyebrow hero-location"><span className="hero-location-mark" /> Aesthetic care in Addis Ababa</p>
                <h1 className="hero-title">Feel at home<br />in your <em>skin.</em></h1>
                <p className="hero-intro">
                    Thoughtful hair, skin, and body treatments, guided by honest advice and care that feels personal.
                </p>
                <div className="hero-actions">
                    <a href="#booking" className="button-primary">Request a consultation <span aria-hidden="true">↗</span></a>
                    <a href="#services" className="text-link">Explore treatments <span aria-hidden="true">↓</span></a>
                </div>
                <div className="hero-trust-row">
                    <span className="hero-trust-icon" aria-hidden="true">✳</span>
                    <p>Personalized aesthetic care<br /><strong>Bole, Addis Ababa</strong></p>
                </div>
            </div>
            <figure className="hero-visual" data-reveal>
                <div className={`image-frame hero-image${photoLoaded ? " is-loaded" : ""}`} data-parallax>
                    {!photoLoaded && <div className="hero-photo-prompt"><span>Liv Estetik · Bole</span><strong>Your clinic photo</strong><small>Add <code>hero-clinic.jpg</code> to <code>public/images</code></small></div>}
                    <img
                        src="/images/hero-clinic.jpg"
                        alt="Liv Estetik clinic in Bole, Addis Ababa"
                        width="960"
                        height="1180"
                        fetchPriority="high"
                        onLoad={() => setPhotoLoaded(true)}
                        onError={() => setPhotoLoaded(false)}
                    />
                    <div className="hero-image-stamp"><span>HAIR · SKIN · BODY</span><strong>Care, considered.</strong></div>
                </div>
                <figcaption><span>Liv Estetik</span> Your wellbeing, in good hands</figcaption>
            </figure>
        </div>
    );
}
