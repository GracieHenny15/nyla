import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { C } from '../constants';
import { supabase } from '../supabase';
import FoodTile from '../components/FoodTile';
import WaterTile from '../components/WaterTile';
import SleepTile from '../components/SleepTile';
import MoodTile from '../components/MoodTile';
import TodaysPlan from '../components/TodaysPlan';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate() {
  const today = new Date();
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  return today.toLocaleDateString('en-US', options);
}

export default function HomeScreen({ onProfilePress }) {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', user.id)
      .single();

    if (data && data.first_name) {
      setFirstName(data.first_name);
    }
  }

  const initial = firstName ? firstName.charAt(0).toUpperCase() : '?';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, <Text style={styles.name}>{firstName || 'there'}</Text>
          </Text>
          <Text style={styles.subGreeting}>{getFormattedDate()}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={onProfilePress}>
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>
      </View>
      <FoodTile />
      <WaterTile phase="luteal" />
      <SleepTile />
      <MoodTile />
      <TodaysPlan />
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});