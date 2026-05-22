export function generateQuietResonance(themes: string[]) {
  if (themes.length === 0) {
    return null;
  }

  const [theme] = themes;

  return {
    title: "Shared theme",
    body: `${theme} may be worth noticing here.`,
  };
}
