import { motion } from "framer-motion";
import { GLOBAL_CSS } from "./constants";
import { useGlobalStyles } from "./components.jsx";

// Section Assemblies
import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import Marquee from "./sections/Marquee";
import Services from "./sections/Services";
import Philosophy from "./sections/Philosophy";
import Testimonials from "./sections/Testimonials";
import Booking from "./sections/booking/Booking.jsx";
import Contact from "./sections/Contact";
import Footer from "./sections/Footer";

export default function App() {
    useGlobalStyles(GLOBAL_CSS);

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65 }}
            style={{ minHeight: "100vh", background: "var(--porcelain)" }}
        >
            <Nav />
            <Hero />
            <Marquee />
            <Services />
            <Philosophy />
            <Testimonials />
            <Booking />
            <Contact />
            <Footer />
        </motion.main>
    );
}