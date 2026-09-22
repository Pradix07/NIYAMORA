import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Step3Props {
  foodData: {
    ingredients?: Array<{ name: string; percentage?: string }>;
    contains_allergens?: string[];
    may_contain_allergens?: string[];
    veg_non_veg?: 'VEG' | 'NON_VEG' | 'NOT_APPLICABLE';
  };
  nutritionData: {
    basis?: string;
    serving_size?: string;
    nutrients?: Array<{ nutrient_name: string; amount: string; unit: string; rda_percentage?: string }>;
  };
  onFoodChange: (fields: Record<string, any>) => void;
  onNutritionChange: (fields: Record<string, any>) => void;
}

export const Step3FoodInfo: React.FC<Step3Props> = ({
  foodData,
  nutritionData,
  onFoodChange,
  onNutritionChange,
}) => {
  const ingredients = foodData.ingredients || [];
  const nutrients = nutritionData.nutrients || [];

  const handleAddIngredient = () => {
    onFoodChange({
      ingredients: [...ingredients, { name: '', percentage: '' }],
    });
  };

  const handleUpdateIngredient = (index: number, key: 'name' | 'percentage', value: string) => {
    const next = [...ingredients];
    next[index][key] = value;
    onFoodChange({ ingredients: next });
  };

  const handleRemoveIngredient = (index: number) => {
    const next = ingredients.filter((_, i) => i !== index);
    onFoodChange({ ingredients: next });
  };

  const handleUpdateNutrient = (index: number, key: string, value: string) => {
    const next = [...nutrients];
    (next[index] as any)[key] = value;
    onNutritionChange({ nutrients: next });
  };

  const handleAddNutrient = () => {
    onNutritionChange({
      nutrients: [...nutrients, { nutrient_name: '', amount: '', unit: 'g' }],
    });
  };

  const handleRemoveNutrient = (index: number) => {
    const next = nutrients.filter((_, i) => i !== index);
    onNutritionChange({ nutrients: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Step 3: Food & Nutrition Information</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Structured ingredient sequence in descending order of weight, allergen disclosures, and statutory nutrition facts table.
        </p>
      </div>

      {/* Veg / Non-Veg Indicator */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Dietary Symbol (Statutory Veg / Non-Veg Mark)
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { id: 'VEG', label: '100% Vegetarian (Green Dot in Green Square)', color: '#1E7E34' },
            { id: 'NON_VEG', label: 'Non-Vegetarian (Brown Triangle in Brown Square)', color: '#854D0E' },
          ].map((item) => (
            <label
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: foodData.veg_non_veg === item.id ? `2px solid ${item.color}` : '1px solid var(--border-default)',
                backgroundColor: foodData.veg_non_veg === item.id ? 'var(--bg-secondary)' : 'transparent',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <input
                type="radio"
                name="veg_non_veg"
                value={item.id}
                checked={foodData.veg_non_veg === item.id}
                onChange={() => onFoodChange({ veg_non_veg: item.id })}
              />
              <span style={{ color: item.color }}>●</span>
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ingredients List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
            Ingredients List (In descending order of composition)
          </label>
          <button
            type="button"
            onClick={handleAddIngredient}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Add Ingredient
          </button>
        </div>

        {ingredients.length === 0 ? (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No ingredients added yet. Click "Add Ingredient" to list ingredients.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {ingredients.map((ing, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '20px' }}>{idx + 1}.</span>
                <input
                  type="text"
                  placeholder="Ingredient name (e.g. Wheat Flour)"
                  value={ing.name}
                  onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                  style={{ flex: 3, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
                />
                <input
                  type="text"
                  placeholder="Percentage (e.g. 98%)"
                  value={ing.percentage || ''}
                  onChange={(e) => handleUpdateIngredient(idx, 'percentage', e.target.value)}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--status-issue-text)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allergens Declaration */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Allergens (Contains / May Contain)
        </label>
        <input
          type="text"
          placeholder="Enter allergens (e.g. Tree Nuts, Gluten, Soy)"
          value={(foodData.contains_allergens || []).join(', ')}
          onChange={(e) => onFoodChange({ contains_allergens: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
        />
      </div>

      {/* Nutrition Facts Table */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
              Nutritional Information Table
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Values remain strictly separate from package Net Quantity.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={nutritionData.basis || ''}
              onChange={(e) => onNutritionChange({ basis: e.target.value })}
              style={{ padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.75rem', fontWeight: 600 }}
            >
              <option value="" disabled>Select basis</option>
              <option value="Per 100 g">Per 100 g</option>
              <option value="Per 100 ml">Per 100 ml</option>
              <option value="Per Serving (30 g)">Per Serving (30 g)</option>
            </select>
            <button
              type="button"
              onClick={handleAddNutrient}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} /> Add Row
            </button>
          </div>
        </div>

        {nutrients.length === 0 ? (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', backgroundColor: 'var(--bg-primary)' }}>
            No nutrition rows added. Click "Add Row" to enter nutrients (e.g. Energy, Protein, Fat, Carbohydrates).
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {nutrients.map((nut, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Nutrient (e.g. Protein)"
                  value={nut.nutrient_name}
                  onChange={(e) => handleUpdateNutrient(idx, 'nutrient_name', e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
                />
                <input
                  type="text"
                  placeholder="Amount (e.g. 21.2)"
                  value={nut.amount}
                  onChange={(e) => handleUpdateNutrient(idx, 'amount', e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
                />
                <input
                  type="text"
                  placeholder="Unit (g/kcal/mg)"
                  value={nut.unit || 'g'}
                  onChange={(e) => handleUpdateNutrient(idx, 'unit', e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNutrient(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--status-issue-text)', cursor: 'pointer' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
