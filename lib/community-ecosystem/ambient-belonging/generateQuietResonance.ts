export function generateQuietResonance(themes: string[]) {
  if (themes.length === 0) {
    return null;
  }

  const [theme] = themes;

  return {
    title: "A quiet sense of company",
    body: `Others have also been reflecting on ${theme} lately.`,
  };
}
