import { PHOTO_AREAS } from "../siteContent";
import { FadeUp } from "../components.jsx";

export function Results() {
    return (
        <section id="results" className="results-section">
            <div className="section-wrap results-layout">
                <FadeUp className="results-copy">
                    <p className="eyebrow">Patient results / 03</p>
                    <h2 className="display-heading">Real stories, shared <em>with permission.</em></h2>
                    <p className="section-intro">Approved before-and-after photographs can be added here. Individual results vary; a consultation is needed to discuss suitability and expectations.</p>
                </FadeUp>
                <div className="comparison-pair" aria-label="Reserved spaces for consented before and after patient photographs">
                    {["Before", "After"].map((state) => <figure key={state} className="comparison-frame">
                        <img src="/images/patient-results-placeholder.svg" alt={`Placeholder for an approved patient result photograph, ${state.toLowerCase()} treatment`} width="640" height="720" loading="lazy" />
                        <figcaption>{state}<span>Approved patient image</span></figcaption>
                    </figure>)}
                </div>
            </div>
        </section>
    );
}

export default function Photography() {
    return (
        <section id="gallery" className="gallery-section section-wrap">
            <div className="gallery-heading">
                <FadeUp><p className="eyebrow">Inside Liv Estetik / 04</p><h2 className="display-heading">A closer look at <em>care.</em></h2></FadeUp>
                <p className="section-intro" data-reveal>Clinic, treatment, and team photography belongs here. Each image is a labeled placeholder until authentic clinic photographs are supplied.</p>
            </div>
            <div className="photo-grid">
                {PHOTO_AREAS.map((photo, index) => <figure className={`photo-tile ${photo.shape}`} key={photo.title} data-reveal style={{ "--row-index": index }}>
                    <div className="image-frame"><img src={photo.src} alt={photo.alt} width="900" height="720" loading="lazy" /></div>
                    <figcaption><strong>{photo.title}</strong><span>{photo.note}</span></figcaption>
                </figure>)}
            </div>
        </section>
    );
}
