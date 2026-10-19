import { useState } from "react";

export default function BrandLogo({ className = "" }) {
    const [imageUnavailable, setImageUnavailable] = useState(false);

    if (imageUnavailable) {
        return <span className={`brand-logo-fallback ${className}`}>Liv Estetik</span>;
    }

    return (
        <img
            className={className}
            src="/liv-estetik-logo.png"
            alt="Liv Estetik"
            onError={() => setImageUnavailable(true)}
        />
    );
}
