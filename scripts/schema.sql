-- Pinterest Fashion Trends Dashboard
-- Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Main trends table: stores one row per keyword per country per trend type per day
CREATE TABLE IF NOT EXISTS trends (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  keyword       TEXT NOT NULL,
  country       TEXT NOT NULL,
  trend_type    TEXT NOT NULL CHECK (trend_type IN ('growing', 'monthly', 'yearly', 'seasonal')),
  interest      TEXT,                  -- Pinterest interest category (e.g. 'womens_fashion', 'beauty')
  pct_growth_wow NUMERIC DEFAULT 0,    -- week-over-week growth %
  pct_growth_mom NUMERIC DEFAULT 0,    -- month-over-month growth %
  pct_growth_yoy NUMERIC DEFAULT 0,    -- year-over-year growth %
  time_series   JSONB,                 -- historical volume data from Pinterest
  trend_status  TEXT CHECK (trend_status IN ('rising', 'stable', 'falling')),
  trend_score   NUMERIC,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fetched_date  DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Prevent duplicate entries: same keyword + country + trend_type on the same day
CREATE UNIQUE INDEX IF NOT EXISTS unique_trend_per_day
  ON trends (keyword, country, trend_type, fetched_date);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_trends_country ON trends (country);
CREATE INDEX IF NOT EXISTS idx_trends_keyword ON trends (keyword);
CREATE INDEX IF NOT EXISTS idx_trends_interest ON trends (interest);
CREATE INDEX IF NOT EXISTS idx_trends_fetched_at ON trends (fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_country_date ON trends (country, fetched_at DESC);

-- Pin images per keyword
CREATE TABLE IF NOT EXISTS trend_images (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  keyword     TEXT NOT NULL,
  pin_id      TEXT,
  image_url   TEXT NOT NULL,
  title       TEXT,
  source      TEXT DEFAULT 'pinterest',
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_image_per_pin ON trend_images (keyword, image_url);
CREATE INDEX IF NOT EXISTS idx_images_keyword ON trend_images (keyword);

-- Migration: add interest column to existing table
-- ALTER TABLE trends ADD COLUMN IF NOT EXISTS interest TEXT;
-- CREATE INDEX IF NOT EXISTS idx_trends_interest ON trends (interest);
