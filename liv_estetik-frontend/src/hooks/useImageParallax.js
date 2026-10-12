import { useEffect } from "react";

export function useImageParallax() {
    useEffect(() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (reducedMotion.matches) return undefined;

        const images = document.querySelectorAll("[data-parallax]");
        let frame = 0;

        const update = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                images.forEach((image) => {
                    const bounds = image.getBoundingClientRect();
                    const distance = (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / window.innerHeight;
                    const offset = Math.max(-8, Math.min(8, distance * 16));
                    image.style.setProperty("--parallax-y", `${offset}px`);
                });
            });
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);
}