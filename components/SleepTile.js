import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from '../supabase';

const QUALITIES = ['Poor', 'OK', 'Good', 'Great'];

export default function SleepTile() {
  const [expanded, setExpanded] = useState(false);
  const [hours, setHours] = useState(8);
  const [quality, setQuality] = useState(null);
  const [wokeDuringNight, setWokeDuringNight] = useState(null);
  const [note, setNote] = useState('');
  const [logged, setLogged] = useState(false);
  const [existingLogId, setExistingLogId] = useState(null);
  const [napped, setNapped] = useState(false);
  const [napMinutes, setNapMinutes] = useState('');
  const [napLogged, setNapLogged] = useState(false);

  useEffect(() => {
    loadTodayLog();
  }, []);

  async function loadTodayLog() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const { data } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();
    if (data) {
      setHours(data.hours);
      setQuality(data.quality);
      setWokeDuringNight(data.woke_during_night);
      setNote(data.note || '');
      setLogged(true);
      setExistingLogId(data.id);
      if (data.napped) {
        setNapped(true);
        setNapMinutes(String(data.nap_duration_minutes || ''));
        setNapLogged(true);
      }
    }
  }

  async function saveSleep() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const payload = { user_id: user.id, date: today, hours, quality, woke_during_night: wokeDuringNight, note: note || null };
    if (existingLogId) {
      const { error } = await supabase.from('sleep_logs').update(payload).eq('id', existingLogId);
      if (error) { console.log('Error updating sleep log:', error.message); return; }
    } else {
      const { data, error } = await supabase.from('sleep_logs').insert(payload).select().single();
      if (error) { console.log('Error inserting sleep log:', error.message); return; }
      setExistingLogId(data.id);
    }
    setLogged(true);
  }

  async function saveNap() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const napPayload = { napped: true, nap_duration_minutes: parseFloat(napMinutes) || null };
    if (existingLogId) {
      const { error } = await supabase.from('sleep_logs').update(napPayload).eq('id', existingLogId);
      if (error) { console.log('Error saving nap:', error.message); return; }
    } else {
      const { data, error } = await supabase.from('sleep_logs').insert({ user_id: user.id, date: today, hours: 0, ...napPayload }).select().single();
      if (error) { console.log('Error saving nap:', error.message); return; }
      setExistingLogId(data.id);
    }
    setNapLogged(true);
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.tile} onPress={() => setExpanded(true)} activeOpacity={0.8}>
        <Text style={styles.icon}>🌙</Text>
        <Text style={styles.label}>Sleep</Text>
        <Text style={styles.val}>
          {logged ? `${hours}h${quality ? ` · ${quality}` : ''}` : 'How did you sleep?'}
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
              <Text style={styles.panelTitle}>Sleep log</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={styles.doneBtn}>Done ✓</Text>
              </TouchableOpacity>
            </View>

            {logged ? (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>✓ {hours}h logged{quality ? ` · ${quality}` : ''}</Text>
                {wokeDuringNight !== null && (
                  <Text style={styles.summarySubtext}>
                    {wokeDuringNight ? 'Woke up during the night' : 'Slept through the night'}
                  </Text>
                )}
                {note ? <Text style={styles.summarySubtext}>"{note}"</Text> : null}
                <TouchableOpacity onPress={() => setLogged(false)}>
                  <Text style={styles.editText}>Edit sleep log</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.hoursRow}>
                  <Text style={styles.sectionLabel}>Hours of sleep</Text>
                  <Text style={styles.hoursDisplay}>{hours}h</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={12}
                  step={0.5}
                  value={hours}
                  onValueChange={setHours}
                  minimumTrackTintColor="#fff"
                  maximumTrackTintColor="rgba(255,255,255,0.3)"
                  thumbTintColor="#fff"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>0h</Text>
                  <Text style={styles.sliderLabelText}>6h</Text>
                  <Text style={styles.sliderLabelText}>12h</Text>
                </View>

                <Text style={styles.sectionLabel}>How did you sleep?</Text>
                <View style={styles.optionRow}>
                  {QUALITIES.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.optionBtn, quality === q && styles.optionBtnActive]}
                      onPress={() => setQuality(q)}
                    >
                      <Text style={[styles.optionText, quality === q && styles.optionTextActive]}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Did you wake up during the night?</Text>
                <View style={styles.optionRow}>
                  {['Yes', 'No'].map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.optionBtn, wokeDuringNight === (v === 'Yes') && styles.optionBtnActive]}
                      onPress={() => setWokeDuringNight(v === 'Yes')}
                    >
                      <Text style={[styles.optionText, wokeDuringNight === (v === 'Yes') && styles.optionTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.noteInput}
                  placeholder="Anything to add? (optional)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={note}
                  onChangeText={setNote}
                  multiline
                />

                <TouchableOpacity style={styles.saveBtn} onPress={saveSleep}>
                  <Text style={styles.saveBtnText}>Save sleep log</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.napDivider} />

            <Text style={styles.sectionLabel}>Did you nap today?</Text>
            {napLogged ? (
              <Text style={styles.napLoggedText}>
                ✓ Nap logged{napMinutes ? ` -- ${napMinutes} min` : ''}
              </Text>
            ) : (
              <View>
                <TextInput
                  style={styles.napInput}
                  placeholder="How many minutes?"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={napMinutes}
                  onChangeText={setNapMinutes}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.napSaveBtn} onPress={saveNap}>
                  <Text style={styles.napSaveBtnText}>Log nap</Text>
                </TouchableOpacity>
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
    backgroundColor: '#DCD0E8',
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
    color: '#6B4FA0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  val: {
    fontSize: 11,
    color: '#6B4FA0',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#9B7EC8',
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
  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  editText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  hoursDisplay: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
    marginBottom: 10,
  },
  sliderLabelText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
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
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#fff',
    minHeight: 52,
    textAlignVertical: 'top',
    marginTop: 10,
    marginBottom: 10,
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
  napDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 14,
  },
  napLoggedText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  napInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8,
  },
  napSaveBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  napSaveBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});