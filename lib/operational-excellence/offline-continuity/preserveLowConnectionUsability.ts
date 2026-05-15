export function preserveLowConnectionUsability(text: string) {
  return text
    .replace(/\brequires a strong connection\b/gi, "may work better when the connection returns")
    .replace(/\bcannot be used offline\b/gi, "can wait until the connection returns")
    .replace(/\bonline only\b/gi, "best with a steadier connection");
}
