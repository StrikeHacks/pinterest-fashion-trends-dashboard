const API_BASE = "http://localhost:3001/api";

export async function fetchCountries() {
  const res = await fetch(`${API_BASE}/trends/countries`);
  const data = await res.json();
  return data.countries;
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/trends/categories`);
  const data = await res.json();
  return data.categories;
}

export async function fetchStats(country = null, interest = null) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (interest) params.set("interest", interest);
  const res = await fetch(`${API_BASE}/stats?${params}`);
  return res.json();
}

export async function fetchTrends(country, trendType = "growing", interest = null) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (trendType) params.set("trend_type", trendType);
  if (interest) params.set("interest", interest);
  params.set("limit", "50");

  const res = await fetch(`${API_BASE}/trends?${params}`);
  const data = await res.json();
  return data.trends;
}

export async function fetchKeywordDetail(keyword, country, trendType) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (trendType) params.set("trend_type", trendType);

  const res = await fetch(
    `${API_BASE}/keyword/${encodeURIComponent(keyword)}?${params}`
  );
  return res.json();
}

export async function fetchKeywordImages(keyword) {
  const res = await fetch(
    `${API_BASE}/keyword/${encodeURIComponent(keyword)}/images`
  );
  const data = await res.json();
  return data.images || [];
}
