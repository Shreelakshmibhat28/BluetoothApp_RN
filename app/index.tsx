import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import BluetoothChat from './screens/ChatScreen';
import { RootStackParamList } from './navigationTypes';
import BluetoothManager from '@/components/BluetoothManager';
import { StatusBar } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function MainApp() {
  return (

    <>
    <StatusBar 
      backgroundColor="#2ecc71"
      barStyle="light-content"
      />
    
      <Stack.Navigator initialRouteName="Bluetooth" 
      screenOptions={{ 
        headerShown: true,
        headerStyle:{
          backgroundColor: '#2ecc71',
        } ,

        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize:20,
        },

      }}>
        <Stack.Screen name="Bluetooth" component={BluetoothManager} />
        <Stack.Screen name="BluetoothChat" component={BluetoothChat} />
      </Stack.Navigator>
      </>
    
  );
}
