import { useState } from "react";
import { NAV_LINKS } from "../siteContent";

export default function Nav() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="site-nav" aria-label="Main navigation">
            <a className="wordmark" href="#home" aria-label="Liv Estetik, home"><span>Liv</span><span>Estetik</span></a>
            <ul className={`nav-links${menuOpen ? " is-open" : ""}`} id="site-navigation">
                {NAV_LINKS.map((link) => <li key={link.label}><a href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a></li>)}
            </ul>
            <button className="mobile-nav-toggle" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-controls="site-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">{menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
            </button>
            <a href="#booking" className="nav-booking">Book a visit <span aria-hidden="true">↗</span></a>
        </nav>
    );
}
