import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { C } from '../constants';
import useCycleState from '../useCycleState';
import { PHASES, getDaysUntilPeriod, getUpcomingPhases } from '../cycleUtils';
import { supabase } from '../supabase';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import CycleCalendar from '../components/CycleCalendar';

const PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal'];

const PHASE_COLORS = {
  menstrual: '#C17B6F',
  follicular: '#6B9E96',
  ovulation: '#D4924A',
  luteal: '#A84060',
};

const PHASE_DAY_RANGES = {
  menstrual: 'Days 1–5',
  follicular: 'Days 6–13',
  ovulation: 'Days 14–16',
  luteal: 'Days 17–28',
};

const WHAT_TO_EXPECT = {
  menstrual: {
    energy: { level: 'Very low', desc: 'Your body is working hard -- rest is productive right now.' },
    cravings: { level: 'High', desc: 'Comfort foods, warmth and sweetness are common.' },
    mood: { level: 'Low', desc: 'More inward, tender, emotionally sensitive.' },
    sleep: { level: 'Disrupted', desc: 'May feel restless or have trouble staying asleep.' },
  },
  follicular: {
    energy: { level: 'Rising', desc: 'Best window of the month -- estrogen is climbing.' },
    cravings: { level: 'Low', desc: 'Appetite steadier and easier to manage.' },
    mood: { level: 'High', desc: 'Uplifted, motivated, social.' },
    sleep: { level: 'Good', desc: 'Deep and restorative.' },
  },
  ovulation: {
    energy: { level: 'Peak', desc: 'Your highest energy point of the month.' },
    cravings: { level: 'Very low', desc: 'Naturally regulated -- appetite is easy.' },
    mood: { level: 'Peak', desc: 'Confident, social, optimistic.' },
    sleep: { level: 'Good', desc: 'Good quality, slightly less needed.' },
  },
  luteal: {
    energy: { level: 'Lower', desc: 'Especially after 2pm as the phase progresses.' },
    cravings: { level: 'High', desc: 'Warm, sweet and salty foods -- driven by progesterone.' },
    mood: { level: 'Variable', desc: 'More inward and emotionally sensitive as period approaches.' },
    sleep: { level: 'Lighter', desc: 'May feel restless or less rested at night.' },
  },
};

const METRIC_LEVELS = {
  'Very low': 0.1,
  'Low': 0.25,
  'Rising': 0.6,
  'Lower': 0.35,
  'Variable': 0.5,
  'Moderate': 0.5,
  'High': 0.75,
  'Good': 0.75,
  'Peak': 1.0,
  'Very high': 1.0,
  'Disrupted': 0.25,
};

function MetricBar({ label, level, desc, color }) {
  const pct = METRIC_LEVELS[level] || 0.5;
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricLevel, { color }]}>{level}</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.metricDesc}>{desc}</Text>
    </View>
  );
}

export default function CycleScreen() {
  const {
    phase,
    cycleDay,
    cycleLength,
    isOnPeriod,
    periodStartDate,
    phaseData,
    loading,
    markPeriodStarted,
  } = useCycleState();
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [periodHistory, setPeriodHistory] = useState([]);
  async function loadPeriodHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('period_history')
      .select('*')
      .eq('user_id', user.id)
      .order('period_start_date', { ascending: false });
    if (error) { console.log('Error loading period history:', error.message); return; }
    setPeriodHistory(data || []);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your cycle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!periodStartDate && !isOnPeriod) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.screenTitle}>Your cycle</Text>
          <Text style={styles.screenSub}>Set up your cycle to get personalized guidance</Text>
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>When did your last period start?</Text>
            <Text style={styles.setupDesc}>
              This helps Nyla calculate your current phase and personalize your plan. You can add more dates to improve accuracy.
            </Text>
            <TouchableOpacity style={styles.setupBtn} onPress={() => markPeriodStarted()}>
              <Text style={styles.setupBtnText}>My period started today</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const daysUntilPeriod = getDaysUntilPeriod(cycleDay, cycleLength);
  const upcomingPhases = getUpcomingPhases(phase, cycleDay, cycleLength);
  const expect = WHAT_TO_EXPECT[phase];
  const phaseColor = PHASE_COLORS[phase];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Your cycle</Text>
<TouchableOpacity
            style={styles.historyBtn}
            onPress={async () => {
              await loadPeriodHistory();
              setShowHistory(true);
            }}
          >
            <Text style={styles.historyBtnText}>📅 History</Text>
          </TouchableOpacity>
        </View>
        {/* Cycle wheel + legend */}
        <View style={styles.wheelSection}>
          <View style={styles.wheelContainer}>
            <Svg width={160} height={160} viewBox="0 0 160 160">
              {(() => {
                const cx = 80, cy = 80, r = 62, strokeW = 16;
                const circumference = 2 * Math.PI * r;
                const follicularLen = cycleLength - 5 - 3 - 13;
                const phaseLengths = { menstrual: 5, follicular: follicularLen, ovulation: 3, luteal: 13 };
                let offset = 0;
                return PHASE_ORDER.map((p) => {
                  const len = phaseLengths[p];
                  const dash = (len / cycleLength) * circumference;
                  const gap = circumference - dash;
                  const strokeDashoffset = -(offset / cycleLength) * circumference;
                  offset += len;
                  return (
                    <Circle
                      key={p}
                      cx={cx} cy={cy} r={r}
                      fill="none"
                      stroke={PHASE_COLORS[p]}
                      strokeWidth={strokeW}
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset={strokeDashoffset}
                      transform={`rotate(-90 ${cx} ${cy})`}
                    />
                  );
                });
              })()}
              {(() => {
                const angle = ((cycleDay - 1) / cycleLength) * 2 * Math.PI - Math.PI / 2;
                const dotX = 80 + 62 * Math.cos(angle);
                const dotY = 80 + 62 * Math.sin(angle);
                return <Circle cx={dotX} cy={dotY} r={6} fill="#fff" stroke={phaseColor} strokeWidth={2.5} />;
              })()}
              <Circle cx={80} cy={80} r={52} fill={C.bg} />
              <SvgText x={80} y={74} textAnchor="middle" fontFamily="serif" fontSize={12} fill={phaseColor}>
                {phaseData.name}
              </SvgText>
              <SvgText x={80} y={94} textAnchor="middle" fontSize={22} fontWeight="700" fill={C.espresso}>
                {`Day ${cycleDay}`}
              </SvgText>
              <SvgText x={80} y={108} textAnchor="middle" fontSize={11} fill={C.muted}>
                {`of ${cycleLength}`}
              </SvgText>
            </Svg>
          </View>

<View style={styles.legendColumn}>
            <View style={styles.legend}>
              {[0, 1].map((rowIndex) => (
                <View key={rowIndex} style={styles.legendRowPair}>
                  {[0, 1].map((colIndex) => {
                    const p = PHASE_ORDER[rowIndex * 2 + colIndex];
                    return (
                      <View key={p} style={styles.legendItem}>
                        <View style={[
                          styles.legendDot,
                          { backgroundColor: PHASE_COLORS[p] },
                          p === phase && styles.legendDotActive,
                        ]} />
                        <Text style={[styles.legendName, p === phase && styles.legendNameActive]}>
                          {PHASES[p].name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {!isOnPeriod && (
              <View style={styles.countdownInline}>
                <Text style={styles.countdownInlineLabel}>Next period in</Text>
                <Text style={styles.countdownInlineDays}>{daysUntilPeriod} {daysUntilPeriod === 1 ? 'day' : 'days'}</Text>
              </View>
            )}
            {isOnPeriod && (
              <View style={styles.countdownInline}>
                <Text style={styles.countdownInlineLabel}>Period in progress</Text>
                <Text style={styles.countdownInlineDays}>Day {cycleDay}</Text>
              </View>
            )}
          </View>
        </View>

        {/* You are here card */}
        <View style={[styles.youAreHereCard, { backgroundColor: phaseColor }]}>
          <View style={styles.youAreHereTop}>
            <View>
              <Text style={styles.youAreHereLabel}>You are here</Text>
              <Text style={styles.youAreHereName}>{phaseData.name} phase</Text>
              <Text style={styles.youAreHereDays}>{phaseData.days} · Day {cycleDay}</Text>
            </View>
            <View style={styles.youAreHereBadge}>
              <Text style={styles.youAreHereBadgeText}>
                {isOnPeriod ? 'In progress' : `${daysUntilPeriod} days left`}
              </Text>
            </View>
          </View>
          <View style={styles.youAreHereDivider} />
          <Text style={styles.youAreHereWhyLabel}>Why you feel this way</Text>
          <Text style={styles.youAreHereWhy}>{phaseData.whyYouFeel}</Text>
        </View>

        {/* What to expect */}
        <Text style={styles.sectionLabel}>What to expect this phase</Text>
        <View style={styles.card}>
          <MetricBar label="Energy" level={expect.energy.level} desc={expect.energy.desc} color={phaseColor} />
          <MetricBar label="Cravings" level={expect.cravings.level} desc={expect.cravings.desc} color={phaseColor} />
          <MetricBar label="Mood" level={expect.mood.level} desc={expect.mood.desc} color={phaseColor} />
          <MetricBar label="Sleep quality" level={expect.sleep.level} desc={expect.sleep.desc} color={phaseColor} />
        </View>

        {/* What's coming */}
        <Text style={styles.sectionLabel}>What's coming</Text>
        {upcomingPhases.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.upcomingCard, { borderLeftColor: PHASE_COLORS[p] }]}
            onPress={() => setExpandedPhase(expandedPhase === p ? null : p)}
            activeOpacity={0.8}
          >
            <View style={styles.upcomingHeader}>
              <View>
                <Text style={[styles.upcomingName, { color: PHASE_COLORS[p] }]}>{PHASES[p].name}</Text>
                <Text style={styles.upcomingDays}>{PHASE_DAY_RANGES[p]}</Text>
              </View>
              <Text style={[styles.upcomingArrow, { color: PHASE_COLORS[p] }]}>
                {expandedPhase === p ? '▲' : '▼'}
              </Text>
            </View>
            {expandedPhase === p && (
              <View style={styles.upcomingExpanded}>
                <Text style={styles.upcomingTagline}>{PHASES[p].tagline}</Text>
                <View style={styles.upcomingDivider} />
                <Text style={styles.upcomingWhyLabel}>What to expect</Text>
                <Text style={styles.upcomingWhy}>{PHASES[p].whyYouFeel}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

</ScrollView>

<CycleCalendar
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        periodHistory={periodHistory}
        cycleLength={cycleLength}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 20,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: C.muted,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  screenTitle: {
    fontFamily: 'serif',
    fontSize: 26,
    color: C.espresso,
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 12,
    color: C.muted,
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  historyBtn: {
    backgroundColor: C.linen,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.sand,
  },
  historyBtnText: {
    fontSize: 11,
    color: C.espresso,
  },
  setupCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.linen,
    marginTop: 16,
  },
  setupTitle: {
    fontSize: 16,
    color: C.espresso,
    fontFamily: 'serif',
    marginBottom: 8,
  },
  setupDesc: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  setupBtn: {
    backgroundColor: C.rose,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  setupBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  wheelSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    gap: 6,
  },
  legendRowPair: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendName: {
    fontSize: 11,
    color: C.muted,
  },
  legendNameActive: {
    fontSize: 12,
    color: C.espresso,
    fontWeight: '600',
  },
  youAreHereCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  youAreHereTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  youAreHereLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  youAreHereName: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  youAreHereDays: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  youAreHereBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  youAreHereBadgeText: {
    fontSize: 10,
    color: '#fff',
  },
  youAreHereDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 10,
  },
  youAreHereWhyLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  youAreHereWhy: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 19,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 16,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.linen,
    marginBottom: 4,
  },
  metricRow: {
    marginBottom: 14,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.espresso,
  },
  metricLevel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricTrack: {
    height: 6,
    backgroundColor: C.linen,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricDesc: {
    fontSize: 11,
    color: C.muted,
    lineHeight: 16,
  },
  upcomingCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: C.linen,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  upcomingDays: {
    fontSize: 11,
    color: C.muted,
  },
  upcomingArrow: {
    fontSize: 10,
  },
  upcomingExpanded: {
    marginTop: 12,
  },
  upcomingTagline: {
    fontSize: 12,
    color: C.espresso,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  upcomingDivider: {
    height: 1,
    backgroundColor: C.linen,
    marginVertical: 10,
  },
  upcomingWhyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  upcomingWhy: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 18,
  },
  legendColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  countdownInline: {
    marginTop: 4,
  },
  countdownInlineLabel: {
    fontSize: 10,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  countdownInlineDays: {
    fontSize: 22,
    fontWeight: '700',
    color: C.espresso,
    fontFamily: 'serif',
  },
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  historyPanel: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: {
    fontFamily: 'serif',
    fontSize: 20,
    color: C.espresso,
  },
  historyClose: {
    fontSize: 13,
    color: C.muted,
  },
  historyEmpty: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.linen,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.rose,
    marginTop: 4,
    flexShrink: 0,
  },
  historyRowContent: {
    flex: 1,
  },
  historyStartDate: {
    fontSize: 14,
    color: C.espresso,
    fontWeight: '500',
    marginBottom: 2,
  },
  historyEndDate: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 2,
  },
  historyCycleLen: {
    fontSize: 11,
    color: C.teal,
    marginBottom: 2,
  },
  historySource: {
    fontSize: 10,
    color: C.sand,
  },
});