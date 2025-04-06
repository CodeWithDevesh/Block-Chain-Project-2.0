import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location"; // Import expo-location
import { useState, useEffect } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View,
  Alert,
  AppState,
  Dimensions,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanningEnabled, setIsScanningEnabled] = useState(true); // Add state to control scanning
  const [privateKey, setPrivateKey] = useState(""); // Add state for private key
  const router = useRouter();

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          setScannedData(null);
        }
      }
    );

    return () => {
      appStateListener.remove();
    };
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera permission</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validateScannedData = (data) => {
    try {
      const parsedData = JSON.parse(data);
      return (
        typeof parsedData.senderId === "string" &&
        typeof parsedData.recipientId === "string" &&
        typeof parsedData.aidType === "string"
      );
    } catch (error) {
      return false;
    }
  };

  const handleBarcodeScanned = ({ data }) => {
    if (!isScanningEnabled || data === scannedData) return; // Disable scanning if not enabled or duplicate scan

    if (validateScannedData(data)) {
      setScannedData(data);
    } else {
      setIsScanningEnabled(false); // Disable scanning while alert is shown
      Alert.alert(
        "Invalid QR Code",
        "The scanned QR code is not in the correct format.",
        [
          {
            text: "OK",
            onPress: () => setIsScanningEnabled(true), // Resume scanning when user clicks "OK"
          },
        ]
      );
    }
  };

  const uploadData = async () => {
    if (!scannedData || !privateKey) return;
    setIsUploading(true);
    try {
      let location = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({});
        location = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
      } else {
        console.warn("Location permission not granted");
        throw new Error("Location permission not granted");
      }

      await fetch("http://localhost:3000/api/storeData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privateKey,
          senderID: JSON.parse(scannedData).senderId,
          recipientID: JSON.parse(scannedData).recipientId,
          aidType: JSON.parse(scannedData).aidType,
          location: location,
        }),
      })
        .then((response) => response.json())
        .then(async (data) => {
          if (!data.ok) {
            throw new Error(data.message);
          }
          Alert.alert("Success", "Entry added successfully!", [
            { text: "OK", onPress: () => router.back() },
          ]);
        });
    } catch (error) {
      console.log("Error uploading data:", error);
      Alert.alert("Error", "Failed to add Entry!");
    } finally {
      setIsUploading(false);
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      // TODO: Add logic to decode QR code from the selected image
      Alert.alert(
        "Feature not implemented",
        "Decoding QR from gallery is not yet implemented."
      );
    }
  };

  return (
    <View style={styles.container}>
      {!scannedData ? (
        <>
          <View style={styles.overlay}>
            <View style={styles.scannerFrame}>
              <CameraView
                style={styles.camera}
                onBarcodeScanned={handleBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              />
            </View>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImageFromGallery}
            >
              <Text style={styles.galleryButtonText}>Upload From Gallery</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Scanned QR Code Details:</Text>
          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Sender ID:</Text>
            <Text style={styles.dataValue}>
              {JSON.parse(scannedData).senderId}
            </Text>
            <Text style={styles.dataLabel}>Recipient ID:</Text>
            <Text style={styles.dataValue}>
              {JSON.parse(scannedData).recipientId}
            </Text>
            <Text style={styles.dataLabel}>Aid Type:</Text>
            <Text style={styles.dataValue}>
              {JSON.parse(scannedData).aidType}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter Private Key"
            placeholderTextColor="#A9A9B8"
            secureTextEntry={true}
            value={privateKey}
            onChangeText={setPrivateKey}
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={uploadData}
            disabled={isUploading || !privateKey}
          >
            <Text style={styles.actionButtonText}>
              {isUploading ? "Uploading..." : "Save Entry"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setScannedData(null)}
          >
            <Text style={styles.actionButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E", // Dark purple background
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#6A0572", // Purple button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  scannerFrame: {
    width: Dimensions.get("window").width * 0.8,
    height: Dimensions.get("window").width * 0.8,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  galleryButton: {
    backgroundColor: "#6A0572", // Purple button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
  },
  galleryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resultContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  resultText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  scannedData: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: "#6A0572", // Purple button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  dataCard: {
    backgroundColor: "#2E2E3A",
    padding: 15,
    borderRadius: 10,
    width: Dimensions.get("window").width * 0.8,
  },
  dataLabel: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  dataValue: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#2E2E3A",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
    width: Dimensions.get("window").width * 0.8,
    marginBottom: 20,
  },
});
