import {
  ACTIVITY_FACTORS,
  type Target,
  type TargetInputs,
} from '@/entities/nutrition/model/schemas';

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_FAT = 9;
const PERCENT = 100;
const TENTH = 10;

export interface TargetChain {
  bmrKcal: number;
  activityFactor: number;
  tdeeKcal: number;
  adjustmentKcal: number;
}

export interface TargetShares {
  proteinPercent: number;
  fatPercent: number;
  carbsPercent: number;
}

export interface TargetExplanation {
  inputs: TargetInputs | null;
  chain: TargetChain | null;
  shares: TargetShares;
  proteinPerKg: number | null;
  proteinCapped: boolean;
}

function sharesOf(target: Target): TargetShares {
  const calories = Math.max(target.caloriesKcal, 1);
  const proteinPercent = Math.round(
    ((target.proteinG * KCAL_PER_G_PROTEIN) / calories) * PERCENT,
  );
  const fatPercent = Math.round(
    ((target.fatG * KCAL_PER_G_FAT) / calories) * PERCENT,
  );
  return {
    proteinPercent,
    fatPercent,
    carbsPercent: Math.max(0, PERCENT - proteinPercent - fatPercent),
  };
}

function chainOf(target: Target): TargetChain | null {
  const { bmrKcal, tdeeKcal, inputs } = target;
  if (bmrKcal === null || tdeeKcal === null || inputs === null) {
    return null;
  }
  return {
    bmrKcal,
    activityFactor: ACTIVITY_FACTORS[inputs.activityLevel],
    tdeeKcal,
    adjustmentKcal: target.caloriesKcal - tdeeKcal,
  };
}

function proteinPerKgOf(target: Target): number | null {
  if (target.inputs === null) {
    return null;
  }
  return Math.round((target.proteinG / target.inputs.weightKg) * TENTH) / TENTH;
}

function isCapped(target: Target): boolean {
  const { inputs } = target;
  if (inputs?.proteinGPerKg === undefined) {
    return false;
  }
  return inputs.proteinGPerKg * inputs.weightKg > target.proteinG + 1;
}

export function explainTarget(target: Target): TargetExplanation {
  return {
    inputs: target.inputs,
    chain: chainOf(target),
    shares: sharesOf(target),
    proteinPerKg: proteinPerKgOf(target),
    proteinCapped: isCapped(target),
  };
}
