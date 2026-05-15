export function preserveOrdinaryLifeFraming(text: string) {
  if (/\bthe rest of your day\b/i.test(text) || /\boffline\b/i.test(text) || /\boutside the app\b/i.test(text)) {
    return text;
  }

  return `${text} The rest of your day still matters too.`.replace(/\s{2,}/g, " ").trim();
}
