
# Push-ilmoitusten käyttöönotto Expon avulla

Tässä ohjeessa käydään läpi, miten voit ottaa käyttöön ja testata push-ilmoituksia Expo-sovelluksessa käyttäen Firebase-konfiguraatiota ja Expon palvelua.

---

## **1. Luo uusi Expo-projekti**
Luo uusi Expo-projekti TypeScriptillä:
```bash
npx create-expo-app pushNotifications --template blank-typescript
```

---

## **2. Asenna tarvittavat kirjastot**
Asenna push-ilmoituksia varten tarvittavat Expon kirjastot:
```bash
npx expo install expo-notifications expo-device expo-constants
```

---

## **3. Kirjaudu sisään EAS-palveluun**
Luo Expo-tunnus, jos sinulla ei vielä ole sellaista, ja kirjaudu sisään:
```bash
eas login
```

---

## **4. Lisää `usePushNotifications`-hook**
Luo projektin juureen tiedosto nimeltä `usePushNotifications.ts` ja lisää seuraava koodi:

```typescript
import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface PushNotificationState {
  notification?: Notifications.Notification;
  expoPushToken?: Notifications.ExpoPushToken;
}

export const usePushNotifications = (): PushNotificationState => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  async function registerForPushNotificationsAsync() {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!);
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
```

---

## **5. Päivitä `App.tsx`**
Korvaa `App.tsx` seuraavalla koodilla:

```tsx
import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { usePushNotifications } from './usePushNotifications';

export default function App() {
  const { expoPushToken, notification } = usePushNotifications();

  const title =
    notification?.request.content.title ||
    (notification?.request.trigger as any)?.remoteMessage?.data?.title ||
    'Ei otsikkoa';
  const body =
    notification?.request.content.body ||
    (notification?.request.trigger as any)?.remoteMessage?.data?.message ||
    'Ei viestiä';
  const data = JSON.stringify(notification, null, 2);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Expo Push Token:</Text>
        <Text style={styles.commonText}>{expoPushToken?.data ?? 'Ei saatavilla'}</Text>

        <Text style={styles.sectionTitle}>Ilmoituksen Otsikko:</Text>
        <Text style={styles.commonText}>{title}</Text>

        <Text style={styles.sectionTitle}>Ilmoituksen Viesti:</Text>
        <Text style={styles.commonText}>{body}</Text>

        <Text style={styles.sectionTitle}>Ilmoituksen Data:</Text>
        <Text style={styles.commonText}>{data}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
  },
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
  },
  commonText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
});
```

---

## **6. Valmistele Android**
1. Luo `android`-kansio komennolla:
   ```bash
   npx expo prebuild
   ```

2. Luo Firebase-projekti [Firebase Consolessa](https://console.firebase.google.com):
   - Lisää Android-sovellus.
   - Lataa `google-services.json` ja tallenna se `android/app`-kansioon.

3. Lisää `app.json`-tiedostoon:
   ```json
   "android": {
     "googleServicesFile": "./android/app/google-services.json"
   }
   ```

---

## **7. Rakenna sovellus**
Luo APK käyttäen EAS:
```bash
eas build -p android --profile development
```

---

## **8. Lisää FCM-palvelinavain Expoon**
1. Mene Expo-sivustolle:
   [https://expo.dev/](https://expo.dev/)

2. Valitse oma projektisi.

3. Navigoi projektin **Credentials**-osioon.

4. Lataa **Firebase Project Settings** -sivulta **Service Account** -välilehdeltä `private key` JSON-tiedosto.

5. Lisää JSON-tiedosto Expo-projektisi **credentials**-osioon ja varmista, että **FCM V1 Service Account Key** on määritetty.

---

## **9. Testaa push-ilmoitukset**
1. Käynnistä sovellus:
   ```bash
   npx expo start
   ```

2. Käytä [Expo Push Notification Toolia](https://expo.dev/notifications) lähettääksesi testiviesti laitteen push-tokeniin.

---

Nyt sovelluksen push-ilmoitukset ovat toiminnassa ja voit vastaanottaa ja näyttää ilmoituksia laitteellasi!
