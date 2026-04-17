const INTEREST_META = {
  womens_fashion:   { icon: "👗", label: "Women's Fashion" },
  mens_fashion:     { icon: "👔", label: "Men's Fashion" },
  beauty:           { icon: "💄", label: "Beauty" },
  wedding:          { icon: "💍", label: "Wedding" },
  home_decor:       { icon: "🏠", label: "Home Decor" },
  design:           { icon: "🎨", label: "Design" },
};

export default function CategoryFilter({ active, onChange }) {
  const interests = Object.entries(INTEREST_META);

  return (
    <div className="category-filter">
      <button
        className={`chip ${!active ? "active" : ""}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {interests.map(([id, meta]) => (
        <button
          key={id}
          className={`chip ${active === id ? "active" : ""}`}
          onClick={() => onChange(id)}
        >
          <span className="chip-icon">{meta.icon}</span>
          {meta.label}
        </button>
      ))}
    </div>
  );
}
