export function detectEmotionalOverload(text: string) {
  const sentenceCount = text.split(/[.!?]+/).filter((item) => item.trim().length > 0).length;
  const emotionalPhrases = (text.match(/\bvery hard\b|\bdeeply\b|\bintense\b|\bheavy\b|\boverwhelming\b/gi) ?? []).length;

  return text.length > 520 || sentenceCount > 6 || emotionalPhrases >= 3;
}
