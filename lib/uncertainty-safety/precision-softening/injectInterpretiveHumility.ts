export function injectInterpretiveHumility(text: string) {
  if (/\bmay\b|\bmight\b|\bseems\b|\bappears\b/i.test(text)) {
    return text;
  }

  return `It may help to read this lightly: ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

