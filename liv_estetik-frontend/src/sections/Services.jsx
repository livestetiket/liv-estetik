import { useState, useMemo, useCallback } from "react";
import { SERVICE_TABS } from "../siteContent";
import { FadeUp, ServiceCard } from "../components.jsx";
import { getServices } from "../api";
import useRemoteResource from "../hooks/useRemoteResource";
import { ResourceFailure, ResourceSkeleton, WakingMessage } from "../components/ResourceStates";

export default function Services() {
    const [activeTab, setActiveTab] = useState("All");
    const loadServices = useCallback(() => getServices(), []);
    const { data: services, loading, error, isWakingUp, retry } = useRemoteResource(loadServices);

    // Dynamic filtering handles API updates smoothly
    const filtered = useMemo(() =>
            activeTab === "All" ? services : services.filter((s) => s.category === activeTab),
        [activeTab, services]
    );

    return (
        <section id="services" className="services-section section-wrap">
            <div className="services-heading-grid">
                <FadeUp>
                    <p className="eyebrow">Treatments / 01</p>
                    <h2 className="display-heading">Care for the way <em>you</em> feel.</h2>
                </FadeUp>
                <FadeUp delay={0.1}>
                    <p className="section-intro">A considered range of hair, skin, and body treatments, offered with clear guidance in Bole.</p>
                </FadeUp>
            </div>

            <FadeUp className="services-controls" delay={0.08}>
                <div className="filter-list" role="group" aria-label="Filter treatments by category">
                    {SERVICE_TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            aria-pressed={activeTab === tab}
                            className={`filter-button${activeTab === tab ? " is-active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === "All" ? "All" : tab}
                        </button>
                    ))}
                </div>
            </FadeUp>

            <div className="service-list">
                {loading ? <><ResourceSkeleton rows={5} variant="service" />{isWakingUp && <WakingMessage />}</> : null}
                {error ? <ResourceFailure message={`We couldn't load the treatment list. ${error}`} onRetry={retry} /> : null}
                {!loading && !error && filtered.length === 0 ? <p className="resource-empty">There are no treatments in this category yet.</p> : null}
                {!loading && !error ? filtered.map((s, i) => (
                        <ServiceCard key={String(s._id || s.name)} service={s} index={i} />
                    )) : null}
            </div>
        </section>
    );
}