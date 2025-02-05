import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RegisterAppointment from './RegisterAppointment';
import QrScanner from './Camera';
import axios from 'axios';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Maps from './Maps';
import DentalTips from './DentalTips';

const Stack = createStackNavigator();
const API_KEY = 'afd33f262a5c4463dd543b6978ad0711'; 

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="RegisterAppointment" component={RegisterAppointment} />
        <Stack.Screen name="QrScanner" component={QrScanner} />
        <Stack.Screen name="Maps" component={Maps} />
        <Stack.Screen name="DentalTips" component={DentalTips} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  RegisterAppointment: undefined;
  QrScanner: undefined;
  Maps: undefined;
  DentalTips: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: { navigation: HomeScreenNavigationProp }) {
  const [city, setCity] = useState('');
  type WeatherData = {
    name: string;
    main: {
      temp: number;
    };
    weather: {
      description: string;
    }[];
  };
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      fetchCityFromCoordinates(latitude, longitude);
    })();
  }, []);

  const fetchCityFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: API_KEY,
          units: 'metric',
        },
      });
      const data = response.data as { name: string; main: { temp: number }; weather: { description: string }[] };
      setCity(data.name);
      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.weatherSection}>
        <Text style={styles.title}>Predicción del Clima</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : weather ? (
          <View style={styles.weatherInfo}>
            <Text style={styles.city}>{weather.name}</Text>
            <Icon name="weather-cloudy" size={40} color="#555" />
            <Text style={styles.temp}>{Math.round(weather.main.temp)}°C</Text>
            <Text style={styles.desc}>{weather.weather[0].description}</Text>
          </View>
        ) : (
          <Text style={styles.error}>No hay datos disponibles</Text>
        )}
      </View>

      <View style={styles.navigationSection}>
        <Button
          title="Generar Cita"
          onPress={() => navigation.navigate('RegisterAppointment')}
        />
        <Button
          title="Escanear QR"
          onPress={() => navigation.navigate('QrScanner')}
        />
        <Button
          title="Ver Mapa"
          onPress={() => navigation.navigate('Maps')}
          />
           <Button
          title="Ver Consejos Odontológicos"
          onPress={() => navigation.navigate('DentalTips')}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  weatherSection: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  weatherInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  city: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  temp: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  desc: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  error: {
    color: 'red',
  },
  navigationSection: {
    marginTop: 20,
  },
});