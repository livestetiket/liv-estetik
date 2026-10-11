import { useEffect, useState } from "react";
import { SOCIALS } from "../constants";
import { getServices } from "../api";

export default function Footer() {
    const [services, setServices] = useState([]);

    useEffect(() => {
        let mounted = true;
        getServices()
            .then((data) => mounted && setServices(data || []))
            .catch((err) => console.error("Failed to load footer services:", err));
        return () => (mounted = false);
    }, []);

    return (
        <footer className="le-footer">
            <div className="le-footer-top">
                <div>
                    <div className="le-footer-logo">Liv Estetik</div>
                    <p className="le-footer-about">
                        A refined destination for hair restoration, luminous skin,
                        anti-aging artistry, and body wellness.
                    </p>
                </div>
                <div>
                    <div className="le-footer-col-title">Services</div>
                    <ul className="le-footer-links">
                        {(services.slice(0, 5).map(s => s.name)).map((s) => (
                            <li key={s}><a href="#services">{s}</a></li>
                        ))}
                    </ul>
                </div>
                <div>
                    <div className="le-footer-col-title">Clinic</div>
                    <ul className="le-footer-links">
                        {[["Our Philosophy", "#philosophy"], ["Client Stories", "#testimonials"], ["Book a Consultation", "#booking"]].map(([label, href]) => (
                            <li key={label}><a href={href}>{label}</a></li>
                        ))}
                    </ul>
                </div>
                <div>
    <div className="le-footer-col-title">Contact</div>

    <ul className="le-footer-links">
        {SOCIALS.map(({ label, icon: Icon, href }) => (
            <li key={label}>
                <a href={href} className="le-footer-social">
                    <Icon size={14} />
                </a>
            </li>
        ))}
    </ul>
</div>
            </div>
            <div className="le-footer-bottom">
                <div className="le-footer-copy">© {new Date().getFullYear()} Liv Estetik. All rights reserved.</div>
                <div className="le-footer-bottom-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms</a>
                </div>
            </div>
        </footer>
    );
}