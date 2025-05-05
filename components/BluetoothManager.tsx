import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import BluetoothClassic from 'react-native-bluetooth-classic';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigationTypes';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Bluetooth'>;

interface BluetoothDevice {
  id: string;
  name: string;
  bonded: boolean;
}

export default function BluetoothManager() {
  const navigation = useNavigation<NavigationProp>();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  useEffect(() => {
    checkPermissions();
    loadPairedDevices();

    return () => {
      stopScan();
    };
  }, []);

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ]);

        if (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert('Permission Denied', 'Bluetooth permissions are required.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const checkPermissions = async () => {
    try {
      await requestBluetoothPermissions();
      const isBluetoothEnabled = await BluetoothClassic.isBluetoothEnabled();
      if (!isBluetoothEnabled) {
        Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to continue');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadPairedDevices = async () => {
    try {
      const bonded = await BluetoothClassic.getBondedDevices();
      setDevices(bonded.map((d) => ({
        id: d.address,
        name: d.name,
        bonded: true,
      })));
    } catch (error) {
      console.error('Error loading bonded devices:', error);
    }
  };

  const startScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]); // clear old results

      const subscription = BluetoothClassic.onDeviceDiscovered((event: any) => {
        const newDevice = {
          id: event.address,
          name: event.name || 'Unknown Device',
          bonded: event.bonded || false,
        };

        setDevices((prev) => {
          if (!prev.some((d) => d.id === newDevice.id)) {
            return [...prev, newDevice];
          }
          return prev;
        });
      });

      await BluetoothClassic.startDiscovery();
    } catch (error) {
      console.error('Error scanning:', error);
      Alert.alert('Error', 'Failed to scan for devices');
    } finally {
      setTimeout(() => {
        stopScan();
      }, 15000); // stop scan after 15s
    }
  };

  const stopScan = async () => {
    try {
      await BluetoothClassic.cancelDiscovery();
    } catch (error) {
      console.error('Error stopping scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const pairDevice = async (deviceId: string) => {
    try {
      const paired = await BluetoothClassic.pairDevice(deviceId);
      if (paired) {
        Alert.alert('Success', 'Device paired successfully');
        loadPairedDevices(); // refresh paired list
      } else {
        Alert.alert('Failed', 'Pairing failed or rejected.');
      }
    } catch (error) {
      console.error('Pairing error:', error);
      Alert.alert('Error', 'Could not pair with device');
    }
  };

  const unpairDevice = async (deviceId: string) => {
    try {
      const unpaired = await BluetoothClassic.unpairDevice(deviceId);
      if (unpaired) {
        Alert.alert('Unpaired', 'Device unpaired successfully');
        loadPairedDevices();
      } else {
        Alert.alert('Failed', 'Unpairing failed');
      }
    } catch (error) {
      console.error('Unpairing error:', error);
    }
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      const device = await BluetoothClassic.connectToDevice(deviceId, { delimiter: '\n' });
      ;
      Alert.alert('Success', `Connected to ${device.name || 'device'} successfully`);
      navigation.navigate('BluetoothChat', { device, deviceId });
    } catch (error) {
      console.error('Error connecting:', error);
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.listTitle}>Bluetooth Devices</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {devices.length > 0 ? (
          devices.map((item) => (
            <View key={item.id} style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceMac}>{item.id}</Text>
              </View>
              {!item.bonded ? (
                <TouchableOpacity
                  style={styles.pairButton}
                  onPress={() => pairDevice(item.id)}
                >
                  <Text style={styles.pairButtonText}>Pair</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.pairButton}
                  onPress={() => unpairDevice(item.id)}
                >
                  <Text style={styles.pairButtonText}>Unpair</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => connectToDevice(item.id)}
              />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {isScanning ? 'Scanning...' : 'No devices found'}
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={startScan}
        disabled={isScanning}
      >
        <Text style={styles.searchButtonText}>
          {isScanning ? 'Scanning...' : 'Search Devices'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
    color: '#4CAF50',
  },
  scrollContainer: { paddingHorizontal: 12, paddingBottom: 80 },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6ffe6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: 'bold' },
  deviceMac: { fontSize: 12, color: '#666', marginTop: 4 },
  pairButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  pairButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 14,
  },
  searchButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
