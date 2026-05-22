import { StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";
import { colors, radii } from "../ui/design";

export type GuidanceSectionTone = "default" | "soft";

type GuidanceSectionProps = {
  title: string;
  body: string;
  icon?: string;
  tone?: GuidanceSectionTone;
};

export default function GuidanceSection({
  title,
  body,
  icon,
  tone = "default",
}: GuidanceSectionProps) {
  return (
    <View style={[styles.card, tone === "soft" && styles.cardSoft]}>
      <View style={styles.header}>
        {icon ? (
          <View style={styles.iconBadge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <AppText style={styles.icon}>{icon}</AppText>
          </View>
        ) : null}
        <AppText style={styles.title}>{title}</AppText>
      </View>
      <AppText style={styles.body}>{body}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 8,
  },
  cardSoft: {
    backgroundColor: colors.surfaceWarm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  icon: {
    fontSize: 13,
    lineHeight: 16,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  body: {
    color: colors.textBody,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 680,
  },
});
