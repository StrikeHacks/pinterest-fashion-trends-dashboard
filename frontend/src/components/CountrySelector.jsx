const COUNTRIES = [
  { code: "US", label: "US", flag: "🇺🇸" },
  { code: "GB+IE", label: "UK", flag: "🇬🇧" },
  { code: "DE", label: "DE", flag: "🇩🇪" },
  { code: "FR", label: "FR", flag: "🇫🇷" },
];

export default function CountrySelector({ value, onChange }) {
  return (
    <div className="country-selector">
      {COUNTRIES.map((c) => (
        <button
          key={c.code}
          className={`country-btn ${value === c.code ? "active" : ""}`}
          onClick={() => onChange(c.code)}
          title={c.label}
        >
          <span className="country-flag">{c.flag}</span>
          <span className="country-label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
