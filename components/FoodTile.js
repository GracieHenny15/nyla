import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { C } from '../constants';
import { supabase } from '../supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { searchFoods } from '../nutritionApi';

const PORTIONS = ['Small', 'Medium', 'Large', 'Extra large'];
const FEELS = ['Satisfied', 'Unsatisfied'];
const SOURCES = ['Homemade', 'Restaurant'];

const DEFAULT_MEALS = [
  { id: 'morning', period: 'Morning', name: 'Scrambled eggs with spinach & sourdough' },
  { id: 'midday', period: 'Midday', name: 'Lentil soup with crusty bread' },
  { id: 'evening', period: 'Evening', name: 'Salmon with sweet potato & greens' },
  { id: 'snack', period: 'Snack', name: 'Dark chocolate & almonds' },
];

function SwapFlow({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState([]);
  const [source, setSource] = useState(null);
  const [portion, setPortion] = useState(null);
  const [feel, setFeel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  function toggleItem(food) {
    const exists = selected.some((s) => s.foodId === food.foodId);
    if (exists) {
      setSelected(selected.filter((s) => s.foodId !== food.foodId));
    } else {
      setSelected([...selected, food]);
    }
  }

  async function handleSearchChange(text) {
    setSearchQuery(text);
    if (text.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchFoods(text);
    setSearchResults(results.slice(0, 8));
    setSearching(false);
  }

  if (step === 1) {
    return (
      <View>
        <Text style={styles.swapQuestion}>What did you have?</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Type to search foods…"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searching && <Text style={styles.searchingText}>Searching…</Text>}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((food, index) => (
              <TouchableOpacity
                key={`${food.foodId}-${index}`}
                style={styles.searchResultRow}
                onPress={() => toggleItem(food)}
              >
                <Text style={styles.searchResultText}>{food.description}</Text>
                {selected.some((s) => s.foodId === food.foodId) && (
                  <Text style={styles.searchResultCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {selected.length > 0 && (
          <View style={styles.chipGrid}>
            {selected.map((item) => (
              <View key={item.foodId} style={[styles.suggChip, styles.suggChipOn]}>
                <Text style={styles.suggChipTextOn}>{item.description}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.swapActions}>
          <TouchableOpacity style={styles.swapCancelBtn} onPress={onCancel}>
            <Text style={styles.swapCancelText}>Cancel</Text>
          </TouchableOpacity>
          {selected.length > 0 && (
            <TouchableOpacity style={styles.swapNextBtn} onPress={() => setStep(2)}>
              <Text style={styles.swapNextText}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (step === 2) {
    return (
      <View>
        <Text style={styles.swapQuestion}>Homemade or restaurant?</Text>
        <View style={styles.chipGrid}>
          {SOURCES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.suggChip, source === s && styles.suggChipOn]}
              onPress={() => setSource(s)}
            >
              <Text style={[styles.suggChipText, source === s && styles.suggChipTextOn]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.swapActions}>
          <TouchableOpacity style={styles.swapCancelBtn} onPress={() => setStep(1)}>
            <Text style={styles.swapCancelText}>← Back</Text>
          </TouchableOpacity>
          {source && (
            <TouchableOpacity style={styles.swapNextBtn} onPress={() => setStep(3)}>
              <Text style={styles.swapNextText}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (step === 3) {
    return (
      <View>
        <Text style={styles.swapQuestion}>How much did you have?</Text>
        <View style={styles.chipGrid}>
          {PORTIONS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.suggChip, portion === p && styles.suggChipOn]}
              onPress={() => setPortion(p)}
            >
              <Text style={[styles.suggChipText, portion === p && styles.suggChipTextOn]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.swapActions}>
          <TouchableOpacity style={styles.swapCancelBtn} onPress={() => setStep(2)}>
            <Text style={styles.swapCancelText}>← Back</Text>
          </TouchableOpacity>
          {portion && (
            <TouchableOpacity style={styles.swapNextBtn} onPress={() => setStep(4)}>
              <Text style={styles.swapNextText}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (step === 4) {
    return (
      <View>
        <Text style={styles.swapQuestion}>How did it make you feel?</Text>
        <View style={styles.chipGrid}>
          {FEELS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.suggChip, feel === f && styles.suggChipOn]}
              onPress={() => setFeel(f)}
            >
              <Text style={[styles.suggChipText, feel === f && styles.suggChipTextOn]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.swapActions}>
          <TouchableOpacity style={styles.swapCancelBtn} onPress={() => setStep(3)}>
            <Text style={styles.swapCancelText}>← Back</Text>
          </TouchableOpacity>
          {feel && (
            <TouchableOpacity
              style={styles.swapNextBtn}
              onPress={() => onComplete({ items: selected, source, portion, feel })}
            >
              <Text style={styles.swapNextText}>Done ✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
}

function MealRow({ meal, onLog, onSwap, onAddMore }) {
  const [logStep, setLogStep] = useState(null);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [swapping, setSwapping] = useState(false);
  const [addingMore, setAddingMore] = useState(false);

  function startLogging() {
    setSelectedTime(new Date());
    setLogStep('time');
  }

  function handleTimeNext() { setLogStep('feel'); }

  function handleFeelSelect(feel) {
    const time = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogStep(null);
    onLog(time, feel);
  }

  if (swapping || addingMore) {
    return (
      <View style={styles.mealRow}>
        <Text style={styles.mealPeriod}>{meal.period}</Text>
        <Text style={styles.mealName}>{meal.name}</Text>
        <View style={styles.swapDivider} />
        <SwapFlow
          onComplete={(data) => {
            if (addingMore) onAddMore(data);
            else onSwap(data);
            setSwapping(false);
            setAddingMore(false);
          }}
          onCancel={() => { setSwapping(false); setAddingMore(false); }}
        />
      </View>
    );
  }

  if (logStep === 'time') {
    return (
      <View style={styles.mealRow}>
        <Text style={styles.mealPeriod}>{meal.period}</Text>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.timeQuestion}>What time did you eat this?</Text>
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="spinner"
          onChange={(event, date) => { if (date) setSelectedTime(date); }}
          textColor="#fff"
        />
        <View style={styles.swapActions}>
          <TouchableOpacity style={styles.swapCancelBtn} onPress={() => setLogStep(null)}>
            <Text style={styles.swapCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.swapNextBtn} onPress={handleTimeNext}>
            <Text style={styles.swapNextText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (logStep === 'feel') {
    return (
      <View style={styles.mealRow}>
        <Text style={styles.mealPeriod}>{meal.period}</Text>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.swapQuestion}>How did it make you feel?</Text>
        <View style={styles.chipGrid}>
          {FEELS.map((f) => (
            <TouchableOpacity key={f} style={styles.suggChip} onPress={() => handleFeelSelect(f)}>
              <Text style={styles.suggChipText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.swapCancelBtn} onPress={() => setLogStep('time')}>
          <Text style={styles.swapCancelText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mealRow}>
      <Text style={styles.mealPeriod}>{meal.period}</Text>
      <Text style={styles.mealName}>{meal.name}</Text>
      {meal.logged ? (
        <View>
          <Text style={styles.loggedText}>✓ Logged at {meal.loggedTime}</Text>
          {meal.extras && meal.extras.length > 0 && (
            <Text style={styles.extrasText}>
              + {meal.extras.map(e => e.items.map(i => i.description).join(', ')).join(', ')}
            </Text>
          )}
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => setAddingMore(true)}>
            <Text style={styles.addMoreText}>+ Add more</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mealActions}>
          <TouchableOpacity style={styles.logBtn} onPress={startLogging}>
            <Text style={styles.logBtnText}>I ate this</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.swapBtnSmall} onPress={() => setSwapping(true)}>
            <Text style={styles.swapBtnSmallText}>Swap</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function FoodTile() {
  const [expanded, setExpanded] = useState(false);
  const [meals, setMeals] = useState(DEFAULT_MEALS);
  const [extraMeals, setExtraMeals] = useState([]);

  const loggedCount = meals.filter((m) => m.logged).length + extraMeals.filter((m) => m.logged).length;

  async function handleLog(id, time, feel) {
    const meal = meals.find((m) => m.id === id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('logged_meals').insert({
      user_id: user.id,
      date: new Date().toLocaleDateString('en-CA'),
      period: meal.period,
      meal_name: meal.name,
      feel,
      was_swap: false,
      logged_at: new Date().toISOString(),
    });
    if (error) { console.log('Error logging meal:', error.message); return; }
    setMeals(meals.map((m) =>
      m.id === id ? { ...m, logged: true, loggedTime: time} : m
    ));
  }

  async function handleSwap(id, data) {
    const meal = meals.find((m) => m.id === id);
    const newName = data.items.map((item) => item.description).join(', ');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('logged_meals').insert({
      user_id: user.id,
      date: new Date().toLocaleDateString('en-CA'),
      period: meal.period,
      meal_name: newName,
      source: data.source,
      portion: data.portion,
      feel: data.feel,
      was_swap: true,
      logged_at: new Date().toISOString(),
    });
    if (error) { console.log('Error logging swap:', error.message); return; }
    setMeals(meals.map((m) =>
      m.id === id ? { ...m, logged: true, loggedTime: time, name: newName} : m
    ));
  }

  async function handleAddMore(id, data) {
    const meal = meals.find((m) => m.id === id);
    const newName = data.items.map((item) => item.description).join(', ');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('logged_meals').insert({
      user_id: user.id,
      date: new Date().toLocaleDateString('en-CA'),
      period: meal.period,
      meal_name: newName,
      source: data.source,
      portion: data.portion,
      feel: data.feel,
      was_swap: true,
      logged_at: new Date().toISOString(),
    });
    if (error) { console.log('Error logging add-more:', error.message); return; }
    setMeals(meals.map((m) =>
      m.id === id ? { ...m, extras: [...(m.extras || []), data] } : m
    ));
  }

  async function handleExtraLog(id, time, feel) {
    const meal = extraMeals.find((m) => m.id === id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('logged_meals').insert({
      user_id: user.id,
      date: new Date().toLocaleDateString('en-CA'),
      period: meal.period,
      meal_name: meal.name,
      feel,
      was_swap: false,
      logged_at: new Date().toISOString(),
    });
    if (error) { console.log('Error logging extra meal:', error.message); return; }
    setExtraMeals(extraMeals.map((m) =>
      m.id === id ? { ...m, logged: true, loggedTime: time} : m
    ));
  }

  async function handleExtraSwap(id, data) {
    const meal = extraMeals.find((m) => m.id === id);
    const newName = data.items.map((item) => item.description).join(', ');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('logged_meals').insert({
      user_id: user.id,
      date: new Date().toLocaleDateString('en-CA'),
      period: meal.period,
      meal_name: newName,
      source: data.source,
      portion: data.portion,
      feel: data.feel,
      was_swap: true,
      logged_at: new Date().toISOString(),
    });
    if (error) { console.log('Error logging extra swap:', error.message); return; }
    setExtraMeals(extraMeals.map((m) =>
      m.id === id ? { ...m, logged: true, loggedTime: time, name: newName} : m
    ));
  }

  async function handleExtraAddMore(id, data) {
    const meal = extraMeals.find((m) => m.id === id);
    const newName = data.items.map((item) => item.description).join(', ');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('logged_meals').insert({
      user_id: user.id,
      date: new Date().toLocaleDateString('en-CA'),
      period: meal.period,
      meal_name: newName,
      source: data.source,
      portion: data.portion,
      feel: data.feel,
      was_swap: true,
      logged_at: new Date().toISOString(),
    });
    if (error) { console.log('Error logging extra add-more:', error.message); return; }
    setExtraMeals(extraMeals.map((m) =>
      m.id === id ? { ...m, extras: [...(m.extras || []), data] } : m
    ));
  }

  function addExtraMeal() {
    const id = `extra-${Date.now()}`;
    setExtraMeals([...extraMeals, { id, period: 'Extra', name: 'What did you have?' }]);
  }

  return (
    <View style={styles.wrapper}>
      {/* Compact square tile */}
      <TouchableOpacity style={styles.tile} onPress={() => setExpanded(true)} activeOpacity={0.8}>
        <Text style={styles.icon}>🍎</Text>
        <Text style={styles.label}>Food</Text>
        <Text style={styles.val}>
          {loggedCount > 0 ? `${loggedCount} logged` : 'Log a meal'}
        </Text>
      </TouchableOpacity>

      {/* Full-screen modal panel */}
      <Modal
        visible={expanded}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Log a meal</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={styles.doneBtn}>Done ✓</Text>
              </TouchableOpacity>
            </View>

            {meals.map((meal) => (
              <MealRow
                key={meal.id}
                meal={meal}
                onLog={(time, feel) => handleLog(meal.id, time, feel)}
                onSwap={(data) => handleSwap(meal.id, data)}
                onAddMore={(data) => handleAddMore(meal.id, data)}
              />
            ))}

            {extraMeals.map((meal) => (
              <MealRow
                key={meal.id}
                meal={meal}
                onLog={(time, feel) => handleExtraLog(meal.id, time, feel)}
                onSwap={(data) => handleExtraSwap(meal.id, data)}
                onAddMore={(data) => handleExtraAddMore(meal.id, data)}
              />
            ))}

            <TouchableOpacity style={styles.addSomethingElse} onPress={addExtraMeal}>
              <Text style={styles.addSomethingElseText}>+ Add something else</Text>
            </TouchableOpacity>
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
    backgroundColor: '#F8D8C8',
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
    color: '#C05040',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  val: {
    fontSize: 11,
    color: '#C05040',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#D4806A',
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
  mealRow: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mealPeriod: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 18,
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  logBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  logBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  swapBtnSmall: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  swapBtnSmallText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  loggedText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  extrasText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  addMoreBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  addMoreText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  timeQuestion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  swapDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 10,
  },
  swapQuestion: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  suggChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  suggChipOn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  suggChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  suggChipTextOn: {
    color: '#fff',
    fontWeight: '500',
  },
  swapActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  swapCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 9,
    alignItems: 'center',
  },
  swapCancelText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  swapNextBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    padding: 9,
    alignItems: 'center',
  },
  swapNextText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  addSomethingElse: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addSomethingElseText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  searchResults: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  searchResultText: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  searchResultCheck: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});