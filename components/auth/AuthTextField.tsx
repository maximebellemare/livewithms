import { StyleSheet, TextInput, View } from "react-native";
import AppText from "../ui/AppText";
import { colors, radii, shadows } from "../ui/design";

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
};

export default function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType = "default",
}: AuthTextFieldProps) {
  return (
    <View style={styles.container}>
      <AppText style={styles.label}>{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        allowFontScaling
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 58,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    ...shadows.soft,
  },
});
