// components/SkeletonLoader.tsx
import React from "react";
import { View, StyleSheet } from "react-native";

interface SkeletonLoaderProps {
  width: number;
  height: number;
  borderRadius?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ width, height, borderRadius = 8 }) => {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E0E0E0", // Color claro para el modo claro
    overflow: "hidden",
  },
});

export default SkeletonLoader;