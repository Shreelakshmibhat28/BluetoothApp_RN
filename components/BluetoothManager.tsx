import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Platform, Alert, PermissionsAndroid } from 'react-native';
import BluetoothClassic from 'react-native-bluetooth-classic';

interface BluetoothDevice {
  id: string;
  name: string;
}

export default function BluetoothManager() {
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
        return;
      }

      const isBluetoothEnabledAgain = await BluetoothClassic.isBluetoothEnabled();
      if (!isBluetoothEnabledAgain) {
        Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth manually in your device settings.');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      Alert.alert('Error', 'Failed to initialize Bluetooth');
    }
  };
console.log('Platform.Version', Platform.Version)
  const startScan = async () => {
    try {
      console.log(await BluetoothClassic.isBluetoothAvailable())
      setIsScanning(true);
      setDevices([]);
      // setTimeout(async () => {
      //   await stopScan();
      // }, 10000);

      console.log('Scanning for devices...');
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
      await BluetoothClassic.startDiscovery().then(console.log)

    

   

      return () => {
        subscription.remove();
      };
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

  const connectToDevice = async (deviceId: string) => {
    try {
      const device = await BluetoothClassic.connectToDevice(deviceId);
      Alert.alert('Success', `Connected to ${device.name || 'device'} successfully`);
    } catch (error) {
      console.error('Error connecting:', error);
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Devices</Text>
      <Button
        title={isScanning ? 'Scanning...' : 'Scan for Devices'}
        onPress={startScan}
        disabled={isScanning}
      />
      <ScrollView>
        {devices.length > 0 ? (
          devices.map((item) => (
            <View key={item.id} style={styles.deviceItem}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Button
                title="Connect"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceName: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});