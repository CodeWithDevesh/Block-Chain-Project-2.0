import React from "react";
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#4B0082", // Purple background
        },
        headerTintColor: "#fff", // White text for header
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitleVisible: false, // Hides the back button text
        headerShadowVisible: false, // Removes shadow for a cleaner look
        contentStyle: {
          backgroundColor: "#121212", // Dark theme background for screens
        },
      }}
    >
      {/* Define your screens here */}
      <Stack.Screen name="index" options={{ title: "Your Entries" }} />
      <Stack.Screen name="QRScanner" options={{ title: "QR Scanner" }} />
    </Stack>
  );
}
