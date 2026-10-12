import { SOCIALS } from "../siteContent";

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-top section-wrap">
                <div className="footer-brand">
                    <a className="wordmark" href="#home"><span>Liv</span><span>Estetik</span></a>
                    <p>Hair. Skin. Body.<br />Personal care in Addis Ababa.</p>
                </div>
                <div className="footer-column">
                    <h2>Explore</h2>
                    <a href="#services">Treatments</a>
                    <a href="#philosophy">Our approach</a>
                    <a href="#booking">Appointments</a>
                </div>
                <div className="footer-column">
                    <h2>Find us</h2>
                    <p>Bole Road, Snap Plaza<br />1st Floor, Addis Ababa</p>
                    <a href="tel:+251911504002">+251 911 50 40 02</a>
                </div>
                <div className="footer-column">
                    <h2>Follow</h2>
                    {SOCIALS.filter(({ href }) => href !== "#").map(({ label, href }) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer">{label} <span aria-hidden="true">↗</span></a>
                    ))}
                </div>
            </div>
            <div className="footer-bottom section-wrap">
                <span>© {new Date().getFullYear()} Liv Estetik</span>
                <a href="#home">Back to top ↑</a>
            </div>
        </footer>
    );
}