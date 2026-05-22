export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildHtmlDocument(title: string, sections: Array<{ heading: string; body: string }>): string {
  const sectionHtml = sections
    .map(
      (section) => `
        <section class="section">
          <h2>${escapeHtml(section.heading)}</h2>
          <div class="body">${section.body}</div>
        </section>
      `,
    )
    .join("");

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          margin: 0;
          padding: 32px 24px 40px;
          background: #fcf9f6;
          color: #1f2937;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.55;
        }
        .shell {
          max-width: 860px;
          margin: 0 auto;
        }
        .hero {
          background: #fff3e6;
          border: 1px solid #f2dcc6;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 18px;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 28px;
          line-height: 1.2;
        }
        .meta {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .section {
          background: #ffffff;
          border: 1px solid #f2e7dc;
          border-radius: 16px;
          padding: 18px 20px;
          margin-bottom: 14px;
        }
        h2 {
          margin: 0 0 10px;
          font-size: 18px;
          line-height: 1.3;
        }
        p, li {
          margin: 0 0 8px;
        }
        ul {
          margin: 0;
          padding-left: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 14px;
        }
        th, td {
          text-align: left;
          vertical-align: top;
          padding: 10px 8px;
          border-bottom: 1px solid #efe4d8;
        }
        th {
          color: #7c2d12;
          font-weight: 700;
          background: #fff8f1;
        }
        .footer {
          margin-top: 20px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="shell">
        <header class="hero">
          <h1>${escapeHtml(title)}</h1>
          <p class="meta">Generated ${escapeHtml(new Date().toLocaleDateString())} · For informational use only.</p>
        </header>
        ${sectionHtml}
        <p class="footer">This export is designed to support reflection and care conversations. It does not replace professional care.</p>
      </div>
    </body>
  </html>`;
}

export function htmlBlob(html: string): Blob {
  return new Blob([html], { type: "text/html;charset=utf-8" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
