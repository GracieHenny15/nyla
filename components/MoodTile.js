import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from '../supabase';

const CORE_SCALES = [
  { key: 'mood', label: 'Mood', lo: 'Low', hi: 'High' },
  { key: 'energy', label: 'Energy', lo: 'Low', hi: 'High' },
  { key: 'anxiety', label: 'Anxiety / Irritability', lo: 'Low', hi: 'High' },
  { key: 'cravings', label: 'Cravings', lo: 'Low', hi: 'High' },
];

const ADVANCED_SCALES = [
  { key: 'clarity', label: 'Mental clarity', lo: 'Foggy', hi: 'Sharp' },
  { key: 'motivation', label: 'Motivation', lo: 'Low', hi: 'Driven' },
  { key: 'digestion', label: 'Digestion', lo: 'Poor', hi: 'Good' },
];

const SYMPTOMS = ['Cramps', 'Bloating', 'Headache', 'Tender', 'Fatigue', 'Irritation'];

function SliderRow({ scale, value, onChange }) {
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{scale.label}</Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#fff"
        maximumTrackTintColor="rgba(255,255,255,0.25)"
        thumbTintColor="#fff"
      />
      <View style={styles.sliderMarks}>
        <Text style={styles.sliderMarkText}>{scale.lo} (1)</Text>
        <Text style={styles.sliderMarkText}>Moderate (5)</Text>
        <Text style={styles.sliderMarkText}>{scale.hi} (10)</Text>
      </View>
    </View>
  );
}

export default function MoodTile() {
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [values, setValues] = useState({
    mood: 5, energy: 5, anxiety: 5, cravings: 5,
    clarity: 5, motivation: 5, digestion: 5,
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadTodayCount();
  }, []);

  async function loadTodayCount() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const { data, error } = await supabase
      .from('mood_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today);
    if (error) { console.log('Error loading mood logs:', error.message); return; }
    setTodayCount(data.length);
  }

  function updateValue(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function toggleSymptom(symptom) {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  }

  async function saveMood() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const { error } = await supabase.from('mood_logs').insert({
      user_id: user.id,
      date: today,
      ...values,
      symptoms: selectedSymptoms,
      note: note || null,
    });
    if (error) { console.log('Error saving mood log:', error.message); return; }
    setTodayCount((prev) => prev + 1);
    setExpanded(false);
    setValues({ mood: 5, energy: 5, anxiety: 5, cravings: 5, clarity: 5, motivation: 5, digestion: 5 });
    setSelectedSymptoms([]);
    setNote('');
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.tile} onPress={() => setExpanded(true)} activeOpacity={0.8}>
        <Text style={styles.icon}>🌸</Text>
        <Text style={styles.label}>Mood</Text>
        <Text style={styles.val}>
          {todayCount > 0 ? `${todayCount} check-in${todayCount > 1 ? 's' : ''}` : 'How are you feeling?'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={expanded}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExpanded(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>How are you feeling?</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={styles.doneBtn}>Done ✓</Text>
              </TouchableOpacity>
            </View>

            {CORE_SCALES.map((scale) => (
              <SliderRow
                key={scale.key}
                scale={scale}
                value={values[scale.key]}
                onChange={(val) => updateValue(scale.key, val)}
              />
            ))}

            <Text style={styles.sectionLabel}>
              Symptoms <Text style={styles.optionalText}>(optional)</Text>
            </Text>
            <View style={styles.symptomGrid}>
              {SYMPTOMS.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[styles.symptomChip, selectedSymptoms.includes(symptom) && styles.symptomChipActive]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text style={[styles.symptomText, selectedSymptoms.includes(symptom) && styles.symptomTextActive]}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <Text style={styles.advancedToggleText}>Advanced tracking</Text>
              <Text style={styles.advancedArrow}>{showAdvanced ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showAdvanced && (
              <View>
                {ADVANCED_SCALES.map((scale) => (
                  <SliderRow
                    key={scale.key}
                    scale={scale}
                    value={values[scale.key]}
                    onChange={(val) => updateValue(scale.key, val)}
                  />
                ))}
              </View>
            )}

            <TextInput
              style={styles.noteInput}
              placeholder="Anything unusual today? (optional)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveMood}>
              <Text style={styles.saveBtnText}>Save check-in</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  tile: {
    backgroundColor: '#C8E0DC',
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
    color: '#3A7868',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  val: {
    fontSize: 11,
    color: '#3A7868',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#4A8A80',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  panelContent: {
    padding: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  sliderRow: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderMarkText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    marginTop: 4,
  },
  optionalText: {
    opacity: 0.6,
    fontWeight: '400',
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  symptomChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  symptomChipActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  symptomText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  symptomTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  advancedToggleText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  advancedArrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#fff',
    minHeight: 56,
    textAlignVertical: 'top',
    marginTop: 10,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
});