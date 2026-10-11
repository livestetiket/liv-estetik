import { NAV_LINKS } from "../constants";

export default function Nav() {
    return (
        <nav className="le-nav">
            <img
                src="/image/logo_liv-removebg-preview.png"
                alt="Liv Estetik Logo"
                className="w-32 h-auto le-nav-logo"
            />
            <ul className="le-nav-links">
                {NAV_LINKS.map((l) => (
                    <li key={l.label}><a href={l.href}>{l.label}</a></li>
                ))}
            </ul>
            <a href="#booking" className="le-nav-cta">Book Now</a>
        </nav>
    );
}