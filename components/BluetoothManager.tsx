import React, { useState, useEffect } from 'react';
import { View, Text,TouchableOpacity, Button, ScrollView, StyleSheet, Platform, Alert, PermissionsAndroid } from 'react-native';
import BluetoothClassic from 'react-native-bluetooth-classic';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigationTypes';
import { Card } from 'react-native-paper';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Bluetooth'>;

interface BluetoothDevice {
  id: string;
  name: string;
}

export default function BluetoothManager() {
  const navigation = useNavigation<NavigationProp>();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  useEffect(() => {
    checkPermissions();
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
          Alert.alert('Permission Denied', 'Bluetooth permissions are required to scan for devices.');
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
      Alert.alert('Error', 'Failed to initialize Bluetooth');
    }
  };

  const startScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]);

      const subscription = BluetoothClassic.onDeviceDiscovered((event: any) => {
        setDevices((prevDevices) => {
          const newDevice = {
            id: event.id || event.address,
            name: event.name || 'Unknown Device',
          };

          if (!prevDevices.some((d) => d.id === newDevice.id)) {
            return [...prevDevices, newDevice];
          }
          return prevDevices;
        });
      });

      await BluetoothClassic.startDiscovery();
    } catch (error) {
      console.error('Error scanning:', error);
      Alert.alert('Error', 'Failed to scan for devices');
      setIsScanning(false);
    }
  };

  const stopScan = async () => {
    try {
      await BluetoothClassic.cancelDiscovery();
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  const pairDevice = async (deviceId: string) => {
    try {
      const paired = await BluetoothClassic.pairDevice(deviceId);
      if (paired) {
        Alert.alert('Success', `Paired with device ${deviceId} successfully`);
      } else {
        Alert.alert('Failed', `Pairing failed with device ${deviceId}`);
      }
    } catch (error) {
      console.error('Error pairing:', error);
      Alert.alert('Error', 'Failed to pair with device');
    }
  };
  

  const connectToDevice = async (deviceId: string) => {
    try {
      const device = await BluetoothClassic.connectToDevice(deviceId);
      Alert.alert('Success', `Connected to ${device.name || 'device'} successfully`);
      navigation.navigate('BluetoothChat', { device });
    } catch (error) {
      console.error('Error connecting:', error);
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  return (
    <View style={styles.container}>
      
  
      <Text style={styles.listTitle}>List of Devices</Text>
  
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {devices.length > 0 ? (
          devices.map((item) => (
            <View key={item.id} style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceMac}>{item.id}</Text>
              </View>
              <TouchableOpacity
                style={styles.pairButton}
                onPress={() => pairDevice(item.id)}
              >
                <Text style={styles.pairButtonText}>Pair</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => connectToDevice(item.id)}
              />
            </View>
          ))
          
        ) : (
          <Text style={styles.emptyText}>
            {isScanning ? 'Searching for devices...' : 'No devices found'}
          </Text>
        )}
      </ScrollView>
  
      {/* Bottom Search Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={startScan}
        disabled={isScanning}
      >
        <Text style={styles.searchButtonText}>
          {isScanning ? 'Scanning...' : 'Bluetooth Search'}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
 
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
    color: '#4CAF50',
  },
  scrollContainer: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6ffe6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceMac: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pairButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  pairButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
