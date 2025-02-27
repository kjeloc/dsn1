import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Waiting = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>Tu usuario está suspendido. Por favor, ponte en contacto con los administradores: breakcotime@gmail.com</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  message: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default Waiting;