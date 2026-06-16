import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C } from '../constants';
import FoodTile from '../components/FoodTile';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>
            Good morning, <Text style={styles.name}>Grace</Text>
          </Text>
          <Text style={styles.subGreeting}>Monday · June 15</Text>
        </View>
      </View>
      <FoodTile />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    padding: 20,
    paddingTop: 16,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  greeting: {
    fontFamily: 'serif',
    fontSize: 26,
    color: C.espresso,
    marginBottom: 4,
  },
  name: {
    color: C.rose,
    fontFamily: 'DancingScript_600SemiBold',
  },
  subGreeting: {
    fontSize: 13,
    color: C.muted,
    letterSpacing: 0.3,
  },
});