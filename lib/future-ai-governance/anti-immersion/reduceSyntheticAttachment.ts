export function reduceSyntheticAttachment(text: string) {
  return text
    .replace(/\bi care about you deeply\b/gi, "I want to respond carefully")
    .replace(/\bi know exactly what you need\b/gi, "I may not have the full picture")
    .replace(/\bi know you deeply\b/gi, "I may not have the full picture")
    .replace(/\b(?:we'?ve|we have) built something special\b/gi, "this can remain a simple support space")
    .replace(/\bcome back to me anytime\b/gi, "you can step away whenever you need");
}
