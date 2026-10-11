import { useState } from "react";
import { FadeUp } from "../components.jsx";
import { postMessage } from "../api";

export default function Contact() {
    const [msg, setMsg] = useState({ name: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await postMessage(msg);
            setMsg({ name: "", email: "", message: "" });
            alert("Your message was sent safely!");
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        /* CHANGED: Replaced style color overrides to use the exact same classes and styles as le-testimonials */
        <section id="contact" className="le-testimonials" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
            <div className="le-booking-grid">
                <FadeUp>
                    <p className="le-section-eyebrow" style={{ textAlign: "left" }}>Contact Us</p>
                    <h2 className="le-section-title" style={{ textAlign: "left" }}>Have a direct query?</h2>
                    <p className="le-section-desc" style={{ textAlign: "left" }}>Reach out directly through our clinic channels or drop a quick line via the secure desk form.</p>

                    <div className="le-booking-contact">
                        <div className="le-booking-contact-item" style={{ color: "#e3b84a" }}>📞 +251 911 50 40 01</div>
                        <div className="le-booking-contact-item" style={{ color: "#e3b84a" }}>📞 +251 911 50 40 02</div>
                        <div className="le-booking-contact-item" style={{ color: "#e3b84a" }}>✉️ livestetiket@gmail.com</div>
                        <div className="le-booking-contact-item" style={{ color: "#e3b84a" }}>📍 Bole Snap Plaza, Addis Ababa</div>
                    </div>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <form className="le-form-card" onSubmit={handleSend}>
                        <div className="le-form-group" style={{ marginBottom: "1rem" }}>
                            <label className="le-form-label">Name</label>
                            <input className="le-form-input" value={msg.name} onChange={e => setMsg({...msg, name: e.target.value})} required />
                        </div>
                        <div className="le-form-group" style={{ marginBottom: "1rem" }}>
                            <label className="le-form-label">Email Address</label>
                            <input className="le-form-input" type="email" value={msg.email} onChange={e => setMsg({...msg, email: e.target.value})} required />
                        </div>
                        <div className="le-form-group" style={{ marginBottom: "1rem" }}>
                            <label className="le-form-label">Message</label>
                            <textarea className="le-form-textarea" value={msg.message} onChange={e => setMsg({...msg, message: e.target.value})} required />
                        </div>
                        <button type="submit" className="le-form-submit" disabled={loading}>
                            {loading ? "Sending..." : "Send Message"}
                        </button>
                    </form>
                </FadeUp>
            </div>
        </section>
    );
}