import { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SERVICE_TABS } from "../constants";
import { FadeUp, ServiceCard } from "../components.jsx";
import { getServices } from "../api";

export default function Services() {
    const [activeTab, setActiveTab] = useState("All");
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        getServices()
            .then((data) => {
                if (mounted) setServices(data || []);
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error("Failed to load services:", err);
            })
            .finally(() => mounted && setLoading(false));
        return () => (mounted = false);
    }, []);

    // Dynamic filtering handles API updates smoothly
    const filtered = useMemo(() =>
            activeTab === "All" ? services : services.filter((s) => s.category === activeTab),
        [activeTab, services]
    );

    return (
        <section id="services" className="le-services">
            <FadeUp>
                <p className="le-section-eyebrow">Services</p>
                <h2 className="le-section-title">A complete aesthetic menu,<br />curated with restraint</h2>
                <p className="le-section-desc">
                    Every treatment is presented with clarity — from active services ready for booking
                    to experiences currently being refined.
                </p>
            </FadeUp>

            <FadeUp delay={0.1}>
                <div className="le-services-tabs">
                    {SERVICE_TABS.map((tab) => (
                        <button
                            key={tab}
                            className={`le-tab-btn${activeTab === tab ? " active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === "All" ? "All Treatments" : tab}
                        </button>
                    ))}
                </div>
            </FadeUp>

            <div className="le-services-grid">
                <AnimatePresence mode="popLayout">
                    {loading ? <div>Loading services…</div> : filtered.map((s, i) => (
                        <ServiceCard key={String(s._id || s.name)} service={s} index={i} />
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
}