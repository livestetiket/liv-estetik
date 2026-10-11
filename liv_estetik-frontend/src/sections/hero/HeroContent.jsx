import { motion } from "framer-motion";

export default function HeroContent() {
    return (
        <>
            <motion.div
                className="le-hero-left"
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ position: "relative", zIndex: 1 }}
            >
                <div className="le-hero-pill">
                    <div className="le-hero-pill-dot" />
                    Luxury aesthetic clinic
                </div>

                <h1 className="le-hero-title">
                    Elevate your <em>confidence</em><br />with Liv Estetik
                </h1>

                <p className="le-hero-sub">
                    A refined destination for hair restoration, luminous skin, anti-aging artistry,
                    and body wellness — guided by precision, care, and innovation.
                </p>

                <div className="le-hero-actions">
                    <a href="#booking" className="le-btn-primary">Start Booking</a>
                    <a href="#services" className="le-btn-ghost">View Services</a>
                </div>

                <div className="le-hero-stats">
                    {[ ["1,200+", "Clients served"], ["16", "Services offered"], ["98%", "Satisfaction rate"] ].map(([num, label]) => (
                        <div key={label}>
                            <div className="le-hero-stat-num">{num}</div>
                            <div className="le-hero-stat-label">{label}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                className="le-hero-right"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                style={{ position: "relative", zIndex: 1 }}
            >
                <div className="le-hero-card">
                    <div className="le-hero-card-bg" />
                    <svg viewBox="0 0 380 475" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} role="img" aria-label="Elegant clinic portrait illustration">
                        <defs>
                            <linearGradient id="leG1" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f5e6b4" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.4" />
                            </linearGradient>
                            <linearGradient id="leG2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#e8c87a" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.2" />
                            </linearGradient>
                            <linearGradient id="leGold" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f6d589" stopOpacity="0.95" />
                                <stop offset="60%" stopColor="#e3b84a" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#c79e2f" stopOpacity="0.45" />
                            </linearGradient>
                            <linearGradient id="goldenLineGrad1" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f6d589" stopOpacity="0" />
                                <stop offset="50%" stopColor="#f6d589" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#f6d589" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="goldenLineGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#e3b84a" stopOpacity="0" />
                                <stop offset="50%" stopColor="#e3b84a" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#e3b84a" stopOpacity="0" />
                            </linearGradient>
                            <filter id="goldenGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
                                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <motion.path
                            d="M-20 50 Q95 150 190 200 Q285 250 400 320"
                            stroke="url(#goldenLineGrad1)"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                            filter="url(#goldenGlow)"
                            initial={{ strokeDasharray: 400, strokeDashoffset: 400 }}
                            animate={{ strokeDashoffset: -400 }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            style={{ pointerEvents: "none" }}
                        />
                        <motion.path
                            d="M380 30 Q320 120 280 200 Q240 280 150 360"
                            stroke="url(#goldenLineGrad1)"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            filter="url(#goldenGlow)"
                            initial={{ strokeDasharray: 400, strokeDashoffset: 400 }}
                            animate={{ strokeDashoffset: -400 }}
                            transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 0.5 }}
                            style={{ pointerEvents: "none" }}
                        />
                        <motion.path
                            d="M20 380 Q120 350 220 320 Q300 295 380 260"
                            stroke="url(#goldenLineGrad1)"
                            strokeWidth="1.8"
                            fill="none"
                            strokeLinecap="round"
                            filter="url(#goldenGlow)"
                            initial={{ strokeDasharray: 380, strokeDashoffset: 380 }}
                            animate={{ strokeDashoffset: -380 }}
                            transition={{ duration: 6.5, repeat: Infinity, ease: "linear", delay: 1 }}
                            style={{ pointerEvents: "none" }}
                        />
                        <motion.path
                            d="M60 20 Q85 150 90 350"
                            stroke="url(#goldenLineGrad2)"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            filter="url(#goldenGlow)"
                            initial={{ strokeDasharray: 380, strokeDashoffset: 380 }}
                            animate={{ strokeDashoffset: -380 }}
                            transition={{ duration: 5.5, repeat: Infinity, ease: "linear", delay: 1.2 }}
                            style={{ pointerEvents: "none" }}
                        />
                        <motion.path
                            d="M320 40 Q310 180 295 380"
                            stroke="url(#goldenLineGrad2)"
                            strokeWidth="1.8"
                            fill="none"
                            strokeLinecap="round"
                            filter="url(#goldenGlow)"
                            initial={{ strokeDasharray: 380, strokeDashoffset: 380 }}
                            animate={{ strokeDashoffset: -380 }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1.5 }}
                            style={{ pointerEvents: "none" }}
                        />

                        <motion.circle
                            cx="95"
                            cy="100"
                            r="3.5"
                            fill="#f6d589"
                            filter="url(#softGlow)"
                            initial={{ opacity: 0.2, r: 3.5 }}
                            animate={{ opacity: [0.2, 0.6, 0.2], r: [3.5, 5.5, 3.5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            style={{ pointerEvents: "none" }}
                        />
                        <motion.circle
                            cx="320"
                            cy="70"
                            r="3"
                            fill="#e3b84a"
                            filter="url(#softGlow)"
                            initial={{ opacity: 0.15, r: 3 }}
                            animate={{ opacity: [0.15, 0.5, 0.15], r: [3, 4.8, 3] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            style={{ pointerEvents: "none" }}
                        />
                        <motion.circle
                            cx="190"
                            cy="420"
                            r="2.5"
                            fill="#f6d589"
                            filter="url(#softGlow)"
                            initial={{ opacity: 0.1, r: 2.5 }}
                            animate={{ opacity: [0.1, 0.45, 0.1], r: [2.5, 4.2, 2.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            style={{ pointerEvents: "none" }}
                        />
                        <motion.circle
                            cx="70"
                            cy="350"
                            r="2"
                            fill="#e3b84a"
                            filter="url(#softGlow)"
                            initial={{ opacity: 0.08, r: 2 }}
                            animate={{ opacity: [0.08, 0.35, 0.08], r: [2, 3.5, 2] }}
                            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                            style={{ pointerEvents: "none" }}
                        />

                        <motion.ellipse
                            cx="190"
                            cy="305"
                            rx="150"
                            ry="170"
                            fill="url(#leGold)"
                            initial={{ opacity: 0.08, y: 8, scale: 0.98 }}
                            animate={{ opacity: [0.08, 0.58, 0.12], y: [8, -6, 8], scale: [0.98, 1.03, 0.98] }}
                            transition={{ duration: 4.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                            style={{ pointerEvents: "none" }}
                        />

                        <ellipse cx="190" cy="155" rx="90" ry="110" fill="rgba(245,230,180,0.08)" stroke="url(#leG1)" strokeWidth="1.5" />
                        <path d="M165 255 Q190 280 215 255 L218 300 Q190 310 162 300 Z" fill="rgba(245,230,180,0.06)" stroke="url(#leG1)" strokeWidth="1.2" />
                        <path d="M80 340 Q130 290 190 295 Q250 290 300 340 L320 400 Q190 420 60 400 Z" fill="rgba(46,139,87,0.5)" stroke="url(#leG1)" strokeWidth="1.5" />
                        <path d="M148 140 Q162 132 176 140 Q162 150 148 140Z" fill="rgba(245,230,180,0.15)" stroke="url(#leG1)" strokeWidth="1.2" />
                        <path d="M204 140 Q218 132 232 140 Q218 150 204 140Z" fill="rgba(245,230,180,0.15)" stroke="url(#leG1)" strokeWidth="1.2" />
                        <path d="M144 127 Q162 119 178 124" fill="none" stroke="url(#leG1)" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M202 124 Q218 119 236 127" fill="none" stroke="url(#leG2)" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M185 155 Q182 180 175 190 Q190 197 205 190 Q198 180 195 155" fill="none" stroke="url(#leG1)" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M168 215 Q178 208 190 212 Q202 208 212 215 Q202 226 190 228 Q178 226 168 215Z" fill="rgba(245,230,180,0.12)" stroke="url(#leG1)" strokeWidth="1.2" />
                        <path d="M115 120 Q130 60 190 45 Q250 60 265 120" fill="none" stroke="url(#leG2)" strokeWidth="2" strokeLinecap="round" />
                        <path d="M108 140 Q98 100 130 70 Q115 130 118 155" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M272 140 Q282 100 250 70 Q265 130 262 155" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <div className="le-hero-card-badge">
                        <div className="le-hero-card-badge-eyebrow">Signature care</div>
                        <div className="le-hero-card-badge-title">Skin, hair & body wellness in one elegant clinic.</div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
