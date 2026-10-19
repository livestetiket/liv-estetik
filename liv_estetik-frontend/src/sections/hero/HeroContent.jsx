import { useState } from "react";
import BrandLogo from "../../components/BrandLogo";

export default function HeroContent() {
    const [hasHeroImage, setHasHeroImage] = useState(true);

    return (
        <div className="hero-grid">
            <div className="hero-copy">
                <p className="eyebrow hero-location">Aesthetic care / Addis Ababa</p>
                <h1 className="hero-title">
                    Hair. Skin.<br />
                    <span className="hero-line-mask"><span>Body, <em>well</em> cared for.</span></span>
                </h1>
                <p className="hero-intro">
                    Thoughtful treatments, clear guidance, and room to choose what feels right for you.
                </p>
                <div className="hero-actions">
                    <a href="#booking" className="button-primary">Request a consultation</a>
                    <a href="#services" className="text-link">Explore treatments <span aria-hidden="true">↗</span></a>
                </div>
                <p className="hero-note"><span>01</span> Bole / Addis Ababa</p>
            </div>
            <figure className="hero-visual" data-reveal>
                {hasHeroImage ? (
                    <div className="image-frame hero-image" data-parallax>
                        <img
                            src="/images/hero-clinic.jpg"
                            alt="Liv Estetik clinic"
                            width="960"
                            height="1180"
                            fetchPriority="high"
                            onError={() => setHasHeroImage(false)}
                        />
                    </div>
                ) : (
                    <div className="hero-image-placeholder" role="img" aria-label="Reserved space for Liv Estetik clinic photography">
                        <span className="hero-placeholder-label">Clinic photography</span>
                        <BrandLogo className="hero-placeholder-logo" />
                        <span className="hero-placeholder-caption">Your image goes here</span>
                    </div>
                )}
                <figcaption><span>Liv Estetik</span> A considered space for your care</figcaption>
            </figure>
        </div>
    );
}
