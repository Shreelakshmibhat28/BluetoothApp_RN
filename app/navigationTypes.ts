import type BluetoothClassic from 'react-native-bluetooth-classic';

export type RootStackParamList = {
  Bluetooth: undefined;
  //BluetoothChat: { device: typeof BluetoothClassic['connectToDevice'] extends (...args: any) => Promise<infer R> ? R : never };
  BluetoothChat:{
    device: typeof BluetoothClassic['connectToDevice'] extends (...args: any) => Promise<infer R> ? R : never;
    deviceId: string;
    //deviceName: string;
  }
};

export default {};