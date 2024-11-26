import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { usePushNotifications } from './usePushNotifications';

export default function App() {
  // Käytetään `usePushNotifications`-hookia hakemaan push-token ja viimeisin ilmoitus
  const { expoPushToken, notification } = usePushNotifications();

  // Poimitaan ilmoituksen otsikko ja viesti oikeista kentistä
  const title =
    notification?.request.content.title || // Ensisijaisesti otsikko `content.title`
    (notification?.request.trigger as any)?.remoteMessage?.data?.title || // Vaihtoehtoisesti otsikko `remoteMessage.data.title`
    'Ei otsikkoa'; // Jos otsikkoa ei ole, näytetään oletusarvo

  const body =
    notification?.request.content.body || // Ensisijaisesti viesti `content.body`
    (notification?.request.trigger as any)?.remoteMessage?.data?.message || // Vaihtoehtoisesti viesti `remoteMessage.data.message`
    'Ei viestiä'; // Jos viestiä ei ole, näytetään oletusarvo

  // Muutetaan vastaanotettu ilmoitus JSON-merkkijonoksi näyttämistä varten
  const data = JSON.stringify(notification, null, 2);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Push-token */}
        <Text style={styles.sectionTitle}>Expo Push Token:</Text>
        <Text style={styles.commonText}>{expoPushToken?.data ?? 'Ei saatavilla'}</Text>

        {/* Ilmoituksen otsikko */}
        <Text style={styles.sectionTitle}>Ilmoituksen Otsikko:</Text>
        <Text style={styles.commonText}>{title}</Text>

        {/* Ilmoituksen viesti */}
        <Text style={styles.sectionTitle}>Ilmoituksen Viesti:</Text>
        <Text style={styles.commonText}>{body}</Text>

        {/* Koko ilmoituksen data */}
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
