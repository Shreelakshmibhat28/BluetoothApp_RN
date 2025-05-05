import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, Button, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import {  useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/app/navigationTypes';
import { RouteProp } from '@react-navigation/native';
import type BluetoothClassic from 'react-native-bluetooth-classic';

type BluetoothChatRouteProp = RouteProp<RootStackParamList, 'BluetoothChat'>;


export default function BluetoothChat() {
  const route = useRoute<BluetoothChatRouteProp>();
  const { device } = route.params;

  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  
  

  useEffect(() => {
    const listen = device.onDataReceived((event: any) => {
      setMessages((prev) => [...prev, `📥 ${event.data}`]);
    });

    return () => {
      listen.remove();
    };
  }, [device]);

  const sendMessage = async () => {
    if (input.trim().length === 0) return;

    try {
      await device.write(input + '\r\n');
      setMessages((prev) => [...prev, `📤 ${input}`]);
      setInput('');
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>Chat with {device.name || 'Device'}</Text>
      <ScrollView ref={scrollRef} style={styles.messages}>
        {messages.map((msg, index) => (
          <Text key={index} style={styles.messageText}>{msg}</Text>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
      <TextInput
  style={styles.input}
  value={input}
  onChangeText={setInput}
  placeholder="Type a message"
/>

        <Button title="Send" onPress={sendMessage} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
     flex: 1, 
     padding: 16, 
     backgroundColor: '#fff' 
    },

  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },

  messages: { 
    flex: 1, 
    marginBottom: 12 
  },

  messageText: { 
    fontSize: 16, 
    marginBottom: 6 
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
});
