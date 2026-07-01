import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../supabase';

const CATEGORIES = ['Walk', 'Run', 'Hike', 'Yoga', 'Strength', 'Cycling', 'Swim', 'Class', 'Other'];
const INTENSITIES = ['Low', 'Moderate', 'High'];
const FEELS = ['Easy', 'Good', 'Tough', 'Exhausted'];
const PLANNED_WORKOUT = { name: 'Lower body resistance', duration: '35 mins', intensity: 'Moderate' };

export default function MovementTile() {
  const [expanded, setExpanded] = useState(false);
  const [logged, setLogged] = useState(false);
  const [category, setCategory] = useState(null);
  const [customNote, setCustomNote] = useState('');
  const [intensity, setIntensity] = useState(null);
  const [feel, setFeel] = useState(null);
  const [wasPlanned, setWasPlanned] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(new Date());
  const [loggedTimeDisplay, setLoggedTimeDisplay] = useState(null);
  const [existingLogId, setExistingLogId] = useState(null);

  useEffect(() => {
    loadTodayLog();
  }, []);

  async function loadTodayLog() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const { data } = await supabase
      .from('movement_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();
    if (data) {
      setCategory(data.category);
      setIntensity(data.intensity);
      setFeel(data.feel);
      setWasPlanned(data.was_planned);
      setLogged(true);
      setExistingLogId(data.id);
      setLoggedTimeDisplay(data.workout_time || null);
    }
  }

  async function saveMovement() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const timeDisplay = workoutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const payload = {
      user_id: user.id,
      date: today,
      category: category === 'Other' && customNote ? customNote : category,
      custom_note: category === 'Other' ? customNote : null,
      intensity,
      feel,
      was_planned: wasPlanned,
      workout_time: timeDisplay,
      logged_at: new Date().toISOString(),
    };

    if (existingLogId) {
      const { error } = await supabase.from('movement_logs').update(payload).eq('id', existingLogId);
      if (error) { console.log('Error updating movement log:', error.message); return; }
    } else {
      const { data, error } = await supabase.from('movement_logs').insert(payload).select().single();
      if (error) { console.log('Error inserting movement log:', error.message); return; }
      setExistingLogId(data.id);
    }

    setLogged(true);
    setLoggedTimeDisplay(timeDisplay);
    setExpanded(false);
  }

  function selectPlanned() {
    setCategory(PLANNED_WORKOUT.name);
    setIntensity(PLANNED_WORKOUT.intensity);
    setWasPlanned(true);
    setWorkoutTime(new Date());
  }

  function selectCategory(cat) {
    setCategory(cat);
    setWasPlanned(false);
    setIntensity(null);
    setFeel(null);
    setWorkoutTime(new Date());
  }

  function resetLog() {
    setLogged(false);
    setCategory(null);
    setIntensity(null);
    setFeel(null);
    setWasPlanned(false);
    setCustomNote('');
    setLoggedTimeDisplay(null);
    setWorkoutTime(new Date());
  }

  const canSave = category && intensity && feel;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.tile} onPress={() => setExpanded(true)} activeOpacity={0.8}>
        <Text style={styles.icon}>🏃‍♀️</Text>
        <Text style={styles.label}>Movement</Text>
        <Text style={styles.val}>
          {logged ? (wasPlanned ? 'Done ✓' : category) : 'Log workout'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={expanded}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Log movement</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={styles.doneBtn}>Done ✓</Text>
              </TouchableOpacity>
            </View>

            {logged ? (
              <View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>✓ {category}</Text>
                  <Text style={styles.summarySubtext}>
                    {loggedTimeDisplay ? `${loggedTimeDisplay} · ` : ''}{intensity ? `${intensity} intensity` : ''}{feel ? ` · felt ${feel.toLowerCase()}` : ''}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={resetLog}>
                  <Text style={styles.editBtnText}>Edit log</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionLabel}>Today's plan</Text>
                <TouchableOpacity
                  style={[styles.plannedCard, category === PLANNED_WORKOUT.name && wasPlanned && styles.plannedCardSelected]}
                  onPress={selectPlanned}
                >
                  <View>
                    <Text style={styles.plannedName}>{PLANNED_WORKOUT.name}</Text>
                    <Text style={styles.plannedSub}>{PLANNED_WORKOUT.duration} · {PLANNED_WORKOUT.intensity}</Text>
                  </View>
                  <Text style={styles.plannedTap}>
                    {category === PLANNED_WORKOUT.name && wasPlanned ? '✓ Selected' : 'Tap to select'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Or log something else</Text>
                <View style={styles.chipGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, category === cat && !wasPlanned && styles.chipActive]}
                      onPress={() => selectCategory(cat)}
                    >
                      <Text style={[styles.chipText, category === cat && !wasPlanned && styles.chipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {category === 'Other' && (
                  <TextInput
                    style={styles.otherInput}
                    placeholder="What did you do? (optional)"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={customNote}
                    onChangeText={setCustomNote}
                  />
                )}

                {category && (
                  <View>
                    <Text style={styles.sectionLabel}>Intensity</Text>
                    <View style={styles.optionRow}>
                      {INTENSITIES.map((iv) => (
                        <TouchableOpacity
                          key={iv}
                          style={[styles.optionBtn, intensity === iv && styles.optionBtnActive]}
                          onPress={() => setIntensity(iv)}
                        >
                          <Text style={[styles.optionText, intensity === iv && styles.optionTextActive]}>{iv}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.sectionLabel}>How did it feel?</Text>
                    <View style={styles.optionRow}>
                      {FEELS.map((f) => (
                        <TouchableOpacity
                          key={f}
                          style={[styles.optionBtn, feel === f && styles.optionBtnActive]}
                          onPress={() => setFeel(f)}
                        >
                          <Text style={[styles.optionText, feel === f && styles.optionTextActive]}>{f}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.sectionLabel}>What time did you work out?</Text>
                    <DateTimePicker
                      value={workoutTime}
                      mode="time"
                      display="spinner"
                      onChange={(event, date) => { if (date) setWorkoutTime(date); }}
                      textColor="#fff"
                    />

                    {canSave && (
                      <TouchableOpacity style={styles.saveBtn} onPress={saveMovement}>
                        <Text style={styles.saveBtnText}>Save movement log</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
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
    backgroundColor: '#F5C5A3',
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
    color: '#9A4030',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  val: {
    fontSize: 11,
    color: '#9A4030',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#C87840',
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
    marginBottom: 16,
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
  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 12,
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  plannedCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  plannedCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  plannedName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 2,
  },
  plannedSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  plannedTap: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  chipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  otherInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: 'rgba(255,255,255,0.8)',
  },
  optionText: {
    fontSize: 12,
    color: '#fff',
  },
  optionTextActive: {
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
});