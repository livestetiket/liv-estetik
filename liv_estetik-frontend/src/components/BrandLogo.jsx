import brandLogo from "../../image/logo_liv-removebg-preview.png";

export default function BrandLogo({ className = "" }) {
    return <img className={`brand-logo ${className}`} src={brandLogo} alt="Liv Estetik · Hair, Skin, Body" />;
}
