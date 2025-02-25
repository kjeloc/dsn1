// constants/GlobalStyles.ts
import { StyleSheet } from "react-native";
import { useAppTheme } from "./Colors";

export const GlobalStyles = () => {
    const colors = useAppTheme();
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 20,
        },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 16,
        },
        subtitle: {
            fontSize: 18,
            color: colors.text,
            marginBottom: 8,
        },
        card: {
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 10,
        },
        button: {
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
        },
        buttonText: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "bold",
        },
    });
};