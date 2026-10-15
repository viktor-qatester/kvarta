const STORAGE_KEY = "kvarta_entry_attribution";

export type StoredAttribution = {
  landingUrl: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

function readParam(params: URLSearchParams, key: string): string | null {
  const value = params.get(key);
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/** Первый заход во вкладке: URL и UTM из адресной строки в момент загрузки. */
export function captureEntryAttribution(): void {
  if (typeof window === "undefined") {
    return;
  }
  if (sessionStorage.getItem(STORAGE_KEY)) {
    return;
  }

  const url = new URL(window.location.href);
  const payload: StoredAttribution = {
    landingUrl: `${url.origin}${url.pathname}${url.search}`,
    utmSource: readParam(url.searchParams, "utm_source"),
    utmMedium: readParam(url.searchParams, "utm_medium"),
    utmCampaign: readParam(url.searchParams, "utm_campaign"),
    utmTerm: readParam(url.searchParams, "utm_term"),
    utmContent: readParam(url.searchParams, "utm_content"),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getEntryAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredAttribution;
  } catch {
    return null;
  }
}

export { UTM_KEYS };
