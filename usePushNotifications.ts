import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Tila, joka sisältää push-ilmoituksen tiedot ja Expo Push Tokenin
export interface PushNotificationState {
  notification?: Notifications.Notification; // Push-ilmoituksen data
  expoPushToken?: Notifications.ExpoPushToken; // Laitteen Expo Push Token
}

// Mukautettu hook push-ilmoitusten hallintaan
export const usePushNotifications = (): PushNotificationState => {
  // Asetetaan ilmoitusten käsittelylogiikka
  Notifications.setNotificationHandler({
    // Määritä, miten ilmoitukset näkyvät, kun ne vastaanotetaan sovelluksessa
    handleNotification: async () => ({
      shouldShowAlert: true, // Näytetään ilmoitus visuaalisesti
      shouldPlaySound: false, // Ääntä ei toisteta
      shouldSetBadge: false, // Sovelluksen badgea ei päivitetä
    }),
  });

  // Tilat push-tokenille ja ilmoituksille:

  // Laitteen yksilöllinen tunniste push-ilmoituksia varten
  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>(); 

  // Viimeisin vastaanotettu ilmoitus
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(); 

  // Viitteet ilmoitus- ja vastauskuuntelijoille
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  // Funktio push-ilmoitusten rekisteröintiin
  async function registerForPushNotificationsAsync() {
    let token;

    if (Device.isDevice) {
      // Tarkistetaan, onko push-ilmoituslupia jo annettu
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      // Jos lupaa ei ole annettu, pyydetään käyttäjältä lupaa
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Jos lupaa ei vieläkään ole, näytetään varoitus ja lopetetaan
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }

      // Haetaan Expo Push Token
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId, // Expo-projektin tunniste
      });

      // Androidilla määritetään ilmoituskanava
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default', // Kanavan nimi
          importance: Notifications.AndroidImportance.MAX, // Suurin prioriteetti
          vibrationPattern: [0, 250, 250, 250], // Värinäkuvio
          lightColor: '#FF231F7C', // LED-valon väri
        });
      }

      return token;
    } else {
      console.log('Must use physical device for Push Notifications'); // Kehote, jos käytetään emulaattoria
    }
  }

  // Hookin sivuvaikutukset
  useEffect(() => {
    // Rekisteröidään laite push-ilmoituksia varten
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token); // Tallennetaan token tilaan
      console.log('Expo Push Token:', token); // Tulostetaan token konsoliin
    });

    // Kuunnellaan vastaanotettuja ilmoituksia
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', JSON.stringify(notification, null, 2)); // Tulostetaan ilmoitus konsoliin
        setNotification(notification); // Tallennetaan viimeisin ilmoitus tilaan
      });

    // Kuunnellaan ilmoituksiin vastaamisia (esim. käyttäjä avaa ilmoituksen)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response:', JSON.stringify(response, null, 2)); // Tulostetaan vastaus konsoliin
      });

    // Palautetaan cleanup-funktio kuuntelijoiden poistamiseen
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!); // Poistetaan ilmoituskuuntelija
      Notifications.removeNotificationSubscription(responseListener.current!); // Poistetaan vastauskuuntelija
    };
  }, []);

  // Palautetaan hookin tila
  return {
    expoPushToken, // Laitteen push-token
    notification, // Viimeisin vastaanotettu ilmoitus
  };
};
