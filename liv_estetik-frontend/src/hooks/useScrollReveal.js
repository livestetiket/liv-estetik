import { useEffect } from "react";

export function useScrollReveal() {
    useEffect(() => {
        const revealItems = document.querySelectorAll("[data-reveal]");
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion || !("IntersectionObserver" in window)) {
            revealItems.forEach((item) => item.classList.add("is-visible"));
            return undefined;
        }

        document.documentElement.classList.add("has-reveal");
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -48px 0px" });

        const observeRevealItems = (root) => {
            if (root.matches?.("[data-reveal]")) observer.observe(root);
            root.querySelectorAll?.("[data-reveal]").forEach((item) => observer.observe(item));
        };
        revealItems.forEach((item) => observer.observe(item));

        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) observeRevealItems(node);
            }));
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
            document.documentElement.classList.remove("has-reveal");
        };
    }, []);
}