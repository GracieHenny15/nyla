import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { C } from '../constants';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildProjectedPeriods(periodHistory, cycleLength) {
  if (!periodHistory || periodHistory.length === 0) return [];

  const sorted = [...periodHistory].sort((a, b) =>
    new Date(b.period_start_date) - new Date(a.period_start_date)
  );
  const lastStart = new Date(sorted[0].period_start_date);
  const projected = [];

  for (let i = 1; i <= 6; i++) {
    const projStart = new Date(lastStart);
    projStart.setDate(projStart.getDate() + cycleLength * i);
    const projEnd = new Date(projStart);
    projEnd.setDate(projEnd.getDate() + 4);
    projected.push({
      period_start_date: projStart.toLocaleDateString('en-CA'),
      period_end_date: projEnd.toLocaleDateString('en-CA'),
      projected: true,
    });
  }

  return projected;
}

function CalendarMonth({ year, month, allPeriods, today }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayD = isCurrentMonth ? today.getDate() : null;

function getPeriodForDay(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allPeriods.find((p) => {
      if (!p.period_start_date) return false;
      const start = p.period_start_date;
      const end = p.period_end_date || p.period_start_date;
      return dateStr >= start && dateStr <= end;
    });
  }
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const period = getPeriodForDay(d);
    const isToday = todayD === d;
    const inPeriod = !!period;
    const isProjected = period?.projected;

    let dayStyle = [styles.dayCircle];
    let textStyle = [styles.dayText];

    if (inPeriod && !isProjected) {
      dayStyle.push(styles.dayCirclePeriod);
      textStyle.push(styles.dayTextPeriod);
    } else if (inPeriod && isProjected) {
      dayStyle.push(styles.dayCircleProjected);
      textStyle.push(styles.dayTextProjected);
    }

    if (isToday && !inPeriod) {
      dayStyle.push(styles.dayCircleToday);
      textStyle.push(styles.dayTextToday);
    }

    cells.push(
      <View key={d} style={styles.dayCell}>
        <View style={dayStyle}>
          <Text style={textStyle}>{d}</Text>
        </View>
      </View>
    );
  }

  const monthPeriod = allPeriods.find((p) => {
    if (!p.period_start_date) return false;
    const startMonth = new Date(p.period_start_date).getMonth();
    const startYear = new Date(p.period_start_date).getFullYear();
    return startMonth === month && startYear === year;
  });

  return (
    <View>
      <View style={styles.dayNamesRow}>
        {DAY_NAMES.map((d) => (
          <View key={d} style={styles.dayCell}>
            <Text style={styles.dayName}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells}
      </View>

      {monthPeriod ? (
        <View style={styles.monthSummary}>
          <Text style={styles.monthSummaryTitle}>
            {MONTH_NAMES[month]} {monthPeriod.projected ? '· projected' : '· logged'}
          </Text>
          <Text style={styles.monthSummaryDetail}>
            Started: {new Date(monthPeriod.period_start_date).getDate()} {MONTH_NAMES[new Date(monthPeriod.period_start_date).getMonth()].slice(0, 3)}
            {monthPeriod.period_end_date ? ` · Ended: ${new Date(monthPeriod.period_end_date).getDate()} ${MONTH_NAMES[new Date(monthPeriod.period_end_date).getMonth()].slice(0, 3)}` : ' · In progress'}
          </Text>
        </View>
      ) : (
        <View style={styles.monthSummary}>
          <Text style={styles.monthSummaryEmpty}>No period data for this month</Text>
        </View>
      )}
    </View>
  );
}

export default function CycleCalendar({ visible, onClose, periodHistory, cycleLength }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const projected = buildProjectedPeriods(periodHistory, cycleLength);
  const allPeriods = [...(periodHistory || []), ...projected];

  function navMonth(dir) {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Cycle calendar</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Done ✓</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => navMonth(-1)} style={styles.navBtn}>
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
              <TouchableOpacity onPress={() => navMonth(1)} style={styles.navBtn}>
                <Text style={styles.navArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <CalendarMonth
              year={year}
              month={month}
              allPeriods={allPeriods}
              today={today}
            />

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: C.rose }]} />
                <Text style={styles.legendText}>Period (logged)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotProjected]} />
                <Text style={styles.legendText}>Projected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotToday]} />
                <Text style={styles.legendText}>Today</Text>
              </View>
            </View>

            <Text style={styles.footer}>
              Nyla refines projections as it learns your patterns.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 20,
    color: C.espresso,
  },
  closeBtn: {
    fontSize: 13,
    color: C.muted,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navBtn: {
    padding: 8,
  },
  navArrow: {
    fontSize: 24,
    color: C.sand,
  },
  monthTitle: {
    fontFamily: 'serif',
    fontSize: 16,
    color: C.espresso,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayName: {
    fontSize: 10,
    color: C.sand,
    textAlign: 'center',
    paddingVertical: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCirclePeriod: {
    backgroundColor: C.rose,
  },
  dayCircleProjected: {
    backgroundColor: 'rgba(212,112,106,0.15)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.rose,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: C.rose,
  },
  dayText: {
    fontSize: 12,
    color: C.espresso,
  },
  dayTextPeriod: {
    color: '#fff',
    fontWeight: '500',
  },
  dayTextProjected: {
    color: C.rose,
  },
  dayTextToday: {
    color: C.rose,
    fontWeight: '600',
  },
  monthSummary: {
    backgroundColor: C.linen,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  monthSummaryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: C.espresso,
    marginBottom: 3,
  },
  monthSummaryDetail: {
    fontSize: 11,
    color: C.muted,
  },
  monthSummaryEmpty: {
    fontSize: 11,
    color: C.sand,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotProjected: {
    backgroundColor: 'rgba(212,112,106,0.15)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.rose,
  },
  legendDotToday: {
    borderWidth: 2,
    borderColor: C.rose,
    backgroundColor: 'transparent',
  },
  legendText: {
    fontSize: 11,
    color: C.sand,
  },
  footer: {
    fontSize: 11,
    color: C.sand,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});