import { describe, expect, it } from 'vitest';
import type { Target } from '@/entities/nutrition/model/schemas';
import { explainTarget } from '@/features/body/model/explain-target';

const auto: Target = {
  effectiveFrom: '2026-11-27',
  source: 'auto',
  caloriesKcal: 2210,
  proteinG: 136,
  fatG: 61,
  carbsG: 279,
  bmrKcal: 1780,
  tdeeKcal: 2759,
  floorApplied: false,
  inputs: {
    sex: 'male',
    age: 30,
    heightCm: 180,
    weightKg: 80,
    activityLevel: 'moderate',
    goalType: 'lose',
    rateKgPerWeek: 0.5,
    proteinGPerKg: 1.7,
    fatSharePercent: 25,
  },
};

const manual: Target = {
  ...auto,
  source: 'manual',
  bmrKcal: null,
  tdeeKcal: null,
  inputs: null,
};

describe('explainTarget', () => {
  it('chains the basal rate through the activity factor to the goal', () => {
    expect(explainTarget(auto).chain).toEqual({
      bmrKcal: 1780,
      activityFactor: 1.55,
      tdeeKcal: 2759,
      adjustmentKcal: -549,
    });
  });

  it('shares the calories between the macros and the shares add up to 100', () => {
    const { shares } = explainTarget(auto);

    expect(shares).toEqual({
      proteinPercent: 25,
      fatPercent: 25,
      carbsPercent: 50,
    });
  });

  it('gives protein per kilogram of body weight', () => {
    expect(explainTarget(auto).proteinPerKg).toBe(1.7);
    expect(explainTarget(auto).proteinCapped).toBe(false);
  });

  it('says when the cap of 40 percent cut the protein', () => {
    const capped = explainTarget({
      ...auto,
      caloriesKcal: 1000,
      proteinG: 100,
      inputs: auto.inputs && {
        ...auto.inputs,
        weightKg: 150,
        proteinGPerKg: 3,
      },
    });

    expect(capped.proteinCapped).toBe(true);
    expect(capped.proteinPerKg).toBe(0.7);
  });

  it('works for an older target that did not record the protein per kilogram', () => {
    const old = explainTarget({
      ...auto,
      inputs: auto.inputs && {
        sex: auto.inputs.sex,
        age: auto.inputs.age,
        heightCm: auto.inputs.heightCm,
        weightKg: auto.inputs.weightKg,
        activityLevel: auto.inputs.activityLevel,
        goalType: auto.inputs.goalType,
        rateKgPerWeek: auto.inputs.rateKgPerWeek,
      },
    });

    expect(old.proteinCapped).toBe(false);
    expect(old.proteinPerKg).toBe(1.7);
  });

  it('has no chain and no per-kilogram figure for an own target', () => {
    const explained = explainTarget(manual);

    expect(explained.chain).toBeNull();
    expect(explained.inputs).toBeNull();
    expect(explained.proteinPerKg).toBeNull();
    expect(explained.shares.proteinPercent).toBe(25);
  });
});
