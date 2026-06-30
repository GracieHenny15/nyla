import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../constants';

export default function TodaysPlan() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>Today's plan</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: C.teal }]}>
            <Text style={styles.icon}>🏃‍♀️</Text>
          </View>
          <Text style={[styles.tag, { color: C.teal }]}>Movement</Text>
          <Text style={styles.cardTitle}>Lower body resistance</Text>
          <Text style={styles.cardSub}>35 mins · moderate</Text>
          <View style={styles.chipRow}>
            <View style={[styles.chip, { borderColor: C.teal }]}>
              <Text style={[styles.chipText, { color: C.teal }]}>Glutes</Text>
            </View>
            <View style={[styles.chip, { borderColor: C.teal }]}>
              <Text style={[styles.chipText, { color: C.teal }]}>Core</Text>
            </View>
          </View>
          <Text style={[styles.viewMore, { color: C.teal }]}>View →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: C.amber }]}>
            <Text style={styles.icon}>🍳</Text>
          </View>
          <Text style={[styles.tag, { color: C.amber }]}>Cook today</Text>
          <Text style={styles.cardLabel}>Evening</Text>
          <Text style={styles.cardTitle}>Salmon with sweet potato</Text>
          <Text style={[styles.viewMore, { color: C.amber }]}>View recipe →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fullCard}>
        <View style={[styles.iconCircle, { backgroundColor: C.teal }]}>
          <Text style={styles.icon}>🌸</Text>
        </View>
        <Text style={[styles.tag, { color: C.teal }]}>From Nyla</Text>
        <Text style={styles.cardTitle}>Rest and recovery</Text>
        <Text style={styles.nylaNote}>
          Your body is asking for gentler movement and warming foods this phase. Trust what feels right today.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.linen,
  },
  fullCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.linen,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
  },
  tag: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 9,
    color: C.sand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 13,
    color: C.espresso,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  viewMore: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
  },
  nylaNote: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 18,
  },
});