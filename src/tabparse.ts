const TAB_LINE =
  /^\s*(?:[eEBGDA]b?|[EeDdAa]\d)?\s*[|:]*[-~=0-9hpbxrvs\/\\().*| ]{8,}[|:]*\s*$/;

export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  const token = /^[A-G][#b]?(maj7|maj|min|m7b5|m7|m|7sus4|sus4|sus2|dim|aug|add9|add11|13|11|9|7|6)?(\/[A-G][#b]?)?$/;
  return tokens.every((t) => token.test(t));
}

export function isTabLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 8) return false;
  const dashes = (t.match(/-/g) ?? []).length;
  if (dashes < 5) return false;
  return TAB_LINE.test(t);
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Paste a link first.");
  if (/^(javascript|data|file):/i.test(trimmed)) throw new Error("That kind of link cannot be imported.");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function extractImportedTab(raw: string, sourceUrl?: string): { title: string; tab: string } {
  let text = raw.replace(/\r/g, "");
  text = unwrapMarkup(text);
  text = stripReaderChrome(text);

  const title = pickTitle(text, sourceUrl);
  const body = pickBody(text);
  return { title, tab: body.trim() };
}

function unwrapMarkup(text: string): string {
  return text
    .replace(/\[ch\]([\s\S]*?)\[\/ch\]/gi, "$1")
    .replace(/\[tab\]([\s\S]*?)\[\/tab\]/gi, "\n$1\n")
    .replace(/\[\/?(?:tab|ch)\]/gi, "")
    .replace(/```[\w]*\n?/g, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1");
}

function stripReaderChrome(text: string): string {
  return text
    .replace(/^Title:\s*(.+)$/im, "# $1")
    .replace(/^URL Source:.*$/gim, "")
    .replace(/^Markdown Content:\s*$/gim, "")
    .replace(/^Published Time:.*$/gim, "")
    .replace(/^Warning:.*$/gim, "")
    .replace(/^={3,}$/gm, "")
    .replace(/^[-*] (Home|Login|Sign up|Search|Premium|Download|App).*$/gim, "");
}

function pickTitle(text: string, sourceUrl?: string): string {
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading && heading.length < 120) return cleanTitle(heading);

  const dashed = text.match(/^(.{3,80})\s+[–—-]\s+(.{3,80})$/m);
  if (dashed) return cleanTitle(`${dashed[1]} – ${dashed[2]}`);

  if (sourceUrl) {
    try {
      const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
      const slug = decodeURIComponent(new URL(sourceUrl).pathname.split("/").filter(Boolean).pop() ?? "");
      const pretty = slug.replace(/[-_]+/g, " ").replace(/\.(html?|txt)$/i, "").trim();
      if (pretty.length > 2) return cleanTitle(pretty);
      return host;
    } catch {
      /* ignore */
    }
  }
  return "Imported tab";
}

function cleanTitle(s: string): string {
  return s
    .replace(/\s*[|].*$/, "")
    .replace(/\s+\((?:tab|chords|guitar pro).*?\)/i, "")
    .replace(/^Misc Traditional\s+[–-]\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBody(text: string): string {
  const lines = text.split("\n").map((l) => l.replace(/\s+$/, ""));
  const stopAt = lines.findIndex((line) =>
    /please rate this tab|create correction|welcome offer|\d+\s+comments|sign in to comment/i.test(line),
  );
  const usable = stopAt === -1 ? lines : lines.slice(0, stopAt);
  const tabCount = usable.filter(isTabLine).length;
  const filled = usable.filter((l) => l.trim()).length;
  const sectionIdx = usable.findIndex((line) =>
    /^\s*#*\s*\[?(intro|verse|chorus|bridge|solo|outro|instrumental|pre-chorus|interlude)/i.test(line),
  );
  const tabIdx = usable.findIndex(isTabLine);
  const mostlyTab = tabCount >= 8 && filled > 0 && tabCount >= filled * 0.25;
  let start = 0;
  if (mostlyTab && tabIdx !== -1) start = Math.max(0, tabIdx - 24);
  else if (sectionIdx !== -1) start = sectionIdx;

  const sliced = usable.slice(start).filter((line, i, arr) => {
    if (!line.trim()) return true;
    if (isTabLine(line)) return true;
    if (isChordLine(line)) return true;
    if (/official .+ tab made by ug|is this strumming pattern|there is no strumming|create and get \+5/i.test(line)) {
      return false;
    }
    if (/^\s*#+\s/.test(line)) return false;
    if (/^\s*#*\s*\[?(intro|verse|chorus|bridge|solo|outro|instrumental|pre-chorus|interlude)/i.test(line)) {
      return true;
    }
    if (/^\s*[A-G][#b]?(m|maj7|m7|7|sus\d|dim|aug)?(\s+[A-G][#b]?)/.test(line)) return true;
    const next = arr.slice(i, i + 6);
    if (next.filter(isTabLine).length >= 4) return true;
    const letterCount = (line.match(/[A-Za-z]/g) ?? []).length;
    const junk =
      /cookie|subscribe|premium|sign in|advertisement|download the app|check out the tab|added to favorites|contributors total/i.test(
        line,
      ) || /^\s*\|/.test(line);
    return letterCount > 8 && letterCount < 90 && !junk && line.length < 140;
  });

  return sliced.join("\n").replace(/^\s*```[\w]*\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function renderTabHtml(text: string, escapeHtml: (s: string) => string): string {
  return text
    .split("\n")
    .map((line) => {
      const safe = escapeHtml(line) || " ";
      if (!isTabLine(line)) return safe;
      return safe.replace(/(\d+)/g, `<span class="fret">$1</span>`);
    })
    .join("\n");
}
