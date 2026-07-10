import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { getCycleDay, getPhaseForDay, PHASES } from './cycleUtils';

export default function useCycleState() {
  const [cycleState, setCycleState] = useState({
    phase: 'luteal',
    cycleDay: null,
    cycleLength: 28,
    isOnPeriod: false,
    periodStartDate: null,
    loading: true,
  });

  useEffect(() => {
    loadCycleState();
  }, []);

  async function loadCycleState() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('cycle_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.log('Error loading cycle state:', error.message);
      setCycleState((prev) => ({ ...prev, loading: false }));
      return;
    }

    if (!data) {
      // No cycle state yet -- user hasn't set up cycle info
      setCycleState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const cycleDay = getCycleDay(data.period_start_date);
    const phase = cycleDay ? getPhaseForDay(cycleDay, data.average_cycle_length) : 'luteal';

    setCycleState({
      phase,
      cycleDay,
      cycleLength: data.average_cycle_length || 28,
      isOnPeriod: data.is_on_period || false,
      periodStartDate: data.period_start_date,
      loading: false,
    });
  }

  async function markPeriodStarted() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');

    // Insert into period history
    await supabase.from('period_history').insert({
      user_id: user.id,
      period_start_date: today,
      source: 'logged',
    });

    // Update cycle state
    const { error } = await supabase
      .from('cycle_state')
      .upsert({
        user_id: user.id,
        period_start_date: today,
        is_on_period: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) { console.log('Error updating cycle state:', error.message); return; }

    setCycleState((prev) => ({
      ...prev,
      phase: 'menstrual',
      cycleDay: 1,
      isOnPeriod: true,
      periodStartDate: today,
    }));
  }

  async function markPeriodEnded() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toLocaleDateString('en-CA');

    // Update period history with end date
    if (cycleState.periodStartDate) {
      await supabase
        .from('period_history')
        .update({ period_end_date: today })
        .eq('user_id', user.id)
        .eq('period_start_date', cycleState.periodStartDate);
    }

    // Update cycle state
    const { error } = await supabase
      .from('cycle_state')
      .update({ is_on_period: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) { console.log('Error marking period ended:', error.message); return; }

    const cycleDay = getCycleDay(cycleState.periodStartDate);
    const phase = getPhaseForDay(cycleDay, cycleState.cycleLength);

    setCycleState((prev) => ({
      ...prev,
      phase,
      isOnPeriod: false,
    }));
  }

  async function updateCycleLength(newLength) {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('cycle_state')
      .update({ average_cycle_length: newLength, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) { console.log('Error updating cycle length:', error.message); return; }

    setCycleState((prev) => ({ ...prev, cycleLength: newLength }));
  }

  return {
    ...cycleState,
    phaseData: PHASES[cycleState.phase],
    markPeriodStarted,
    markPeriodEnded,
    updateCycleLength,
    reload: loadCycleState,
  };
}