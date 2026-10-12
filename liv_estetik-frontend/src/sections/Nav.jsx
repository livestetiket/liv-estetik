import { useState } from "react";
import { NAV_LINKS } from "../siteContent";

export default function Nav() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="site-nav" aria-label="Main navigation">
            <a className="wordmark" href="#home" aria-label="Liv Estetik, home">
                <span>Liv</span><span>Estetik</span>
            </a>
            <ul className={`nav-links${menuOpen ? " is-open" : ""}`} id="site-navigation">
                {NAV_LINKS.map((link) => (
                    <li key={link.label}><a href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a></li>
                ))}
            </ul>
            <button className="mobile-nav-toggle" type="button" aria-controls="site-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
                {menuOpen ? "Close" : "Menu"}
            </button>
            <a href="#booking" className="nav-booking">Book a visit <span aria-hidden="true">↗</span></a>
        </nav>
    );
}