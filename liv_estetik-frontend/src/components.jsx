export function FadeUp({ children, delay = 0, className = "" }) {
    return (
        <div className={`reveal ${className}`} data-reveal style={{ "--reveal-delay": `${delay * 1000}ms` }}>
            {children}
        </div>
    );
}

export function SectionHeading({ eyebrow, title, children, dark = false }) {
    return (
        <header className={`section-heading${dark ? " section-heading-dark" : ""}`} data-reveal>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="display-heading">{title}</h2>
            {children ? <p className="section-intro">{children}</p> : null}
        </header>
    );
}

export function ServiceCard({ service, index }) {
    const comingSoon = Boolean(service.isComingSoon || service.comingSoon || (!service.active && service.visible));
    const photo = SERVICE_PHOTOS[service.category] || SERVICE_PHOTOS.Hair;

    return (
        <article className="service-row" data-reveal style={{ "--row-index": index }}>
            <div className="service-row-image"><img src={photo.src} alt={photo.alt} width="180" height="140" loading="lazy" /></div>
            <span className="service-row-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="service-row-copy">
                <p className="eyebrow">{service.category}</p>
                <h3>{service.name}</h3>
                {service.description ? <p>{service.description}</p> : null}
            </div>
            <span className="service-row-status">{comingSoon ? "Coming soon" : "Available"}</span>
            <span className="service-row-arrow" aria-hidden="true">↗</span>
        </article>
    );
}

import { SERVICE_PHOTOS } from "./siteContent";

