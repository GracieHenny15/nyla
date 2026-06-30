import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useFonts, DancingScript_600SemiBold } from '@expo-google-fonts/dancing-script';
import { C } from './constants';
import { supabase } from './supabase';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';

const TABS = ['Home', 'Cycle', 'Today', 'Plan'];

function PlaceholderScreen({ name }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{name}</Text>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ DancingScript_600SemiBold });
  const [activeTab, setActiveTab] = useState('Home');
  const [showProfile, setShowProfile] = useState(false);
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || checkingSession) return null;

  if (!session) {
    return <LoginScreen />;
  }

  function renderScreen() {
    if (showProfile) return <ProfileScreen onBack={() => setShowProfile(false)} />;
    if (activeTab === 'Home') return <HomeScreen onProfilePress={() => setShowProfile(true)} />;
    return <PlaceholderScreen name={activeTab} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}
      {!showProfile && (
        <View style={styles.navbar}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.navItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <View style={[styles.navDot, active && styles.navDotActive]} />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: C.sand,
  },
  navbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.linen,
    backgroundColor: C.bg,
    paddingBottom: 4,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.linen,
  },
  navDotActive: {
    backgroundColor: C.rose,
  },
  navLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: C.sand,
  },
  navLabelActive: {
    color: C.rose,
  },
});