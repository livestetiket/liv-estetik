import { useState } from "react";
import { FadeUp } from "../components.jsx";
import { postMessage } from "../api";

export default function Contact() {
    const [msg, setMsg] = useState({ name: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            await postMessage(msg);
            setMsg({ name: "", email: "", message: "" });
            setStatus({ type: "success", message: "Thank you. Your message has reached our team." });
        } catch (err) {
            setStatus({ type: "error", message: err.message || "We couldn't send your message. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact" className="contact-section section-wrap">
            <div className="contact-layout">
                <FadeUp>
                    <p className="eyebrow">Visit / 05</p>
                    <h2 className="display-heading">Come by for a <em>talk.</em></h2>
                    <p className="section-intro">Questions about a treatment? Speak with our team or leave a note.</p>

                    <address className="contact-details">
                        <a href="tel:+251911504002">+251 911 50 40 02</a>
                        <a href="mailto:livestetiket@gmail.com">livestetiket@gmail.com</a>
                        <span>Bole Road, Snap Plaza, 1st Floor<br />Addis Ababa, Ethiopia</span>
                    </address>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <form className="contact-form" onSubmit={handleSend}>
                        <label className="form-field">
                            <span>Name</span>
                            <input name="name" autoComplete="name" value={msg.name} onChange={e => setMsg({...msg, name: e.target.value})} required />
                        </label>
                        <label className="form-field">
                            <span>Email address</span>
                            <input name="email" type="email" autoComplete="email" value={msg.email} onChange={e => setMsg({...msg, email: e.target.value})} required />
                        </label>
                        <label className="form-field">
                            <span>How can we help?</span>
                            <textarea name="message" value={msg.message} onChange={e => setMsg({...msg, message: e.target.value})} required rows="4" />
                        </label>
                        {status.message ? <p className={`form-status ${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.message}</p> : null}
                        <button type="submit" className="button-primary" disabled={loading}>
                            {loading ? "Sending..." : "Send a message"}<span aria-hidden="true">↗</span>
                        </button>
                    </form>
                </FadeUp>
            </div>
        </section>
    );
}
