import { motion } from "framer-motion";

export default function HeroBackground() {
    return (
        <div className="le-hero-bg-overlay" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
            <svg viewBox="0 0 1440 850" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Elegant golden background animations">
                <defs>
                    <linearGradient id="bgGoldenLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f6d589" stopOpacity="0" />
                        <stop offset="40%" stopColor="#f6d589" stopOpacity="0.35" />
                        <stop offset="60%" stopColor="#e3b84a" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f6d589" stopOpacity="0" />
                    </linearGradient>
                    <filter id="bgGoldenGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="bgSoftGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <motion.path
                    d="M-100 150 Q400 450 800 250 T1600 550"
                    stroke="url(#bgGoldenLineGrad)"
                    strokeWidth="2.2"
                    fill="none"
                    filter="url(#bgGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                />
                <motion.path
                    d="M-80 450 Q300 50 750 350 T1550 150"
                    stroke="url(#bgGoldenLineGrad)"
                    strokeWidth="1.8"
                    fill="none"
                    filter="url(#bgGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 1.5 }}
                />
                <motion.path
                    d="M-50 700 Q450 500 900 650 T1650 350"
                    stroke="url(#bgGoldenLineGrad)"
                    strokeWidth="2.5"
                    fill="none"
                    filter="url(#bgGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 16, repeat: Infinity, ease: "linear", delay: 4 }}
                />
                <motion.path
                    d="M-120 300 Q500 650 850 150 T1600 700"
                    stroke="url(#bgGoldenLineGrad)"
                    strokeWidth="1.5"
                    fill="none"
                    filter="url(#bgGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 22, repeat: Infinity, ease: "linear", delay: 6.2 }}
                />
                <motion.path
                    d="M-60 80 Q350 250 800 100 T1500 400"
                    stroke="url(#bgGoldenLineGrad)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#bgGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 13, repeat: Infinity, ease: "linear", delay: 8.5 }}
                />

                <motion.circle cx="150" cy="180" r="4.5" fill="#f6d589" filter="url(#bgSoftGlow)" animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -25, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
                <motion.circle cx="550" cy="580" r="3.5" fill="#e3b84a" filter="url(#bgSoftGlow)" animate={{ opacity: [0.1, 0.6, 0.1], y: [0, -35, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
                <motion.circle cx="920" cy="220" r="5" fill="#f6d589" filter="url(#bgSoftGlow)" animate={{ opacity: [0.15, 0.75, 0.15], y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.2 }} />
            </svg>
        </div>
    );
}
