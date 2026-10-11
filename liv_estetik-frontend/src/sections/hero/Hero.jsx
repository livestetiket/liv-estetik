import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";

export default function Hero() {
    return (
        <section id="home" className="le-hero" style={{ position: "relative", overflow: "hidden" }}>
            <HeroBackground />
            <HeroContent />
        </section>
    );
}
