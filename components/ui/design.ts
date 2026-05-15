export const colors = {
  page: "#fff7f2",
  pageWarm: "#fffaf6",
  surface: "#ffffff",
  surfaceWarm: "#fffaf6",
  surfaceAccent: "#fff4ec",
  border: "#f1e1d4",
  borderStrong: "#f2d8c4",
  borderSoft: "#ead9cb",
  text: "#1f2937",
  textBody: "#4b5563",
  textMuted: "#6b7280",
  textWarm: "#8b6a4f",
  accent: "#e8751a",
  accentSoft: "#fff0e2",
  successBg: "#eef8f0",
  successBorder: "#cde7d1",
  successText: "#166534",
  errorText: "#9f1239",
} as const;

export const radii = {
  card: 20,
  cardLarge: 22,
  button: 16,
  pill: 999,
} as const;

export const spacing = {
  screenX: 20,
  screenTop: 24,
  sectionGap: 16,
  cardPadding: 18,
  compactCardPadding: 16,
} as const;

export const shadows = {
  soft: {
    shadowColor: "#c47d43",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
} as const;
