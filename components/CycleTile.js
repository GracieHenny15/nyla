import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { supabase } from '../supabase';

const FLOW_OPTIONS = ['Light', 'Moderate', 'Heavy'];
const PERIOD_SYMPTOMS = ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Tender', 'Back pain', 'Nausea', 'No symptoms'];
const MANAGING_OPTIONS = [
  { value: 'Fine', emoji: '🙂' },
  { value: 'Rough day', emoji: '😟' },
  { value: 'Really struggling', emoji: '😢' },
];
const CYCLE_EVENTS = [
  { key: 'started', label: 'Period started', icon: '🔴', desc: 'Start of cycle day 1' },
  { key: 'spotting', label: 'Spotting', icon: '💡', desc: 'Light bleeding or spotting' },
  { key: 'ovulation', label: 'Ovulation signs', icon: '🌸', desc: 'Discharge, temperature shift' },
];

export default function CycleTile() {
  const [expanded, setExpanded] = useState(false);
  const [onPeriod, setOnPeriod] = useState(false);
  const [eventType, setEventType] = useState(null);
  const [flow, setFlow] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [managing, setManaging] = useState(null);
  const [logged, setLogged] = useState(false);
  const [existingLogId, setExistingLogId] = useState(null);
  const [tileVal, setTileVal] = useState('Log period');

  useEffect(() => {
    loadTodayLog();
  }, []);

  async function loadTodayLog() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');
    const { data } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();
    if (data) {
      setEventType(data.event_type);
      setFlow(data.flow);
      setSymptoms(data.symptoms || []);
      setManaging(data.managing);
      setLogged(true);
      setExistingLogId(data.id);
      if (data.event_type === 'started') {
        setOnPeriod(true);
        setTileVal('Period started');
      } else if (data.event_type === 'spotting') {
        setTileVal('Spotting');
      } else if (data.event_type === 'ovulation') {
        setTileVal('Ovulation signs');
      } else {
        setTileVal('Logged ✓');
      }
    }
  }

  function toggleSymptom(symptom) {
    if (symptom === 'No symptoms') {
      setSymptoms(['No symptoms']);
      return;
    }
    const filtered = symptoms.filter((s) => s !== 'No symptoms');
    if (filtered.includes(symptom)) {
      setSymptoms(filtered.filter((s) => s !== symptom));
    } else {
      setSymptoms([...filtered, symptom]);
    }
  }

  async function saveLog(overrides = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');

    const payload = {
      user_id: user.id,
      date: today,
      event_type: overrides.event_type ?? eventType,
      flow: overrides.flow ?? flow,
      symptoms: overrides.symptoms ?? symptoms,
      managing: overrides.managing ?? managing,
      logged_at: new Date().toISOString(),
    };

    if (existingLogId) {
      const { error } = await supabase.from('cycle_logs').update(payload).eq('id', existingLogId);
      if (error) { console.log('Error updating cycle log:', error.message); return; }
    } else {
      const { data, error } = await supabase.from('cycle_logs').insert(payload).select().single();
      if (error) { console.log('Error inserting cycle log:', error.message); return; }
      setExistingLogId(data.id);
    }

    setLogged(true);
  }

  async function handleEventSelect(key) {
    setEventType(key);
    if (key === 'started') {
      setOnPeriod(true);
      setTileVal('Period started');
    } else if (key === 'spotting') {
      setTileVal('Spotting');
    } else if (key === 'ovulation') {
      setTileVal('Ovulation signs');
    }
  }

  async function handleSaveCycleEvent() {
    await saveLog();
    if (eventType !== 'started') {
      setExpanded(false);
    }
  }

  async function handleSavePeriodSymptoms() {
    await saveLog();
    setExpanded(false);
  }

  async function handlePeriodEnded() {
    setOnPeriod(false);
    setEventType('ended');
    setTileVal('Period ended');
    await saveLog({ event_type: 'ended' });
    setExpanded(false);
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.tile} onPress={() => setExpanded(true)} activeOpacity={0.8}>
        <Text style={styles.icon}>🌀</Text>
        <Text style={styles.label}>Cycle</Text>
        <Text style={styles.val}>{tileVal}</Text>
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
              <Text style={styles.panelTitle}>Cycle log</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={styles.doneBtn}>Done ✓</Text>
              </TouchableOpacity>
            </View>

            {onPeriod ? (
              // Period mode
              <View>
                <Text style={styles.sectionLabel}>Flow today</Text>
                <View style={styles.optionRow}>
                  {FLOW_OPTIONS.map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.optionBtn, flow === f && styles.optionBtnActive]}
                      onPress={() => setFlow(f)}
                    >
                      <Text style={[styles.optionText, flow === f && styles.optionTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Symptoms today</Text>
                <View style={styles.chipGrid}>
                  {PERIOD_SYMPTOMS.map((symptom) => (
                    <TouchableOpacity
                      key={symptom}
                      style={[styles.chip, symptoms.includes(symptom) && styles.chipActive]}
                      onPress={() => toggleSymptom(symptom)}
                    >
                      <Text style={[styles.chipText, symptoms.includes(symptom) && styles.chipTextActive]}>
                        {symptom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>How are you managing?</Text>
                <View style={styles.managingRow}>
                  {MANAGING_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.managingBtn, managing === opt.value && styles.managingBtnActive]}
                      onPress={() => setManaging(opt.value)}
                    >
                      <Text style={styles.managingEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.managingText, managing === opt.value && styles.managingTextActive]}>
                        {opt.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSavePeriodSymptoms}>
                  <Text style={styles.saveBtnText}>Save today's log</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.endPeriodBtn} onPress={handlePeriodEnded}>
                  <Text style={styles.endPeriodText}>Mark period ended</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Default mode
              <View>
                <Text style={styles.sectionLabel}>What would you like to log?</Text>
                <View style={styles.eventList}>
                  {CYCLE_EVENTS.map((event) => (
                    <TouchableOpacity
                      key={event.key}
                      style={[styles.eventCard, eventType === event.key && styles.eventCardActive]}
                      onPress={() => handleEventSelect(event.key)}
                    >
                      <Text style={styles.eventIcon}>{event.icon}</Text>
                      <View style={styles.eventTextBlock}>
                        <Text style={[styles.eventLabel, eventType === event.key && styles.eventLabelActive]}>
                          {event.label}
                        </Text>
                        <Text style={styles.eventDesc}>{event.desc}</Text>
                      </View>
                      {eventType === event.key && (
                        <Text style={styles.eventCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {eventType === 'started' && (
                  <View>
                    <Text style={styles.sectionLabel}>How's the flow?</Text>
                    <View style={styles.optionRow}>
                      {FLOW_OPTIONS.map((f) => (
                        <TouchableOpacity
                          key={f}
                          style={[styles.optionBtn, flow === f && styles.optionBtnActive]}
                          onPress={() => setFlow(f)}
                        >
                          <Text style={[styles.optionText, flow === f && styles.optionTextActive]}>{f}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {eventType && (
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCycleEvent}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
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
    backgroundColor: '#E8C8D8',
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
    color: '#A04060',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  val: {
    fontSize: 11,
    color: '#A04060',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#C87888',
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 10,
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: 7,
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
  managingRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  managingBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  managingBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.7)',
  },
  managingEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  managingText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  managingTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  eventList: {
    gap: 7,
    marginBottom: 14,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  eventCardActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  eventIcon: {
    fontSize: 18,
  },
  eventTextBlock: {
    flex: 1,
  },
  eventLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '400',
    marginBottom: 1,
  },
  eventLabelActive: {
    fontWeight: '600',
  },
  eventDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  eventCheck: {
    fontSize: 14,
    color: '#fff',
  },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  endPeriodBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  endPeriodText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
});