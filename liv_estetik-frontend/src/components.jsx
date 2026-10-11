import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

export function useGlobalStyles(css) {
    useEffect(() => {
        const id = "le-global-styles";
        if (document.getElementById(id)) return;
        const el = document.createElement("style");
        el.id = id;
        el.textContent = css;
        document.head.appendChild(el);
        return () => el.remove();
    }, [css]);
}

export function FadeUp({ children, delay = 0, className = "" }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

export function ServiceCard({ service, index }) {
    const isComingSoon = Boolean(service.isComingSoon || service.comingSoon || (!service.active && service.visible));

    return (
        <motion.article
            className="le-service-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            layout
        >
            <div className="le-service-icon">{service.icon}</div>
            <span className={`le-service-badge ${isComingSoon ? "le-badge-soon" : "le-badge-active"}`}>
                {isComingSoon ? "Coming soon" : "Available"}
            </span>
            <div className="le-service-cat">{service.category}</div>
            <h4 className="le-service-name">{service.name}</h4>
        </motion.article>
    );
}