import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube } from "react-icons/fa";

// SERVICES removed — fetch from backend `/api/services` instead of using mock data

export const NAV_LINKS = [
    { label: "Services",   href: "#services" },
    { label: "About",      href: "#philosophy" },
    { label: "Reviews",    href: "#testimonials" },
    { label: "Booking",    href: "#booking" },
    { label: "Contact",    href: "#contact" },
];

export const SOCIALS = [
    { label: "Instagram", icon: FaInstagram, href: "https://www.instagram.com/livestetiket/" },
    { label: "Facebook",  icon: FaFacebookF,  href: "https://www.facebook.com/share/1EL9wGJB3M/?mibextid=wwXIfr" },
    { label: "TikTok",    icon: FaTiktok,     href: "https://www.tiktok.com/@livestetik" },
    { label: "YouTube",   icon: FaYoutube,    href: "#" },
];

export const MARQUEE_ITEMS = [
    "Hair Restoration", "Skin Rejuvenation", "PRP Therapy",
    "Hydra Facial", "Botox & Fillers", "Body Contouring",
    "Laser Treatments", "RF Micro-needling", "HIFU Treatment", "Cryotherapy",
];

// TESTIMONIALS removed — fetch from backend `/api/testimonials` instead of using mock data

export const PHILOSOPHY_VALUES = [
    {
        num: "01", title: "Precision",
        body: "Thoughtful consultations, refined technique, and treatment plans shaped around each individual client.",
    },
    {
        num: "02", title: "Care",
        body: "A calm, discreet experience with comfort, clarity, and dignity at the center of every interaction.",
    },
    {
        num: "03", title: "Innovation",
        body: "Modern aesthetic methods selected for visible results and responsible, long-lasting outcomes.",
    },
];

export const SERVICE_TABS = ["All", "Hair", "Skin / Anti-aging", "Body"];

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ev:          #0b2b2b;
    --ev2:         #0f3b3b;
    --ev3:         #164545;
    --gold:        #c9a84c;
    --gold2:       #e8c87a;
    --gold3:       #f5e6b4;
    --porcelain:   #f8f5f0;
    --ink:         #1a1a18;
    --ink2:         #3a3a36;
    --display:     'Cormorant Garamond', Georgia, serif;
    --body:        'Inter', -apple-system, sans-serif;
  }

  html { scroll-behavior: smooth; }
  body { font-family: var(--body); background: var(--porcelain); color: var(--ink); overflow-x: hidden; }

  /* ── Nav ── */
  .le-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(11,43,43,0.92); backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(201,168,76,0.15);
    padding: 0 2rem; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .le-nav-logo {
    font-family: var(--display); font-size: 1.6rem; font-weight: 400;
    color: var(--gold2); letter-spacing: 0.05em; text-decoration: none;
  }
  .le-nav-links { display: flex; gap: 2rem; list-style: none; }
  .le-nav-links a {
    font-size: 0.75rem; font-weight: 500; letter-spacing: 0.15em;
    text-transform: uppercase; color: rgba(232,200,122,0.7);
    text-decoration: none; transition: color 0.2s;
  }
  .le-nav-links a:hover { color: var(--gold2); }
  .le-nav-cta {
    background: var(--gold); color: var(--ev);
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; padding: 0.6rem 1.4rem;
    border-radius: 100px; text-decoration: none;
    transition: background 0.2s, transform 0.2s;
  }
  .le-nav-cta:hover { background: var(--gold2); transform: translateY(-1px); }

  /* ── Hero ── */
  .le-hero {
    min-height: 100vh;
    background: linear-gradient(160deg, var(--ev) 0%, #0a2020 55%, #112828 100%);
    padding-top: 64px;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 4rem; align-items: center;
    padding-left: 6rem; padding-right: 4rem;
    position: relative; overflow: hidden;
  }
  .le-hero::before {
    content: ''; position: absolute; top: -40%; right: -10%;
    width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .le-hero::after {
    content: ''; position: absolute; bottom: -20%; left: 20%;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(15,59,59,0.5) 0%, transparent 70%);
    pointer-events: none;
  }
  .le-hero-left { position: relative; z-index: 2; }

  .le-hero-pill {
    display: inline-flex; align-items: center; gap: 0.5rem;
    border: 1px solid rgba(201,168,76,0.3); border-radius: 100px;
    padding: 0.4rem 1rem; font-size: 0.65rem; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold2);
    margin-bottom: 1.8rem;
  }
  .le-hero-pill-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--gold);
    animation: le-pulse 2s infinite;
  }
  @keyframes le-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .le-hero-title {
    font-family: var(--display); font-size: clamp(3rem, 5vw, 4.8rem);
    font-weight: 300; line-height: 1.05; color: #fff; margin-bottom: 1.5rem;
  }
  .le-hero-title em { font-style: italic; color: var(--gold2); }

  .le-hero-sub {
    font-size: 1rem; font-weight: 300; line-height: 1.8;
    color: rgba(255,255,255,0.6); max-width: 440px; margin-bottom: 2.5rem;
  }

  .le-hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }

  .le-btn-primary {
    background: var(--gold); color: var(--ev);
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; padding: 1rem 2rem; border-radius: 100px;
    text-decoration: none; display: inline-block; transition: all 0.25s;
  }
  .le-btn-primary:hover {
    background: var(--gold2); transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(201,168,76,0.3);
  }
  .le-btn-ghost {
    border: 1px solid rgba(201,168,76,0.4); color: var(--gold2);
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; padding: 1rem 2rem; border-radius: 100px;
    text-decoration: none; display: inline-block; transition: all 0.25s;
  }
  .le-btn-ghost:hover { background: rgba(201,168,76,0.1); transform: translateY(-2px); }

  .le-hero-stats {
    display: flex; gap: 2.5rem; margin-top: 3rem;
    padding-top: 2rem; border-top: 1px solid rgba(201,168,76,0.15);
  }
  .le-hero-stat-num {
    font-family: var(--display); font-size: 2.2rem;
    font-weight: 400; color: var(--gold2);
  }
  .le-hero-stat-label {
    font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase;
    color: rgba(255,255,255,0.4); margin-top: 0.2rem;
  }

  .le-hero-right {
    position: relative; z-index: 2;
    display: flex; justify-content: center; align-items: center; padding: 2rem;
  }
  .le-hero-card {
    border: 1px solid rgba(201,168,76,0.25); border-radius: 2.5rem;
    overflow: hidden; width: 100%; max-width: 380px;
    background: rgba(15,59,59,0.5); backdrop-filter: blur(12px);
    aspect-ratio: 4 / 5; position: relative;
    animation: le-float 5s ease-in-out infinite;
  }
  @keyframes le-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .le-hero-card-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(circle at 30% 20%, rgba(201,168,76,0.12) 0%, transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(15,59,59,0.8) 0%, transparent 60%);
  }
  .le-hero-card-badge {
    position: absolute; bottom: 1.5rem; left: 1.5rem; right: 1.5rem;
    background: rgba(11,43,43,0.85); backdrop-filter: blur(10px);
    border: 1px solid rgba(201,168,76,0.2); border-radius: 1.2rem;
    padding: 1.2rem 1.4rem;
  }
  .le-hero-card-badge-eyebrow {
    font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 0.5rem;
  }
  .le-hero-card-badge-title {
    font-family: var(--display); font-size: 1.35rem; font-weight: 400;
    color: #fff; line-height: 1.3;
  }

  /* ── Marquee ── */
  .le-marquee { background: var(--gold); padding: 1rem 0; overflow: hidden; white-space: nowrap; }
  .le-marquee-track { display: inline-flex; animation: le-marquee 30s linear infinite; }
  @keyframes le-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .le-marquee-item {
    display: inline-flex; align-items: center; gap: 0.8rem; padding: 0 2rem;
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--ev);
  }
  .le-marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ev); opacity: 0.5; flex-shrink: 0; }

  /* ── Sections shared ── */
  .le-section-eyebrow {
    font-size: 0.62rem; font-weight: 700; letter-spacing: 0.32em;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 1rem; text-align: center;
  }
  .le-section-title {
    font-family: var(--display); font-size: clamp(2rem, 3.5vw, 3rem);
    font-weight: 400; line-height: 1.2; text-align: center;
    color: var(--ev); margin-bottom: 0.8rem;
  }
  .le-section-desc {
    font-size: 0.95rem; font-weight: 300; line-height: 1.8; color: var(--ink2);
    text-align: center; max-width: 560px; margin: 0 auto 4rem; opacity: 0.75;
  }

  /* ── Services ── */
  .le-services { background: var(--porcelain); padding: 7rem 6rem; }

  .le-services-tabs { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 3rem; }
  .le-tab-btn {
    border: 1px solid rgba(11,43,43,0.2); border-radius: 100px;
    padding: 0.55rem 1.4rem; font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.1em; background: transparent; color: var(--ink2);
    cursor: pointer; transition: all 0.2s; font-family: var(--body);
  }
  .le-tab-btn.active { background: var(--ev); color: var(--gold2); border-color: var(--ev); }
  .le-tab-btn:hover:not(.active) { background: rgba(11,43,43,0.06); }

  .le-services-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.2rem;
  }

  .le-service-card {
    background: #fff; border: 1px solid rgba(201,168,76,0.15); border-radius: 1.5rem;
    padding: 1.6rem; position: relative; overflow: hidden;
    transition: transform 0.25s, box-shadow 0.25s; cursor: pointer;
  }
  .le-service-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--ev2), var(--gold), var(--ev2)); opacity: 0.6;
  }
  .le-service-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(11,43,43,0.12); }

  .le-service-icon {
    width: 52px; height: 52px; border-radius: 14px; background: var(--ev);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1.4rem; font-size: 1.4rem;
  }
  .le-service-badge {
    position: absolute; top: 1.4rem; right: 1.4rem;
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 0.3rem 0.7rem; border-radius: 100px;
  }
  .le-badge-active { background: #eaf5ef; color: #166534; }
  .le-badge-soon   { background: #fdf5e6; color: #92400e; }
  .le-service-cat { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.5rem; }
  .le-service-name { font-family: var(--display); font-size: 1.35rem; font-weight: 500; line-height: 1.25; color: var(--ev); min-height: 60px; }

  /* ── Philosophy ── */
  .le-philosophy {
    background: var(--ev); padding: 7rem 6rem; position: relative; overflow: hidden;
  }
  .le-philosophy::before {
    content: ''; position: absolute; top: 0; right: 0;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%);
  }
  .le-phil-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 5rem; margin-top: 4rem; align-items: center; position: relative; z-index: 1;
  }
  .le-phil-tagline {
    font-family: var(--display); font-size: 1.8rem; font-weight: 300;
    font-style: italic; color: rgba(255,255,255,0.5); line-height: 1.5; margin-top: 1.5rem;
  }
  .le-phil-cards { display: flex; flex-direction: column; gap: 1rem; }
  .le-phil-card {
    border: 1px solid rgba(201,168,76,0.15); border-radius: 1.2rem;
    padding: 1.6rem 1.8rem; display: flex; gap: 1.2rem; align-items: flex-start;
    transition: border-color 0.2s, background 0.2s;
  }
  .le-phil-card:hover { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.05); }
  .le-phil-num {
    font-family: var(--display); font-size: 2.5rem; font-weight: 300;
    color: rgba(201,168,76,0.25); line-height: 1; flex-shrink: 0; width: 40px; text-align: right;
  }
  .le-phil-title { font-family: var(--display); font-size: 1.2rem; font-weight: 500; color: var(--gold2); margin-bottom: 0.4rem; }
  .le-phil-body { font-size: 0.85rem; font-weight: 300; line-height: 1.8; color: rgba(255,255,255,0.55); }

  /* ── Testimonials ── */
  .le-testimonials { background: var(--porcelain); padding: 7rem 6rem; }
  .le-testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  .le-testim-card {
    background: #fff; border: 1px solid rgba(201,168,76,0.15);
    border-radius: 1.5rem; padding: 2rem; position: relative;
  }
  .le-stars { display: flex; gap: 3px; margin-bottom: 1.2rem; color: var(--gold); font-size: 0.85rem; }
  .le-quote {
    font-family: var(--display); font-size: 1.15rem; font-weight: 400;
    font-style: italic; line-height: 1.7; color: var(--ink); margin-bottom: 1.5rem;
  }
  .le-quote-mark {
    font-family: var(--display); font-size: 5rem; font-weight: 300; line-height: 0;
    color: rgba(201,168,76,0.15); position: absolute; top: 2.5rem; right: 2rem;
  }
  .le-testim-author {
    display: flex; align-items: center; gap: 0.8rem;
    padding-top: 1.2rem; border-top: 1px solid rgba(201,168,76,0.12);
  }
  .le-testim-avatar {
    width: 38px; height: 38px; border-radius: 50%; background: var(--ev);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 600; color: var(--gold2); letter-spacing: 0.05em; flex-shrink: 0;
  }
  .le-testim-name { font-weight: 600; font-size: 0.85rem; color: var(--ev); }
  .le-testim-service { font-size: 0.72rem; color: rgba(26,26,24,0.45); margin-top: 1px; }

  /* ── Booking & Forms ── */
  .le-booking {
    background: var(--ev); padding: 7rem 6rem; position: relative; overflow: hidden;
  }
  .le-booking::before {
    content: ''; position: absolute; bottom: -30%; left: -10%;
    width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .le-booking-grid {
    display: grid; grid-template-columns: 0.85fr 1.15fr;
    gap: 5rem; align-items: start; position: relative; z-index: 1;
  }
  .le-booking-sub {
    font-size: 0.9rem; font-weight: 300; line-height: 1.85;
    color: rgba(255,255,255,0.5); margin-bottom: 2.5rem;
  }
  .le-booking-contact { display: flex; flex-direction: column; gap: 0.8rem; }
  .le-booking-contact-item { display: flex; align-items: center; gap: 0.8rem; font-size: 0.82rem; color: rgba(255,255,255,0.5); }
  .le-booking-contact-item svg { color: var(--gold); flex-shrink: 0; }

  .le-form-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(201,168,76,0.15);
    border-radius: 2rem; padding: 2.5rem; backdrop-filter: blur(10px);
  }
  .le-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .le-form-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .le-form-label {
    font-size: 0.68rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--gold);
  }
  .le-form-input, .le-form-select, .le-form-textarea {
    background: rgba(255,255,255,0.92); border: 1px solid rgba(201,168,76,0.2);
    border-radius: 10px; padding: 0.7rem 1rem;
    font-size: 0.85rem; font-family: var(--body); color: var(--ink);
    outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
  }
  .le-form-input:focus, .le-form-select:focus, .le-form-textarea:focus {
    border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
  }
  .le-form-textarea { resize: vertical; min-height: 90px; }

  .le-services-check-label-text { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin: 1.2rem 0 0.7rem; display: block; }
  .le-services-check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.2rem; }
  .le-service-check-label {
    display: flex; align-items: center; gap: 0.55rem; padding: 0.55rem 0.9rem;
    border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
    font-size: 0.75rem; color: rgba(255,255,255,0.65); cursor: pointer; transition: all 0.2s;
  }
  .le-service-check-label:hover { border-color: rgba(201,168,76,0.4); color: rgba(255,255,255,0.9); }
  .le-service-check-label input { accent-color: var(--gold); }

  .le-form-submit {
    width: 100%; background: var(--gold); color: var(--ev);
    border: none; border-radius: 100px; padding: 1rem;
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; cursor: pointer; transition: all 0.25s;
    margin-top: 0.5rem; font-family: var(--body);
  }
  .le-form-submit:hover {
    background: var(--gold2); transform: translateY(-1px);
    box-shadow: 0 10px 30px rgba(201,168,76,0.3);
  }
  .le-btn-secondary {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 160px; padding: 0.95rem 1.35rem;
    border-radius: 100px; border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9);
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; cursor: pointer; transition: all 0.25s;
  }
  .le-btn-secondary:hover {
    background: rgba(255,255,255,0.14); transform: translateY(-1px);
  }
  .le-stepper {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.9rem;
    margin: 2rem 0 1.5rem; padding: 0 0.5rem;
  }
  .le-step {
    position: relative; display: flex; flex-direction: column; align-items: center;
    padding: 1rem 0.7rem; border-radius: 1.5rem;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.75);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 0.78rem; text-align: center;
  }
  .le-step.active {
    background: rgba(255,255,255,0.12); color: #fff;
    border-color: rgba(201,168,76,0.4); box-shadow: 0 20px 60px rgba(0,0,0,0.12);
  }
  .le-step::before {
    content: attr(data-step);
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 999px;
    background: rgba(201,168,76,0.15); color: #fff; margin-bottom: 0.5rem;
    font-size: 0.8rem; font-weight: 700;
  }
  .le-step.active::before {
    background: var(--gold);
    color: var(--ev);
  }
  .le-panel-card {
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 2rem; padding: 2rem; backdrop-filter: blur(12px);
    box-shadow: 0 40px 120px rgba(0,0,0,0.12);
  }
  .le-card-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;
  }
  .le-summary-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;
  }
  .le-summary-card {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15);
    border-radius: 1.75rem; padding: 1.6rem; color: #fff;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
  }
  .le-summary-card-title {
    font-size: 0.82rem; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 1rem;
  }
  .le-summary-row {
    display: flex; justify-content: space-between; gap: 0.75rem;
    padding: 0.75rem 0; border-top: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.9); font-size: 0.95rem;
  }
  .le-summary-row:first-of-type { border-top: none; }
  .le-summary-list {
    display: grid; gap: 0.6rem;
    color: rgba(255,255,255,0.9);
    font-size: 0.95rem;
  }
  .le-summary-list-item {
    padding: 0.8rem 1rem; border-radius: 1rem;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
  }
  .le-summary-banner {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.18);
    border-radius: 1.4rem; padding: 1rem 1.2rem; color: rgba(255,255,255,0.9);
    margin-bottom: 1.5rem; font-size: 0.9rem;
  }
  .le-choice-card, .le-slot-card {
    display: flex; align-items: center; gap: 1rem;
    padding: 1.05rem 1.2rem; border-radius: 1.5rem;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    color: #fff; cursor: pointer; transition: all 0.25s;
  }
  .le-choice-card > div, .le-slot-card > div {
    display: grid; gap: 0.25rem;
  }
  .le-choice-card:hover, .le-slot-card:hover {
    transform: translateY(-2px); border-color: rgba(201,168,76,0.4);
    background: rgba(255,255,255,0.12);
  }
  .le-choice-card input, .le-slot-card input { accent-color: var(--gold); }
  .le-choice-card.active, .le-slot-card.active {
    border-color: var(--gold); background: rgba(201,168,76,0.12);
  }
  .le-card-heading { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: #fff; }
  .le-card-meta { color: rgba(255,255,255,0.75); font-size: 0.85rem; }
  .le-day-filter-bar {
    display: flex; flex-wrap: wrap; gap: 0.7rem; margin-bottom: 1.25rem;
  }
  .le-day-filter-btn {
    border: 1px solid rgba(255,255,255,0.18); border-radius: 999px;
    background: rgba(255,255,255,0.06); color: #fff; padding: 0.55rem 0.95rem;
    font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
    cursor: pointer; transition: all 0.2s ease;
  }
  .le-day-filter-btn:hover, .le-day-filter-btn.active {
    border-color: var(--gold); background: rgba(201,168,76,0.18); color: var(--gold2);
  }
  .le-slot-group { display: grid; gap: 0.9rem; margin-bottom: 1.25rem; }
  .le-slot-group-title {
    font-size: 0.78rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold2);
  }
  .le-slot-time { font-weight: 600; color: #fff; }

  /* ── Toast ── */
  .le-toast {
    position: fixed; bottom: 2rem; left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: var(--ev); border: 1px solid rgba(201,168,76,0.4);
    border-radius: 1rem; padding: 1.2rem 2rem; text-align: center;
    color: #fff; min-width: 300px; z-index: 1000;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s;
    opacity: 0; pointer-events: none;
  }
  .le-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }
  .le-toast-title { font-family: var(--display); font-size: 1.3rem; color: var(--gold2); margin-bottom: 0.3rem; }
  .le-toast-sub { font-size: 0.78rem; color: rgba(255,255,255,0.55); }

  /* ── Footer ── */
  .le-footer { background: #060f0f; padding: 4rem 6rem 2.5rem; border-top: 1px solid rgba(201,168,76,0.1); }
  .le-footer-top {
    display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 3rem;
    margin-bottom: 3rem; padding-bottom: 3rem;
    border-bottom: 1px solid rgba(201,168,76,0.08);
  }
  .le-footer-logo { font-family: var(--display); font-size: 2rem; font-weight: 300; color: var(--gold2); letter-spacing: 0.05em; margin-bottom: 1rem; }
  .le-footer-about { font-size: 0.82rem; font-weight: 300; line-height: 1.85; color: rgba(255,255,255,0.35); margin-bottom: 1.5rem; }
  .le-footer-socials { display: flex; gap: 0.7rem; }
  .le-footer-social {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid rgba(201,168,76,0.2); display: flex; align-items: center;
    justify-content: center; color: var(--gold); font-size: 0.8rem;
    text-decoration: none; transition: all 0.2s;
  }
  .le-footer-social:hover { background: rgba(201,168,76,0.12); transform: translateY(-2px); }
  .le-footer-col-title { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 1.2rem; }
  .le-footer-links { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
  .le-footer-links a { font-size: 0.82rem; font-weight: 300; color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s; }
  .le-footer-links a:hover { color: var(--gold2); }
  .le-footer-bottom { display: flex; justify-content: space-between; align-items: center; }
  .le-footer-copy { font-size: 0.75rem; color: rgba(255,255,255,0.25); }
  .le-footer-bottom-links { display: flex; gap: 1.5rem; }
  .le-footer-bottom-links a { font-size: 0.72rem; color: rgba(255,255,255,0.25); text-decoration: none; transition: color 0.2s; }
  .le-footer-bottom-links a:hover { color: var(--gold2); }
 .le-footer-social {
    display: flex;
    align-items: center;
    gap: 10px;

    width: 140px;           /* or min-width: 140px */
    padding: 10px 16px;

    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 8px;     /* Rectangle with rounded corners */

    color: rgba(255,255,255,0.7);
    text-decoration: none;
    transition: all 0.25s ease;
}

.le-footer-social:hover {
    background: rgba(201,168,76,0.12);
    border-color: var(--gold);
    transform: translateY(-2px);
}

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .le-hero { grid-template-columns: 1fr; padding-left: 2rem; padding-right: 2rem; text-align: center; }
    .le-hero-right { display: none; }
    .le-hero-actions { justify-content: center; }
    .le-hero-stats { justify-content: center; }
    .le-services { padding: 4rem 2rem; }
    .le-testimonials { padding: 4rem 2rem; }
    .le-testimonials-grid { grid-template-columns: 1fr; }
    .le-philosophy { padding: 4rem 2rem; }
    .le-phil-grid { grid-template-columns: 1fr; gap: 2rem; margin-top: 2rem; }
    .le-booking { padding: 4rem 2rem; }
    .le-booking-grid { grid-template-columns: 1fr; gap: 2.5rem; }
    .le-footer { padding: 3rem 2rem 2rem; }
    .le-footer-top { grid-template-columns: 1fr 1fr; }
    .le-nav { padding: 0 1rem; }
    .le-nav-links { display: none; }
  }
`;