// Live 2GIS rating for the clinic: the value and the number of reviews, taken from the client's 2GIS widget code
// (org_id / branch_id below). The widget endpoint answers with Access-Control-Allow-Origin: *, and its HTML carries
// `rating=4.9&reviews_count=200`. The site keeps its own design; only the numbers come from 2GIS.
// Until 2GIS answers, or if it fails, the page shows the numbers from src/data/hero.json.

import { useEffect, useState } from 'react';

/** The clinic in 2GIS (org = the company, branch = the Astana branch). */
export const TWO_GIS = { orgId: '70000001066801850', branchId: '70000001066801836' } as const;

export interface TwoGisRating {
  value: number;
  count: number;
}

const ENDPOINT =
  `https://widget.2gis.ru/api/widget?org_id=${TWO_GIS.orgId}&branch_id=${TWO_GIS.branchId}&size=small&theme=light`;

/** Reads `rating` and `reviews_count` from the widget HTML; null when either is missing or out of range. */
export function parseTwoGisWidget(html: string): TwoGisRating | null {
  const value = Number(/[?&;]rating=([\d.]+)/.exec(html)?.[1]);
  const count = Number(/[?&;]reviews_count=(\d+)/.exec(html)?.[1]);
  if (!Number.isFinite(value) || value <= 0 || value > 5 || !Number.isInteger(count) || count <= 0) return null;
  return { value, count };
}

let request: Promise<TwoGisRating | null> | null = null;

/** One request per page load, shared by every component that shows the rating. */
export function fetchTwoGisRating(): Promise<TwoGisRating | null> {
  request ??= fetch(ENDPOINT, { credentials: 'omit' })
    .then((response) => (response.ok ? response.text() : ''))
    .then(parseTwoGisWidget)
    .catch(() => null);
  return request;
}

/** The fallback first, then the live 2GIS numbers once they arrive. */
export function useTwoGisRating(fallback: TwoGisRating): TwoGisRating {
  const [rating, setRating] = useState(fallback);
  useEffect(() => {
    let alive = true;
    fetchTwoGisRating().then((live) => {
      if (alive && live) setRating(live);
    });
    return () => {
      alive = false;
    };
  }, []);
  return rating;
}
