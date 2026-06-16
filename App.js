import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useFonts, DancingScript_600SemiBold } from '@expo-google-fonts/dancing-script';
import { C } from './constants';
import HomeScreen from './screens/HomeScreen';

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
  if (!fontsLoaded) return null;

  function renderScreen() {
    if (activeTab === 'Home') return <HomeScreen />;
    return <PlaceholderScreen name={activeTab} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}
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