import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { supabase } from '../supabase';

export default function WaterTile() {
  const [expanded, setExpanded] = useState(false);
  const [ounces, setOunces] = useState(0);
  const [goalOunces, setGoalOunces] = useState(64);
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    loadProfile();
    loadTodayTotal();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('user_profiles')
      .select('weight_lbs')
      .eq('user_id', user.id)
      .single();
    if (data && data.weight_lbs) setGoalOunces(Math.round(data.weight_lbs / 2));
  }

  async function loadTodayTotal() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const { data, error } = await supabase
      .from('water_logs')
      .select('amount_oz')
      .eq('user_id', user.id)
      .eq('date', today);
    if (error) { console.log('Error loading water logs:', error.message); return; }
    const total = data.reduce((sum, row) => sum + row.amount_oz, 0);
    setOunces(Math.max(0, total));
  }

  async function addWater(amount) {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const { error } = await supabase.from('water_logs').insert({
      user_id: user.id,
      date: today,
      amount_oz: amount,
      logged_at: new Date().toISOString(),
    });
    if (error) { console.log('Error logging water:', error.message); return; }
    setOunces((prev) => Math.max(0, prev + amount));
  }

  function handleCustomAdd() {
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount !== 0) {
      addWater(amount);
      setCustomAmount('');
    }
  }

  const progress = Math.min(ounces / goalOunces, 1) * 100;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.tile} onPress={() => setExpanded(true)} activeOpacity={0.8}>
        <Text style={styles.icon}>💧</Text>
        <Text style={styles.label}>Water</Text>
        <Text style={styles.val}>{ounces} / {goalOunces} oz</Text>
      </TouchableOpacity>

      <Modal
        visible={expanded}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Water intake</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={styles.doneBtn}>Done ✓</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.countRow}>
              <Text style={styles.bigCount}>{ounces}</Text>
              <Text style={styles.bigCountGoal}> / {goalOunces} oz</Text>
            </View>
            <Text style={styles.glassesLabel}>today</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <View style={styles.quickAddRow}>
              <TouchableOpacity style={styles.quickAddBtn} onPress={() => addWater(8)}>
                <Text style={styles.quickAddText}>+ 8oz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAddBtn} onPress={() => addWater(16)}>
                <Text style={styles.quickAddText}>+ 16oz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAddBtn} onPress={() => addWater(24)}>
                <Text style={styles.quickAddText}>+ 24oz</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Amount (oz), use - to remove"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numbers-and-punctuation"
              />
              <TouchableOpacity style={styles.customAddBtn} onPress={handleCustomAdd}>
                <Text style={styles.customAddText}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  tile: {
    backgroundColor: '#C8DCE8',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#3868A0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  val: {
    fontSize: 11,
    color: '#3868A0',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#4A80B0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  doneBtn: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  bigCount: {
    fontSize: 32,
    fontWeight: '500',
    color: '#fff',
  },
  bigCountGoal: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  glassesLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  quickAddBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  quickAddText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  customInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  customAddBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  customAddText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
});