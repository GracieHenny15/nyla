import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../supabase';
import useCycleState from '../useCycleState';
import { C } from '../constants';

const MEAL_ORDER = ['morning', 'midday', 'evening', 'snack'];
const MEAL_LABELS = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
  snack: 'Snack',
};

const PHASE_LABELS = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
};

// Postgres date_trunc('week', ...) treats Monday as day 1. This mirrors that
// on the JS side so the week_start_date we query for always lines up.
function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // Sunday = 0, Monday = 1, ... Saturday = 6
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toLocaleDateString('en-CA'); // matches the date-format standard used elsewhere in the app
}

function formatDayName(dateStr) {
  const dateObj = new Date(dateStr + 'T00:00:00');
  return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function PlanScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState([]); // plan_data.days, each merged with what was logged
  const [expandedDate, setExpandedDate] = useState(null);
  const { phase, cycleDay } = useCycleState();

  const todayStr = new Date().toLocaleDateString('en-CA');

  const loadPlan = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setDays([]);
      return;
    }

    const weekStart = getMondayOfWeek(new Date());

    const { data: planRow, error: planError } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStart)
      .maybeSingle();

    if (planError || !planRow) {
      setDays([]);
      return;
    }

    const planDays = planRow.plan_data?.days || [];

    // Collect every recipe_id and workout_id referenced across the whole week
    // first, so we can fetch each table ONCE with .in(), instead of firing a
    // separate query per meal per day (that's the classic N+1 query problem).
    const recipeIds = new Set();
    const workoutIds = new Set();
    planDays.forEach((day) => {
      MEAL_ORDER.forEach((key) => {
        const id = day.meals?.[key]?.recipe_id;
        if (id) recipeIds.add(id);
      });
      if (day.movement?.workout_id) workoutIds.add(day.movement.workout_id);
    });

    const [{ data: recipes }, { data: workouts }] = await Promise.all([
      recipeIds.size
        ? supabase.from('recipes').select('*').in('recipe_id', Array.from(recipeIds))
        : Promise.resolve({ data: [] }),
      workoutIds.size
        ? supabase.from('workouts').select('*').in('workout_id', Array.from(workoutIds))
        : Promise.resolve({ data: [] }),
    ]);

    const recipeMap = {};
    (recipes || []).forEach((r) => (recipeMap[r.recipe_id] = r));
    const workoutMap = {};
    (workouts || []).forEach((w) => (workoutMap[w.workout_id] = w));

    // Pull everything actually logged across this plan's date range, so we
    // can compare planned vs logged per day. logged_meals.period already
    // matches morning/midday/evening/snack, and was_swap / was_planned tell
    // us directly whether the person stuck to the plan, no extra columns needed.
    const firstDate = planDays[0]?.date;
    const lastDate = planDays[planDays.length - 1]?.date;

    const [{ data: loggedMeals }, { data: loggedMovement }] = await Promise.all([
      supabase
        .from('logged_meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', firstDate)
        .lte('date', lastDate),
      supabase
        .from('movement_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', firstDate)
        .lte('date', lastDate),
    ]);

    const mealsByDate = {};
    (loggedMeals || []).forEach((m) => {
      if (!mealsByDate[m.date]) mealsByDate[m.date] = [];
      mealsByDate[m.date].push(m);
    });

    const movementByDate = {};
    (loggedMovement || []).forEach((m) => {
      if (!movementByDate[m.date]) movementByDate[m.date] = [];
      movementByDate[m.date].push(m);
    });

    // Merge plan + logs into one shape the render code can use directly.
    const merged = planDays.map((day) => {
      const meals = MEAL_ORDER.map((key) => {
        const planned = day.meals?.[key];
        const recipe = planned?.recipe_id ? recipeMap[planned.recipe_id] : null;
        const loggedEntry = (mealsByDate[day.date] || []).find((m) => m.period === key);
        return {
          key,
          label: MEAL_LABELS[key],
          plannedRecipe: recipe,
          phaseNote: planned?.phase_note || null,
          logged: loggedEntry || null,
        };
      });

      const plannedWorkout = day.movement?.workout_id
        ? workoutMap[day.movement.workout_id]
        : null;
      const loggedMovementEntries = movementByDate[day.date] || [];

      return {
        date: day.date,
        meals,
        plannedWorkout,
        movementPhaseNote: day.movement?.phase_note || null,
        loggedMovement: loggedMovementEntries,
      };
    });

    setDays(merged);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadPlan();
      setLoading(false);
    })();
  }, [loadPlan]);

  async function onRefresh() {
    setRefreshing(true);
    await loadPlan();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.rose} size="large" />
      </View>
    );
  }

  if (!days.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No plan yet for this week</Text>
        <Text style={styles.emptyBody}>
          Once your weekly plan is generated, it will show up here.
        </Text>
      </View>
    );
  }

  const today = days.find((d) => d.date === todayStr);
  const restOfWeek = days.filter((d) => d.date !== todayStr);
  const phaseLabel = PHASE_LABELS[phase] || phase || '';
  const weekLabel = days.length
    ? `Week of ${new Date(days[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    : '';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.rose} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your plan</Text>
        <Text style={styles.headerSubtitle}>
          {weekLabel}{phaseLabel ? ` · ${phaseLabel}` : ''}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Today</Text>
      {today && (
        <View style={[styles.dayCard, styles.dayCardToday]}>
          <View style={styles.dayCardHeader}>
            <Text style={styles.dayName}>{formatDayName(today.date)}</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Today</Text>
            </View>
          </View>
          <Text style={styles.dayPhase}>
            {phaseLabel}{cycleDay ? ` · Day ${cycleDay}` : ''}
          </Text>
          <DayDetail day={today} />
        </View>
      )}

      <Text style={styles.sectionLabel}>This week</Text>
      {restOfWeek.map((day) => (
        <WeekRow
          key={day.date}
          day={day}
          expanded={expandedDate === day.date}
          onToggle={() => setExpandedDate(expandedDate === day.date ? null : day.date)}
        />
      ))}
    </ScrollView>
  );
}

function DayDetail({ day }) {
  return (
    <View>
      {day.meals.map((meal, idx) => (
        <View key={meal.key}>
          {idx > 0 && <View style={styles.divider} />}
          <MealRow meal={meal} />
        </View>
      ))}
      <View style={styles.divider} />
      <MovementRow day={day} />
    </View>
  );
}

function StatusChip({ variant, children }) {
  const chipStyle =
    variant === 'done' ? styles.chipDone : variant === 'swap' ? styles.chipSwap : styles.chipPending;
  const textStyle =
    variant === 'done' ? styles.chipDoneText : variant === 'swap' ? styles.chipSwapText : styles.chipPendingText;
  return (
    <View style={[styles.chip, chipStyle]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}

function MealRow({ meal }) {
  const plannedName = meal.plannedRecipe?.name || 'Recipe planned';
  const logged = meal.logged;

  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemLabel}>{meal.label}</Text>
      <Text style={styles.itemName}>{plannedName}</Text>
      {meal.phaseNote && <Text style={styles.itemNote}>{meal.phaseNote}</Text>}
      <View style={styles.chipRow}>
        {!logged && <StatusChip variant="pending">Not logged yet</StatusChip>}
        {logged && !logged.was_swap && <StatusChip variant="done">Logged as planned</StatusChip>}
        {logged && logged.was_swap && (
          <StatusChip variant="swap">Swapped for {logged.meal_name}</StatusChip>
        )}
      </View>
    </View>
  );
}

function MovementRow({ day }) {
  const plannedName = day.plannedWorkout?.name || 'Movement planned';
  const entries = day.loggedMovement;

  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemLabel}>Movement</Text>
      <Text style={styles.itemName}>{plannedName}</Text>
      {day.movementPhaseNote && <Text style={styles.itemNote}>{day.movementPhaseNote}</Text>}
      <View style={styles.chipRow}>
        {entries.length === 0 && <StatusChip variant="pending">Not logged yet</StatusChip>}
        {entries.map((entry, idx) =>
          entry.was_planned ? (
            <StatusChip key={idx} variant="done">Completed as planned</StatusChip>
          ) : (
            <StatusChip key={idx} variant="swap">Did instead: {entry.category}</StatusChip>
          )
        )}
      </View>
    </View>
  );
}

function WeekRow({ day, expanded, onToggle }) {
  const loggedCount =
    day.meals.filter((m) => m.logged).length + (day.loggedMovement.length > 0 ? 1 : 0);
  const totalCount = day.meals.length + 1;

  return (
    <TouchableOpacity style={styles.dayCard} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.dayCardHeader}>
        <Text style={styles.dayName}>{formatDayName(day.date)}</Text>
        <Text style={styles.dayCount}>{loggedCount}/{totalCount} logged</Text>
      </View>
      {expanded && (
        <>
          <View style={styles.divider} />
          <DayDetail day={day} />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 18,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.espresso,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
  },
  header: {
    marginBottom: 4,
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 24,
    color: C.espresso,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.sand,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.sand,
    marginTop: 18,
    marginBottom: 9,
  },
  dayCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: C.linen,
  },
  dayCardToday: {
    borderColor: C.rose,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.espresso,
  },
  dayBadge: {
    backgroundColor: C.rose,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  dayBadgeText: {
    fontSize: 10,
    color: '#fff',
  },
  dayCount: {
    fontSize: 11,
    color: C.sand,
  },
  dayPhase: {
    fontSize: 11,
    color: C.rose,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: C.linen,
    marginVertical: 6,
  },
  itemRow: {
    paddingVertical: 6,
  },
  itemLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: C.sand,
    marginBottom: 3,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.espresso,
    marginBottom: 2,
  },
  itemNote: {
    fontSize: 11,
    color: C.muted,
    lineHeight: 16,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginTop: 2,
  },
  chipDone: {
    backgroundColor: 'rgba(107,158,150,0.15)',
  },
  chipDoneText: {
    fontSize: 10,
    color: C.teal,
  },
  chipSwap: {
    backgroundColor: 'rgba(193,123,111,0.13)',
  },
  chipSwapText: {
    fontSize: 10,
    color: C.rose,
  },
  chipPending: {
    backgroundColor: C.linen,
  },
  chipPendingText: {
    fontSize: 10,
    color: C.sand,
  },
});