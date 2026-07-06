export const colors = {
  page: "#fff6ef",
  pageDark: "#111827",
  pageWarm: "#fff9f2",
  surface: "#ffffff",
  surfaceDark: "#1f2937",
  surfaceWarm: "#fffaf7",
  surfaceRaised: "#fffdfb",
  surfaceAccent: "#fff1e5",
  border: "#ecd8c7",
  borderDark: "#374151",
  borderStrong: "#f3cfb3",
  borderSoft: "#f4e7db",
  text: "#1f2937",
  textDark: "#f9fafb",
  textBody: "#465161",
  textBodyDark: "#d1d5db",
  textMuted: "#6a7280",
  textMutedDark: "#9ca3af",
  textWarm: "#8b6a4f",
  accent: "#fe781a",
  accentDeep: "#dc5f0a",
  accentSoft: "#fff1e3",
  accentGlow: "rgba(254, 120, 26, 0.16)",
  successBg: "#eef8f0",
  successBorder: "#cde7d1",
  successText: "#166534",
  errorText: "#9f1239",
} as const;

export const radii = {
  card: 22,
  cardLarge: 26,
  button: 18,
  pill: 999,
} as const;

export const spacing = {
  screenX: 22,
  screenTop: 26,
  sectionGap: 20,
  cardPadding: 22,
  compactCardPadding: 18,
} as const;

export const shadows = {
  soft: {
    shadowColor: "rgba(120, 71, 29, 0.18)",
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  floating: {
    shadowColor: "rgba(120, 71, 29, 0.22)",
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;
