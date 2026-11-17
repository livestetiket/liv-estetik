export default function BrandLogo({ className = "" }) {
  return (
    <img
      className={`brand-wordmark ${className}`}
      src="/image/logo_liv-removebg-preview.png"
      alt="Liv Estetik — Hair, Skin, Body"
    />
  );
}
