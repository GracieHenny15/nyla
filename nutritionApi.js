const EDAMAM_APP_ID = 'aea5f945';
const EDAMAM_APP_KEY = '1883769d0fe247db4371b12681b34745';

export async function searchFoods(query) {
  if (!query || query.length < 2) return [];

  const url = `https://api.edamam.com/api/food-database/v2/parser?ingr=${encodeURIComponent(query)}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&category=generic-foods&category=generic-meals`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const hints = data.hints || [];

    const results = hints.map((hint) => ({
      foodId: hint.food.foodId,
      description: hint.food.label,
      nutrients: hint.food.nutrients,
    }));

    const seen = new Set();
    const deduped = results.filter((food) => {
      const key = food.description.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped;
  } catch (error) {
    console.log('Error searching foods:', error.message);
    return [];
  }
}

// On the Basic plan, only foodId and food label can be cached.
// Nutrient values are returned live but should not be persisted yet.
export function extractNutrition(food) {
  return {
    food_name: food.description,
    fdc_id: food.foodId, // reusing this column name for Edamam's foodId
    calories: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
  };
}