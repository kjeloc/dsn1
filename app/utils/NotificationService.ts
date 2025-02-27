    // utils/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      alert('No podrás recibir notificaciones si no otorgas permisos.');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error al solicitar permisos de notificaciones:', error);
    return false;
  }
};

export const scheduleLocalNotification = async (
  title: string,
  body: string,
  trigger?: Date | null
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null, // Si no se proporciona un trigger, se muestra inmediatamente
    });
    console.log('Notificación programada con éxito');
  } catch (error) {
    console.error('Error al programar la notificación:', error);
  }
};