import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
import AppText from "./AppText";
import { colors, spacing } from "./design";

type AppScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}>;

export default function AppScreen({ children, eyebrow, title, subtitle }: AppScreenProps) {
  const calmEnvironment = useDerivedCalmEnvironment();
  const spacious = calmEnvironment.density.mode === "spacious";
  const simplified = calmEnvironment.lowEnergyPresentation.simplifySecondaryContent || calmEnvironment.density.mode === "simplified";
  const calmerEvening = calmEnvironment.sensory.nightCalm && new Date().getHours() >= 18;

  return (
    <SafeAreaView style={[styles.safeArea, calmerEvening && styles.safeAreaNight]} edges={["top", "bottom"]}>
      <View style={[styles.container, spacious && styles.containerSpacious]}>
        {eyebrow || title || subtitle ? (
          <View style={[styles.header, spacious && styles.headerSpacious]}>
            {eyebrow ? <AppText style={styles.eyebrow}>{eyebrow}</AppText> : null}
            {title ? <AppText style={[styles.title, spacious && styles.titleSpacious]}>{title}</AppText> : null}
            {subtitle ? <AppText style={[styles.subtitle, simplified && styles.subtitleSimplified]}>{subtitle}</AppText> : null}
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
  container: {
    flex: 1,
    paddingTop: spacing.screenTop,
  },
  containerSpacious: {
    paddingTop: spacing.screenTop + 4,
  },
  header: {
    paddingHorizontal: spacing.screenX,
    gap: 10,
  },
  headerSpacious: {
    gap: 12,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  title: {
    fontSize: 36,
    lineHeight: 46,
    fontWeight: "700",
    color: colors.text,
  },
  titleSpacious: {
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
  },
  subtitleSimplified: {
    lineHeight: 23,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  contentSimplified: {
    paddingTop: 16,
  },
  contentSpacious: {
    paddingTop: 24,
  },
});
