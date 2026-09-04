import { extractImportedTab, normalizeUrl } from "./tabparse";

export async function importTabFromUrl(rawUrl: string): Promise<{ title: string; tab: string; sourceUrl: string }> {
  const sourceUrl = normalizeUrl(rawUrl);
  const page = await readPublicPage(sourceUrl);
  const extracted = extractImportedTab(page, sourceUrl);
  if (extracted.tab.trim().length < 12) {
    throw new Error("No tab or chords found on that page. Copy the tab text and paste it instead.");
  }
  return { ...extracted, sourceUrl };
}

async function readPublicPage(url: string): Promise<string> {
  const attempts = [
    url,
    `https://r.jina.ai/${url}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];
  let lastError = "Could not open that page.";
  for (const endpoint of attempts) {
    try {
      const res = await fetch(endpoint, { headers: { Accept: "text/plain, text/markdown, text/html" } });
      if (!res.ok) {
        lastError = `That page returned ${res.status}.`;
        continue;
      }
      const text = await res.text();
      if (text.trim().length > 40) return text;
    } catch {
      lastError = "The phone could not reach that site.";
    }
  }
  throw new Error(`${lastError} Copy the tab from the site and paste it here.`);
}
