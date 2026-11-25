const EXAMPLES: Readonly<Record<string, string>> = {
  chest: 'barbell_bench_press_-_medium_grip',
  lats: 'pullups',
  upper_back: 'bent_over_barbell_row',
  lower_back: 'hyperextensions_back_extensions',
  traps: 'barbell_shrug',
  shoulders: 'dumbbell_shoulder_press',
  biceps: 'barbell_curl',
  triceps: 'triceps_pushdown',
  forearms: 'wrist_roller',
  abdominals: 'crunches',
  quadriceps: 'leg_extensions',
  hamstrings: 'lying_leg_curls',
  glutes: 'barbell_glute_bridge',
  calves: 'standing_calf_raises',
  adductors: 'thigh_adductor',
  abductors: 'thigh_abductor',
  neck: 'neck_press',
  cardio: 'jogging_treadmill',
  none: 'pushups',
  barbell: 'barbell_squat',
  ez_bar: 'ez-bar_curl',
  trap_bar: 'trap_bar_deadlift',
  dumbbell: 'dumbbell_bench_press',
  kettlebell: 'kettlebell_thruster',
  plate: 'plate_twist',
  machine: 'leg_press',
  cable: 'cable_crossover',
  smith_machine: 'smith_machine_squat',
  band: 'band_pull_apart',
  medicine_ball: 'medicine_ball_chest_pass',
  exercise_ball: 'ball_leg_curl',
  foam_roll: 'quadriceps-smr',
};

export function filterImage(id: string): string | null {
  const folder = EXAMPLES[id];
  return folder ? `/exercises/${folder}/0.webp` : null;
}
