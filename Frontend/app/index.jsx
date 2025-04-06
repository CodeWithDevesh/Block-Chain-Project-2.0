import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const router = useRouter();

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("qrHistory");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  // Reload history every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <Text style={styles.message}>No history available</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.text}>Data: {item.data}</Text>
              <Text style={styles.timestamp}>Scanned on: {item.timestamp}</Text>
              {item.location && (
                <Text style={styles.location}>
                  Location: {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                </Text>
              )}
            </View>
          )}
        />
      )}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/QRScanner")}
      >
        <Text style={styles.createButtonText}>Create Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#1A1A1A" }, // Dark background
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 10 }, // White title
  message: { fontSize: 16, color: "gray" },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#4B0082", // Purple border
    width: "100%",
    marginBottom: 10,
  },
  text: { fontSize: 16, color: "#fff" }, // White text
  timestamp: { fontSize: 14, color: "gray", marginTop: 5 },
  location: {
    fontSize: 14,
    color: "#6A0572", // Purple text for location
    marginTop: 5,
    fontStyle: "italic",
  },
  createButton: {
    marginTop: 20,
    backgroundColor: "#4B0082", // Purple button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  createButtonText: { fontSize: 16, color: "#fff", fontWeight: "bold" }, // White button text
});
