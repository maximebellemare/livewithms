import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCalmEnvironment, useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
import AppText from "./AppText";
import { colors, spacing } from "./design";

type AppScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}>;

export default function AppScreen({ children, eyebrow, title, subtitle }: AppScreenProps) {
  const appearance = useCalmEnvironment().appearance;
  const calmEnvironment = useDerivedCalmEnvironment();
  const spacious = calmEnvironment.density.mode === "spacious";
  const simplified = calmEnvironment.lowEnergyPresentation.simplifySecondaryContent || calmEnvironment.density.mode === "simplified";
  const calmerEvening = calmEnvironment.sensory.nightCalm && new Date().getHours() >= 18;
  const darkMode = appearance === "dark";

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        calmerEvening && styles.safeAreaNight,
        darkMode && styles.safeAreaDark,
      ]}
      edges={["top", "bottom"]}
    >
      <View pointerEvents="none" style={styles.backgroundDecor}>
        <View style={[styles.backgroundOrb, styles.backgroundOrbPrimary, darkMode && styles.backgroundOrbPrimaryDark]} />
        <View style={[styles.backgroundOrb, styles.backgroundOrbSecondary, darkMode && styles.backgroundOrbSecondaryDark]} />
      </View>
      <View style={[styles.container, spacious && styles.containerSpacious]}>
        {eyebrow || title || subtitle ? (
          <View style={[styles.header, spacious && styles.headerSpacious]}>
            {eyebrow ? <AppText style={[styles.eyebrow, darkMode && styles.eyebrowDark]}>{eyebrow}</AppText> : null}
            {title ? <AppText style={[styles.title, spacious && styles.titleSpacious, darkMode && styles.titleDark]}>{title}</AppText> : null}
            {subtitle ? <AppText style={[styles.subtitle, simplified && styles.subtitleSimplified, darkMode && styles.subtitleDark]}>{subtitle}</AppText> : null}
          </View>
        ) : null}
        <View style={[styles.content, simplified && styles.contentSimplified, spacious && styles.contentSpacious]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  safeAreaNight: {
    backgroundColor: colors.pageWarm,
  },
  safeAreaDark: {
    backgroundColor: colors.pageDark,
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  backgroundOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  backgroundOrbPrimary: {
    top: -110,
    right: -88,
    width: 320,
    height: 320,
    backgroundColor: colors.accentGlow,
  },
  backgroundOrbSecondary: {
    top: 92,
    left: -92,
    width: 220,
    height: 220,
    backgroundColor: "rgba(255, 213, 175, 0.38)",
  },
  backgroundOrbPrimaryDark: {
    backgroundColor: "rgba(254, 120, 26, 0.14)",
  },
  backgroundOrbSecondaryDark: {
    backgroundColor: "rgba(255, 207, 168, 0.08)",
  },
  container: {
    flex: 1,
    paddingTop: spacing.screenTop,
  },
  containerSpacious: {
    paddingTop: spacing.screenTop + 4,
  },
  header: {
    paddingHorizontal: spacing.screenX,
    gap: 12,
    paddingBottom: 10,
  },
  headerSpacious: {
    gap: 12,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.accentDeep,
  },
  eyebrowDark: {
    color: colors.textMutedDark,
  },
  title: {
    fontSize: 36,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.text,
  },
  titleDark: {
    color: colors.textDark,
  },
  titleSpacious: {
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
    maxWidth: 620,
  },
  subtitleDark: {
    color: colors.textMutedDark,
  },
  subtitleSimplified: {
    lineHeight: 23,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  contentSimplified: {
    paddingTop: 16,
  },
  contentSpacious: {
    paddingTop: 24,
  },
});
