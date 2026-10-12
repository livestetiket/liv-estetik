import { useCallback } from "react";
import { FadeUp } from "../components.jsx";
import { getTestimonials } from "../api";
import useRemoteResource from "../hooks/useRemoteResource";
import { ResourceFailure, ResourceSkeleton, WakingMessage } from "../components/ResourceStates";

export default function Testimonials() {
    const loadTestimonials = useCallback(() => getTestimonials(), []);
    const { data: testimonials, loading, error, isWakingUp, retry } = useRemoteResource(loadTestimonials);

    return (
        <section id="testimonials" className="testimonials-section section-wrap">
            <div className="testimonials-heading">
                <FadeUp>
                    <p className="eyebrow">Client notes / 03</p>
                    <h2 className="display-heading">Kind words, shared <em>with care.</em></h2>
                </FadeUp>
                <p className="section-intro" data-reveal>Experiences shared by people who have visited Liv Estetik.</p>
            </div>
            <div className="testimonial-list">
                {loading ? <><ResourceSkeleton rows={2} variant="testimonial" />{isWakingUp && <WakingMessage />}</> : null}
                {error ? <ResourceFailure message={`Client notes could not be loaded. ${error}`} onRetry={retry} /> : null}
                {!loading && !error && testimonials.length === 0 ? <p className="resource-empty">Client notes will appear here.</p> : null}
                {!loading && !error ? testimonials.map((testimonial, index) => (
                    <figure key={String(testimonial._id || testimonial.name)} className="testimonial-entry" data-reveal style={{ "--row-index": index }}>
                        <blockquote>“{testimonial.quote || testimonial.quotes || ""}”</blockquote>
                        <figcaption>
                            <span className="testimonial-initials" aria-hidden="true">{testimonial.initials || (testimonial.name || "").split(" ").map((name) => name[0]).join("")}</span>
                            <span><strong>{testimonial.name}</strong><small>{testimonial.service || "Liv Estetik client"}</small></span>
                            <span className="testimonial-rating" aria-label={`${testimonial.rating || 5} out of 5`}>{testimonial.rating || 5}<span aria-hidden="true"> / 5</span></span>
                        </figcaption>
                    </figure>
                )) : null}
            </div>
        </section>
    );
}