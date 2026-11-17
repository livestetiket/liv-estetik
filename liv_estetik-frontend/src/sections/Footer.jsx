import { SOCIALS } from "../siteContent";
import BrandLogo from "../components/BrandLogo";
import { useEffect, useState } from "react";
import { getClinicHours } from "../api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const clockTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export default function Footer() {
    const [schedule, setSchedule] = useState(null);
    useEffect(() => { getClinicHours().then(setSchedule).catch(() => setSchedule(null)); }, []);
    const windows = new Map((schedule?.operatingWindows || []).map((item) => [item.dayOfWeek, item]));
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: schedule?.timezone || "Africa/Addis_Ababa" }).format(new Date());
    const specialDays = [
        ...(schedule?.operatingExceptions || []),
        ...(schedule?.blockedLocalDates || []).filter((date) => !(schedule?.operatingExceptions || []).some((item) => item.localDate === date)).map((localDate) => ({ localDate, closed: true })),
    ].filter((item) => item.localDate >= today).sort((left, right) => left.localDate.localeCompare(right.localDate));
    return (
        <footer className="site-footer">
            <div className="footer-top section-wrap">
                <div className="footer-brand">
                    <a className="brand-link footer-logo-link" href="#home" aria-label="Liv Estetik, back to home"><BrandLogo className="footer-logo" /></a>
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
                    <a href="tel:+251911504001">+251 911 50 40 01</a>
                </div>
                <div className="footer-column">
                    <h2>Opening hours</h2>
                    {schedule ? DAYS.map((day, index) => {
                        const row = windows.get(index);
                        return <p key={day}>{day}: {row ? `${clockTime(row.startMinute)}–${clockTime(row.endMinute)}` : "Closed"}</p>;
                    }) : <p>Hours are temporarily unavailable. Please call the clinic.</p>}
                    {schedule && specialDays.length ? <><strong className="mt-2">Special dates</strong>{specialDays.map((item) => <p key={item.localDate}>{item.localDate}{item.label ? ` · ${item.label}` : ""}: {item.closed ? "Closed" : `${clockTime(item.startMinute)}–${clockTime(item.endMinute)}`}</p>)}</> : null}
                    <small>Local time: {schedule?.timezone || "Africa/Addis_Ababa"}</small>
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
