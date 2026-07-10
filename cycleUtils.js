// Phase definitions
export const PHASES = {
  menstrual: {
    name: 'Menstrual',
    days: 'Days 1–5',
    color: '#C17B6F',
    tagline: 'Your body is working hard. Prioritize rest and recovery.',
    whyYouFeel: 'Estrogen and progesterone are both at their lowest. Your body is shedding the uterine lining, which takes real energy. Fatigue, cramps, and inward feelings are completely normal right now.',
    energy: 1,
    cravings: 3,
    mood: 2,
    sleep: 2,
  },
  follicular: {
    name: 'Follicular',
    days: 'Days 6–13',
    color: '#6B9E96',
    tagline: 'Energy is rising; time to push and try new things.',
    whyYouFeel: 'Estrogen is rising steadily. Your brain is sharper, your mood is lifting, and your body is building toward ovulation. This is your highest energy window of the month.',
    energy: 4,
    cravings: 2,
    mood: 4,
    sleep: 4,
  },
  ovulation: {
    name: 'Ovulation',
    days: 'Days 14–16',
    color: '#D4924A',
    tagline: 'Your strongest period, take advantage of it.',
    whyYouFeel: 'Estrogen peaks and LH surges to trigger ovulation. You\'re at your most energetic, social, and confident. Your body is doing exactly what it\'s designed to do.',
    energy: 5,
    cravings: 1,
    mood: 5,
    sleep: 4,
  },
  luteal: {
    name: 'Luteal',
    days: 'Days 17–28',
    color: '#A84060',
    tagline: 'Warmth, routine, and rest are your friends right now.',
    whyYouFeel: 'Progesterone rises after ovulation, then both hormones drop as your period approaches. Energy dips, cravings increase, and you may feel more inward or emotional. This is real -- not in your head.',
    energy: 2,
    cravings: 4,
    mood: 3,
    sleep: 3,
  },
};

// Calculate current phase from cycle day
export function getPhaseForDay(cycleDay, cycleLength = 28) {
  if (cycleDay <= 5) return 'menstrual';
  if (cycleDay <= Math.round(cycleLength * 0.46)) return 'follicular';
  if (cycleDay <= Math.round(cycleLength * 0.57)) return 'ovulation';
  return 'luteal';
}

// Calculate cycle day from period start date
export function getCycleDay(periodStartDate) {
  if (!periodStartDate) return null;
  const today = new Date().toLocaleDateString('en-CA');
  const [ty, tm, td] = today.split('-').map(Number);
  const [sy, sm, sd] = periodStartDate.split('-').map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const diffDays = Math.round((todayMs - startMs) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

// Calculate average cycle length from period history
export function calcAverageCycleLength(periodDates) {
  if (!periodDates || periodDates.length < 2) return 28;
  const sorted = [...periodDates].sort((a, b) => new Date(a) - new Date(b));
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const gap = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (gap >= 21 && gap <= 45) gaps.push(gap); // filter out outliers
  }
  if (gaps.length === 0) return 28;
  return Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length);
}

// Get days until next period
export function getDaysUntilPeriod(cycleDay, cycleLength = 28) {
  return Math.max(0, cycleLength - cycleDay);
}

// Get what's coming next (the next phases in order)
export function getUpcomingPhases(currentPhase, cycleDay, cycleLength = 28) {
  const phaseOrder = ['menstrual', 'follicular', 'ovulation', 'luteal'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const upcoming = [];

  for (let i = 1; i <= 3; i++) {
    const nextIndex = (currentIndex + i) % 4;
    const phase = phaseOrder[nextIndex];
    upcoming.push(phase);
  }

  return upcoming;
}