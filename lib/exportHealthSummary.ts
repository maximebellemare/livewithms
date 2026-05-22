import { Share } from "react-native";

export type ExportSummarySection = {
  title: string;
  lines: string[];
};

export type ExportSummaryInput = {
  title: string;
  subtitle?: string | null;
  text: string;
  sections: ExportSummarySection[];
};

export type ExportSummaryResult =
  | { ok: true; uri?: string }
  | { ok: false; reason: "print-unavailable" | "share-unavailable" | "export-failed" };

type ExpoPrintModule = {
  printToFileAsync: (options: { html: string }) => Promise<{ uri: string }>;
};

type ExpoSharingModule = {
  isAvailableAsync: () => Promise<boolean>;
  shareAsync: (uri: string) => Promise<void>;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildExportHtml(input: ExportSummaryInput) {
  const sectionHtml = input.sections
    .map(
      (section) => `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          <ul>
            ${section.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(input.title)}</title>
        <style>
          body {
            margin: 0;
            padding: 32px 28px 40px;
            background: #fffaf5;
            color: #1f2937;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            line-height: 1.55;
          }
          .shell {
            max-width: 760px;
            margin: 0 auto;
          }
          .hero {
            background: #fff1e5;
            border-radius: 18px;
            padding: 24px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 28px;
            line-height: 1.2;
            margin: 0 0 8px;
          }
          .subtitle {
            margin: 0;
            color: #4b5563;
            font-size: 14px;
          }
          .section {
            background: #ffffff;
            border: 1px solid #f3dfcf;
            border-radius: 16px;
            padding: 18px 20px;
            margin-bottom: 14px;
          }
          h2 {
            font-size: 17px;
            margin: 0 0 10px;
          }
          ul {
            margin: 0;
            padding-left: 18px;
          }
          li {
            margin: 0 0 8px;
          }
          .footer {
            color: #6b7280;
            font-size: 12px;
            margin-top: 22px;
          }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="hero">
            <h1>${escapeHtml(input.title)}</h1>
            ${input.subtitle ? `<p class="subtitle">${escapeHtml(input.subtitle)}</p>` : ""}
          </div>
          ${sectionHtml}
          <p class="footer">
            This export is here to support reflection and conversations. It does not replace professional care.
          </p>
        </div>
      </body>
    </html>
  `;
}

async function loadExpoPrint(): Promise<ExpoPrintModule | null> {
  try {
    const module = await import("expo-print");
    return "printToFileAsync" in module ? (module as ExpoPrintModule) : null;
  } catch {
    return null;
  }
}

async function loadExpoSharing(): Promise<ExpoSharingModule | null> {
  try {
    const module = await import("expo-sharing");
    return "shareAsync" in module && "isAvailableAsync" in module ? (module as ExpoSharingModule) : null;
  } catch {
    return null;
  }
}

export async function exportHealthSummary(input: ExportSummaryInput): Promise<ExportSummaryResult> {
  const Print = await loadExpoPrint();

  if (!Print) {
    try {
      await Share.share({
        message: input.text,
      });
      return { ok: false, reason: "print-unavailable" };
    } catch {
      return { ok: false, reason: "export-failed" };
    }
  }

  try {
    const file = await Print.printToFileAsync({
      html: buildExportHtml(input),
    });
    const Sharing = await loadExpoSharing();

    if (Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(file.uri);
      return { ok: true, uri: file.uri };
    }

    return { ok: false, reason: "share-unavailable" };
  } catch {
    try {
      await Share.share({
        message: input.text,
      });
      return { ok: false, reason: "export-failed" };
    } catch {
      return { ok: false, reason: "export-failed" };
    }
  }
}
