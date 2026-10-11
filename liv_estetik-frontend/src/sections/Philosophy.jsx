import { PHILOSOPHY_VALUES } from "../constants";
import { FadeUp } from "../components.jsx";
import { motion } from "framer-motion";

export default function Philosophy() {
    return (
        <section id="philosophy" className="le-philosophy" style={{ position: "relative", overflow: "hidden" }}>

            {/* --- 5 SIMULTANEOUS GLOWING BACKGROUND LINES --- */}
            <div className="le-phil-bg-overlay" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
                <svg viewBox="0 0 1440 850" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Elegant golden background animations">
                    <defs>
                        <linearGradient id="philGoldenLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f6d589" stopOpacity="0" />
                            <stop offset="40%" stopColor="#f6d589" stopOpacity="0.3" />
                            <stop offset="60%" stopColor="#e3b84a" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#f6d589" stopOpacity="0" />
                        </linearGradient>
                        <filter id="philGoldenGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="philSoftGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Line 1 */}
                    <motion.path
                        d="M-100 200 Q350 500 750 300 T1600 600"
                        stroke="url(#philGoldenLineGrad)"
                        strokeWidth="2.2"
                        fill="none"
                        filter="url(#philGoldenGlow)"
                        initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                        animate={{ strokeDashoffset: -2500 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Line 2 */}
                    <motion.path
                        d="M-80 500 Q250 100 700 400 T1550 200"
                        stroke="url(#philGoldenLineGrad)"
                        strokeWidth="1.8"
                        fill="none"
                        filter="url(#philGoldenGlow)"
                        initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                        animate={{ strokeDashoffset: -2500 }}
                        transition={{ duration: 19, repeat: Infinity, ease: "linear", delay: 2 }}
                    />
                    {/* Line 3 */}
                    <motion.path
                        d="M-50 750 Q400 550 850 700 T1650 400"
                        stroke="url(#philGoldenLineGrad)"
                        strokeWidth="2.5"
                        fill="none"
                        filter="url(#philGoldenGlow)"
                        initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                        animate={{ strokeDashoffset: -2500 }}
                        transition={{ duration: 17, repeat: Infinity, ease: "linear", delay: 4.5 }}
                    />
                    {/* Line 4 */}
                    <motion.path
                        d="M-120 350 Q450 700 800 200 T1600 750"
                        stroke="url(#philGoldenLineGrad)"
                        strokeWidth="1.5"
                        fill="none"
                        filter="url(#philGoldenGlow)"
                        initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                        animate={{ strokeDashoffset: -2500 }}
                        transition={{ duration: 24, repeat: Infinity, ease: "linear", delay: 1 }}
                    />
                    {/* Line 5 */}
                    <motion.path
                        d="M-60 120 Q300 300 750 150 T1500 450"
                        stroke="url(#philGoldenLineGrad)"
                        strokeWidth="2"
                        fill="none"
                        filter="url(#philGoldenGlow)"
                        initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                        animate={{ strokeDashoffset: -2500 }}
                        transition={{ duration: 14, repeat: Infinity, ease: "linear", delay: 7 }}
                    />

                    {/* Floating ambient aesthetic particles */}
                    <motion.circle cx="250" cy="140" r="4" fill="#f6d589" filter="url(#philSoftGlow)" animate={{ opacity: [0.15, 0.7, 0.15], y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
                    <motion.circle cx="600" cy="620" r="3" fill="#e3b84a" filter="url(#philSoftGlow)" animate={{ opacity: [0.1, 0.6, 0.1], y: [0, -30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
                    <motion.circle cx="1050" cy="280" r="4.5" fill="#f6d589" filter="url(#philSoftGlow)" animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -25, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 3 }} />
                </svg>
            </div>

            {/* --- ORIGINAL CONTENT GRID WITH HIGHER Z-INDEX --- */}
            <div className="le-phil-grid" style={{ position: "relative", zIndex: 1 }}>
                <FadeUp>
                    <p className="le-section-eyebrow" style={{ textAlign: "left" }}>Why Liv Estetik</p>
                    <h2 className="le-section-title" style={{ textAlign: "left", color: "#fff" }}>
                        A quieter kind<br />of luxury
                    </h2>
                    <p className="le-phil-tagline">"Beauty should feel personal, calm, and exacting."</p>
                </FadeUp>

                <FadeUp delay={0.15}>
                    <div className="le-phil-cards">
                        {PHILOSOPHY_VALUES.map((v) => (
                            <div key={v.title} className="le-phil-card">
                                <div className="le-phil-num">{v.num}</div>
                                <div>
                                    <div className="le-phil-title">{v.title}</div>
                                    <div className="le-phil-body">{v.body}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </FadeUp>
            </div>
        </section>
    );
}