import { motion } from "framer-motion";

export default function BookingBackground() {
    return (
        <div className="le-booking-bg-overlay" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
            <svg viewBox="0 0 1440 850" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Elegant golden background animations">
                <defs>
                    <linearGradient id="bookGoldenLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f6d589" stopOpacity="0" />
                        <stop offset="40%" stopColor="#f6d589" stopOpacity="0.32" />
                        <stop offset="60%" stopColor="#e3b84a" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#f6d589" stopOpacity="0" />
                    </linearGradient>
                    <filter id="bookGoldenGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="bookSoftGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <motion.path
                    d="M-100 250 Q380 520 780 220 T1600 580"
                    stroke="url(#bookGoldenLineGrad)"
                    strokeWidth="2.2"
                    fill="none"
                    filter="url(#bookGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                />
                <motion.path
                    d="M-80 400 Q280 80 720 380 T1550 180"
                    stroke="url(#bookGoldenLineGrad)"
                    strokeWidth="1.8"
                    fill="none"
                    filter="url(#bookGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2.5 }}
                />
                <motion.path
                    d="M-50 650 Q420 480 880 620 T1650 380"
                    stroke="url(#bookGoldenLineGrad)"
                    strokeWidth="2.5"
                    fill="none"
                    filter="url(#bookGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 5 }}
                />
                <motion.path
                    d="M-120 280 Q480 680 820 180 T1600 720"
                    stroke="url(#bookGoldenLineGrad)"
                    strokeWidth="1.5"
                    fill="none"
                    filter="url(#bookGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 23, repeat: Infinity, ease: "linear", delay: 0.8 }}
                />
                <motion.path
                    d="M-60 150 Q320 280 760 120 T1500 420"
                    stroke="url(#bookGoldenLineGrad)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#bookGoldenGlow)"
                    initial={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
                    animate={{ strokeDashoffset: -2500 }}
                    transition={{ duration: 13, repeat: Infinity, ease: "linear", delay: 8 }}
                />

                <motion.circle cx="320" cy="210" r="4" fill="#f6d589" filter="url(#bookSoftGlow)" animate={{ opacity: [0.15, 0.7, 0.15], y: [0, -25, 0] }} transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }} />
                <motion.circle cx="850" cy="540" r="4.5" fill="#e3b84a" filter="url(#bookSoftGlow)" animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -20, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />
            </svg>
        </div>
    );
}
