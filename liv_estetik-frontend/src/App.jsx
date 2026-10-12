import { useScrollReveal } from "./hooks/useScrollReveal";
import { useImageParallax } from "./hooks/useImageParallax";

// Section Assemblies
import Nav from "./sections/Nav";
import Hero from "./sections/hero/Hero";
import Marquee from "./sections/Marquee";
import Services from "./sections/Services";
import Philosophy from "./sections/Philosophy";
import Testimonials from "./sections/Testimonials";
import Booking from "./sections/booking/Booking";
import Contact from "./sections/Contact";
import Footer from "./sections/Footer";

export default function App() {
    useScrollReveal();
    useImageParallax();

    return (
        <main className="site-shell">
            <Nav />
            <Hero />
            <Marquee />
            <Services />
            <Philosophy />
            <Testimonials />
            <Booking />
            <Contact />
            <Footer />
        </main>
    );
}