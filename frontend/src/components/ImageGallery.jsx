import { useEffect, useState } from "react";
import { fetchKeywordImages } from "../api";

export default function ImageGallery({ keyword }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword) {
      setImages([]);
      return;
    }
    setLoading(true);
    fetchKeywordImages(keyword)
      .then(setImages)
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [keyword]);

  if (!keyword) {
    return (
      <div className="gallery-empty-state">
        <span className="gallery-empty-icon">🖼️</span>
        <p>Select a keyword to see visual inspiration</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gallery-empty-state">
        <div className="spinner" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="gallery-empty-state">
        <span className="gallery-empty-icon">📷</span>
        <p>No images for "{keyword}"</p>
        <span className="gallery-hint">Run <code>npm run images</code> to collect</span>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <div className="gallery-grid">
        {images.map((img, i) => (
          <div key={img.pin_id || i} className="gallery-card" style={{ animationDelay: `${i * 40}ms` }}>
            <img
              src={img.image_url}
              alt={img.title || keyword}
              loading="lazy"
            />
            <div className="gallery-overlay">
              <span className="gallery-overlay-text">{img.title || keyword}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
