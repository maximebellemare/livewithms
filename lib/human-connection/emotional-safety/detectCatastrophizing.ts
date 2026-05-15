export function detectCatastrophizing(text: string) {
  return /\bnever gets better\b|\beverything is ruined\b|\bno point\b|\balways getting worse\b/i.test(text);
}

