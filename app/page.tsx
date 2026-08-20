"use client";

import { useEffect, useMemo, useState } from "react";

type Goal = "Build muscle" | "Get stronger" | "Lose fat" | "Move better";
type Experience = "Beginner" | "Intermediate" | "Advanced";
type Equipment = "Full gym" | "Dumbbells only" | "Bodyweight";
type View = "dashboard" | "plan" | "library" | "workout" | "progress" | "coach";
type ProgressRange = "4w" | "12w" | "all";
type TrainingType =
  | "upper"
  | "lower"
  | "push"
  | "pull"
  | "full"
  | "conditioning"
  | "mobility";
type DayAssignment = TrainingType | "rest";
type SetTechnique = "straight" | "superset" | "drop-set";

type DropSetStage = {
  weight: string;
  reps: string;
};

type Profile = {
  goal: Goal;
  experience: Experience;
  days: number;
  equipment: Equipment;
};

type Exercise = {
  name: string;
  sets: string;
  focus: string;
  setCount?: string;
  reps?: string;
  weight?: string;
  rest?: string;
  technique?: SetTechnique;
  dropSetStages?: DropSetStage[];
};

type LibraryExercise = Exercise & {
  id: string;
  equipment: string;
  difficulty: Experience;
};

type Workout = {
  day: string;
  title: string;
  duration: number;
  exercises: Exercise[];
  accent: string;
  type?: TrainingType;
};

type Recommendation = {
  name: string;
  summary: string;
  reason: string;
  workouts: Workout[];
};

type WorkoutLog = {
  id: number;
  workoutName: string;
  duration: number;
  exercisesCompleted: number;
  totalExercises: number;
  performedAt: string;
  note?: string;
  sets?: Array<{
    exerciseName: string;
    setNumber?: number;
    weight: number;
    reps: number;
  }>;
};

type BodyWeightLog = {
  id: number;
  weight: number;
  recordedAt: string;
};

type AccountSync = {
  signedIn: boolean;
  displayName: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type QueuedMutation = {
  id: string;
  payload: Record<string, unknown>;
};

type WorkoutDraft = {
  workoutDay: string;
  workoutTitle: string;
  entries: Record<string, { reps: string }>;
  completed: Record<string, boolean>;
  elapsedSeconds: number;
  paused: boolean;
  note: string;
  timerEndsAt: number | null;
  timerLabel: string;
  savedAt: number;
};

type CompletedWorkoutSummary = {
  workoutName: string;
  duration: number;
  completedSets: number;
  volume: number;
  personalRecords: string[];
  note: string;
  pendingSync?: boolean;
};

type RestAlerts = {
  sound: boolean;
  vibration: boolean;
  notification: boolean;
};

const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const techniqueOptions: Array<{ value: SetTechnique; label: string }> = [
  { value: "straight", label: "Straight sets" },
  { value: "superset", label: "Superset with next" },
  { value: "drop-set", label: "Drop set" },
];
const MAX_DRAFT_IDLE_SECONDS = 2 * 60 * 60;
const MAX_WORKOUT_SESSION_SECONDS = 6 * 60 * 60;

const exerciseLibrary = {
  upper: [
    ["Incline press", "3 × 8–10", "Chest"],
    ["Seated cable row", "3 × 10–12", "Back"],
    ["Shoulder press", "3 × 8–10", "Shoulders"],
    ["Lat pulldown", "3 × 10–12", "Back"],
    ["Cable curl + pressdown", "2 × 12", "Arms"],
  ],
  lower: [
    ["Back squat", "4 × 6–8", "Quads"],
    ["Romanian deadlift", "3 × 8–10", "Hamstrings"],
    ["Walking lunge", "3 × 10 / side", "Legs"],
    ["Leg curl", "3 × 12", "Hamstrings"],
    ["Standing calf raise", "3 × 15", "Calves"],
  ],
  push: [
    ["Bench press", "4 × 6–8", "Chest"],
    ["Dumbbell shoulder press", "3 × 8–10", "Shoulders"],
    ["Incline dumbbell press", "3 × 10", "Chest"],
    ["Lateral raise", "3 × 12–15", "Shoulders"],
    ["Rope pressdown", "3 × 12", "Triceps"],
  ],
  pull: [
    ["Romanian deadlift", "3 × 6–8", "Posterior chain"],
    ["Chest-supported row", "4 × 8–10", "Back"],
    ["Lat pulldown", "3 × 10", "Lats"],
    ["Face pull", "3 × 15", "Rear delts"],
    ["Hammer curl", "3 × 12", "Biceps"],
  ],
  full: [
    ["Goblet squat", "3 × 10", "Legs"],
    ["Dumbbell bench press", "3 × 8–10", "Chest"],
    ["One-arm row", "3 × 10 / side", "Back"],
    ["Hip hinge", "3 × 10", "Hamstrings"],
    ["Dead bug", "3 × 8 / side", "Core"],
  ],
  conditioning: [
    ["Kettlebell swing", "4 × 12", "Power"],
    ["Push-up", "3 × 8–12", "Upper body"],
    ["Reverse lunge", "3 × 10 / side", "Legs"],
    ["Bike intervals", "8 × 30 sec", "Cardio"],
    ["Farmer carry", "4 × 30 m", "Core"],
  ],
  mobility: [
    ["90/90 hip switch", "3 × 8 / side", "Hips"],
    ["World’s greatest stretch", "2 × 6 / side", "Full body"],
    ["Tempo goblet squat", "3 × 8", "Legs"],
    ["Half-kneeling press", "3 × 10", "Shoulders"],
    ["Suitcase carry", "3 × 30 m", "Core"],
  ],
} satisfies Record<string, string[][]>;

const exerciseCatalog: LibraryExercise[] = [
  { id: "bench-press", name: "Bench press", focus: "Chest", equipment: "Barbell", difficulty: "Intermediate", sets: "4 × 6–8", setCount: "4", reps: "6–8", rest: "2 min" },
  { id: "incline-dumbbell-press", name: "Incline dumbbell press", focus: "Chest", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 8–10", setCount: "3", reps: "8–10", rest: "90 sec" },
  { id: "dumbbell-bench-press", name: "Dumbbell bench press", focus: "Chest", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 8–12", setCount: "3", reps: "8–12", rest: "90 sec" },
  { id: "machine-chest-press", name: "Machine chest press", focus: "Chest", equipment: "Machine", difficulty: "Beginner", sets: "3 × 10–12", setCount: "3", reps: "10–12", rest: "90 sec" },
  { id: "push-up", name: "Push-up", focus: "Chest", equipment: "Bodyweight", difficulty: "Beginner", sets: "3 × 8–15", setCount: "3", reps: "8–15", rest: "60 sec" },
  { id: "cable-fly", name: "Cable fly", focus: "Chest", equipment: "Cable", difficulty: "Beginner", sets: "3 × 12–15", setCount: "3", reps: "12–15", rest: "60 sec" },
  { id: "lat-pulldown", name: "Lat pulldown", focus: "Back", equipment: "Cable", difficulty: "Beginner", sets: "3 × 8–12", setCount: "3", reps: "8–12", rest: "90 sec" },
  { id: "pull-up", name: "Pull-up", focus: "Back", equipment: "Bodyweight", difficulty: "Intermediate", sets: "3 × 5–10", setCount: "3", reps: "5–10", rest: "2 min" },
  { id: "seated-cable-row", name: "Seated cable row", focus: "Back", equipment: "Cable", difficulty: "Beginner", sets: "3 × 10–12", setCount: "3", reps: "10–12", rest: "90 sec" },
  { id: "one-arm-row", name: "One-arm dumbbell row", focus: "Back", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 10 / side", setCount: "3", reps: "10 / side", rest: "90 sec" },
  { id: "chest-supported-row", name: "Chest-supported row", focus: "Back", equipment: "Dumbbells", difficulty: "Beginner", sets: "4 × 8–10", setCount: "4", reps: "8–10", rest: "90 sec" },
  { id: "face-pull", name: "Face pull", focus: "Back", equipment: "Cable", difficulty: "Beginner", sets: "3 × 12–15", setCount: "3", reps: "12–15", rest: "60 sec" },
  { id: "overhead-press", name: "Overhead press", focus: "Shoulders", equipment: "Barbell", difficulty: "Intermediate", sets: "4 × 6–8", setCount: "4", reps: "6–8", rest: "2 min" },
  { id: "dumbbell-shoulder-press", name: "Dumbbell shoulder press", focus: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 8–10", setCount: "3", reps: "8–10", rest: "90 sec" },
  { id: "arnold-press", name: "Arnold press", focus: "Shoulders", equipment: "Dumbbells", difficulty: "Intermediate", sets: "3 × 8–12", setCount: "3", reps: "8–12", rest: "90 sec" },
  { id: "lateral-raise", name: "Lateral raise", focus: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 12–15", setCount: "3", reps: "12–15", rest: "60 sec" },
  { id: "reverse-fly", name: "Reverse fly", focus: "Shoulders", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 12–15", setCount: "3", reps: "12–15", rest: "60 sec" },
  { id: "barbell-curl", name: "Barbell curl", focus: "Biceps", equipment: "Barbell", difficulty: "Beginner", sets: "3 × 8–12", setCount: "3", reps: "8–12", rest: "60 sec" },
  { id: "dumbbell-curl", name: "Dumbbell curl", focus: "Biceps", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 10–12", setCount: "3", reps: "10–12", rest: "60 sec" },
  { id: "hammer-curl", name: "Hammer curl", focus: "Biceps", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 10–12", setCount: "3", reps: "10–12", rest: "60 sec" },
  { id: "cable-curl", name: "Cable curl", focus: "Biceps", equipment: "Cable", difficulty: "Beginner", sets: "3 × 12–15", setCount: "3", reps: "12–15", rest: "60 sec" },
  { id: "rope-pressdown", name: "Rope pressdown", focus: "Triceps", equipment: "Cable", difficulty: "Beginner", sets: "3 × 10–15", setCount: "3", reps: "10–15", rest: "60 sec" },
  { id: "overhead-triceps-extension", name: "Overhead triceps extension", focus: "Triceps", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 10–12", setCount: "3", reps: "10–12", rest: "60 sec" },
  { id: "close-grip-bench", name: "Close-grip bench press", focus: "Triceps", equipment: "Barbell", difficulty: "Intermediate", sets: "3 × 6–10", setCount: "3", reps: "6–10", rest: "2 min" },
  { id: "bench-dip", name: "Bench dip", focus: "Triceps", equipment: "Bodyweight", difficulty: "Beginner", sets: "3 × 8–12", setCount: "3", reps: "8–12", rest: "60 sec" },
  { id: "back-squat", name: "Back squat", focus: "Quads", equipment: "Barbell", difficulty: "Intermediate", sets: "4 × 6–8", setCount: "4", reps: "6–8", rest: "3 min" },
  { id: "front-squat", name: "Front squat", focus: "Quads", equipment: "Barbell", difficulty: "Advanced", sets: "3 × 6–8", setCount: "3", reps: "6–8", rest: "3 min" },
  { id: "goblet-squat", name: "Goblet squat", focus: "Quads", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 10–12", setCount: "3", reps: "10–12", rest: "90 sec" },
  { id: "leg-press", name: "Leg press", focus: "Quads", equipment: "Machine", difficulty: "Beginner", sets: "4 × 8–12", setCount: "4", reps: "8–12", rest: "2 min" },
  { id: "walking-lunge", name: "Walking lunge", focus: "Quads", equipment: "Dumbbells", difficulty: "Intermediate", sets: "3 × 10 / side", setCount: "3", reps: "10 / side", rest: "90 sec" },
  { id: "bulgarian-split-squat", name: "Bulgarian split squat", focus: "Quads", equipment: "Dumbbells", difficulty: "Intermediate", sets: "3 × 8 / side", setCount: "3", reps: "8 / side", rest: "90 sec" },
  { id: "leg-extension", name: "Leg extension", focus: "Quads", equipment: "Machine", difficulty: "Beginner", sets: "3 × 12–15", setCount: "3", reps: "12–15", rest: "60 sec" },
  { id: "romanian-deadlift", name: "Romanian deadlift", focus: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate", sets: "3 × 8–10", setCount: "3", reps: "8–10", rest: "2 min" },
  { id: "dumbbell-rdl", name: "Dumbbell Romanian deadlift", focus: "Hamstrings", equipment: "Dumbbells", difficulty: "Beginner", sets: "3 × 10–12", setCount: "3", reps: "10–12", rest: "90 sec" },
  { id: "leg-curl", name: "Leg curl", focus: "Hamstrings", equipment: "Machine", difficulty: "Beginner", sets: "3 × 10–15", setCount: "3", reps: "10–15", rest: "60 sec" },
  { id: "conventional-deadlift", name: "Conventional deadlift", focus: "Hamstrings", equipment: "Barbell", difficulty: "Advanced", sets: "3 × 3–6", setCount: "3", reps: "3–6", rest: "3 min" },
  { id: "hip-thrust", name: "Hip thrust", focus: "Glutes", equipment: "Barbell", difficulty: "Intermediate", sets: "4 × 8–12", setCount: "4", reps: "8–12", rest: "2 min" },
  { id: "glute-bridge", name: "Glute bridge", focus: "Glutes", equipment: "Bodyweight", difficulty: "Beginner", sets: "3 × 12–15", setCount: "3", reps: "12–15", rest: "60 sec" },
  { id: "cable-kickback", name: "Cable kickback", focus: "Glutes", equipment: "Cable", difficulty: "Beginner", sets: "3 × 12 / side", setCount: "3", reps: "12 / side", rest: "60 sec" },
  { id: "standing-calf-raise", name: "Standing calf raise", focus: "Calves", equipment: "Machine", difficulty: "Beginner", sets: "4 × 12–15", setCount: "4", reps: "12–15", rest: "60 sec" },
  { id: "seated-calf-raise", name: "Seated calf raise", focus: "Calves", equipment: "Machine", difficulty: "Beginner", sets: "3 × 12–20", setCount: "3", reps: "12–20", rest: "60 sec" },
  { id: "plank", name: "Plank", focus: "Core", equipment: "Bodyweight", difficulty: "Beginner", sets: "3 × 30–60 sec", setCount: "3", reps: "30–60 sec", rest: "60 sec" },
  { id: "dead-bug", name: "Dead bug", focus: "Core", equipment: "Bodyweight", difficulty: "Beginner", sets: "3 × 8 / side", setCount: "3", reps: "8 / side", rest: "60 sec" },
  { id: "hanging-knee-raise", name: "Hanging knee raise", focus: "Core", equipment: "Bodyweight", difficulty: "Intermediate", sets: "3 × 8–12", setCount: "3", reps: "8–12", rest: "60 sec" },
  { id: "cable-crunch", name: "Cable crunch", focus: "Core", equipment: "Cable", difficulty: "Beginner", sets: "3 × 12–15", setCount: "3", reps: "12–15", rest: "60 sec" },
  { id: "pallof-press", name: "Pallof press", focus: "Core", equipment: "Cable", difficulty: "Beginner", sets: "3 × 10 / side", setCount: "3", reps: "10 / side", rest: "60 sec" },
  { id: "kettlebell-swing", name: "Kettlebell swing", focus: "Full body", equipment: "Kettlebell", difficulty: "Intermediate", sets: "4 × 12", setCount: "4", reps: "12", rest: "60 sec" },
  { id: "farmer-carry", name: "Farmer carry", focus: "Full body", equipment: "Dumbbells", difficulty: "Beginner", sets: "4 × 30 m", setCount: "4", reps: "30 m", rest: "60 sec" },
  { id: "bike-intervals", name: "Bike intervals", focus: "Cardio", equipment: "Cardio", difficulty: "Beginner", sets: "8 × 30 sec", setCount: "8", reps: "30 sec", rest: "60 sec" },
  { id: "rowing-intervals", name: "Rowing intervals", focus: "Cardio", equipment: "Cardio", difficulty: "Intermediate", sets: "6 × 1 min", setCount: "6", reps: "1 min", rest: "60 sec" },
  { id: "burpee", name: "Burpee", focus: "Full body", equipment: "Bodyweight", difficulty: "Intermediate", sets: "3 × 10", setCount: "3", reps: "10", rest: "60 sec" },
  { id: "band-pull-apart", name: "Band pull-apart", focus: "Shoulders", equipment: "Bands", difficulty: "Beginner", sets: "3 × 15", setCount: "3", reps: "15", rest: "45 sec" },
  { id: "ninety-ninety", name: "90/90 hip switch", focus: "Mobility", equipment: "Bodyweight", difficulty: "Beginner", sets: "3 × 8 / side", setCount: "3", reps: "8 / side", rest: "30 sec" },
  { id: "worlds-greatest-stretch", name: "World’s greatest stretch", focus: "Mobility", equipment: "Bodyweight", difficulty: "Beginner", sets: "2 × 6 / side", setCount: "2", reps: "6 / side", rest: "30 sec" },
  { id: "cat-cow", name: "Cat-cow", focus: "Mobility", equipment: "Bodyweight", difficulty: "Beginner", sets: "2 × 8", setCount: "2", reps: "8", rest: "30 sec" },
];

const catalogMuscles = ["All", ...Array.from(new Set(exerciseCatalog.map((exercise) => exercise.focus)))];
const catalogEquipment = ["All", ...Array.from(new Set(exerciseCatalog.map((exercise) => exercise.equipment)))];

const trainingOptions: Array<{
  value: DayAssignment;
  label: string;
  note: string;
}> = [
  { value: "rest", label: "Rest day", note: "Recovery" },
  { value: "push", label: "Push", note: "Chest, shoulders, triceps" },
  { value: "pull", label: "Pull", note: "Back, rear delts, biceps" },
  { value: "lower", label: "Legs", note: "Quads, hamstrings, calves" },
  { value: "upper", label: "Upper body", note: "Balanced upper-body session" },
  { value: "full", label: "Full body", note: "One movement for every area" },
  { value: "conditioning", label: "Conditioning", note: "Fitness and work capacity" },
  { value: "mobility", label: "Mobility", note: "Move and recover better" },
];

const manualTitles: Record<TrainingType, string> = {
  upper: "Upper body",
  lower: "Legs",
  push: "Push",
  pull: "Pull",
  full: "Full body",
  conditioning: "Conditioning",
  mobility: "Mobility",
};

const manualDurations: Record<TrainingType, number> = {
  upper: 55,
  lower: 55,
  push: 50,
  pull: 50,
  full: 55,
  conditioning: 38,
  mobility: 35,
};

const manualAccents = [
  "#ec6335",
  "#a6c76e",
  "#668fa0",
  "#c98c9b",
  "#8976b8",
  "#cf9f4f",
  "#5f9f8b",
];

const defaultProfile: Profile = {
  goal: "Build muscle",
  experience: "Intermediate",
  days: 4,
  equipment: "Full gym",
};

function toExercises(items: string[][]): Exercise[] {
  return items.map(([name, sets, focus]) =>
    hydrateExercise({ name, sets, focus }),
  );
}

const limitedEquipmentLibraries: Partial<
  Record<Equipment, Record<TrainingType, string[][]>>
> = {
  "Dumbbells only": {
    upper: [["Dumbbell bench press", "3 × 8–10", "Chest"], ["One-arm dumbbell row", "3 × 10 / side", "Back"], ["Dumbbell shoulder press", "3 × 8–10", "Shoulders"], ["Dumbbell pullover", "3 × 10–12", "Back"], ["Hammer curl", "2 × 12", "Arms"]],
    lower: [["Goblet squat", "4 × 8–10", "Quads"], ["Dumbbell Romanian deadlift", "3 × 8–10", "Hamstrings"], ["Reverse lunge", "3 × 10 / side", "Legs"], ["Dumbbell hip thrust", "3 × 12", "Glutes"], ["Dumbbell calf raise", "3 × 15", "Calves"]],
    push: [["Dumbbell bench press", "4 × 8", "Chest"], ["Dumbbell shoulder press", "3 × 8–10", "Shoulders"], ["Incline dumbbell press", "3 × 10", "Chest"], ["Lateral raise", "3 × 12–15", "Shoulders"], ["Overhead triceps extension", "3 × 12", "Triceps"]],
    pull: [["Dumbbell Romanian deadlift", "3 × 8", "Posterior chain"], ["Chest-supported dumbbell row", "4 × 8–10", "Back"], ["Dumbbell pullover", "3 × 10", "Lats"], ["Reverse fly", "3 × 15", "Rear delts"], ["Hammer curl", "3 × 12", "Biceps"]],
    full: [["Goblet squat", "3 × 10", "Legs"], ["Dumbbell bench press", "3 × 8–10", "Chest"], ["One-arm dumbbell row", "3 × 10 / side", "Back"], ["Dumbbell Romanian deadlift", "3 × 10", "Hamstrings"], ["Dumbbell dead bug", "3 × 8 / side", "Core"]],
    conditioning: [["Dumbbell swing", "4 × 12", "Power"], ["Dumbbell thruster", "3 × 10", "Full body"], ["Reverse lunge", "3 × 10 / side", "Legs"], ["Dumbbell high knees", "6 × 30 sec", "Cardio"], ["Farmer carry", "4 × 30 m", "Core"]],
    mobility: [["90/90 hip switch", "3 × 8 / side", "Hips"], ["World’s greatest stretch", "2 × 6 / side", "Full body"], ["Tempo goblet squat", "3 × 8", "Legs"], ["Half-kneeling dumbbell press", "3 × 10", "Shoulders"], ["Suitcase carry", "3 × 30 m", "Core"]],
  },
  Bodyweight: {
    upper: [["Push-up", "3 × 8–15", "Chest"], ["Prone Y-T-W", "3 × 8", "Back"], ["Pike push-up", "3 × 6–10", "Shoulders"], ["Reverse snow angel", "3 × 12", "Back"], ["Close-grip push-up", "2 × 8–12", "Arms"]],
    lower: [["Tempo bodyweight squat", "4 × 12", "Quads"], ["Single-leg hip hinge", "3 × 10 / side", "Hamstrings"], ["Reverse lunge", "3 × 10 / side", "Legs"], ["Glute bridge", "3 × 15", "Glutes"], ["Single-leg calf raise", "3 × 15", "Calves"]],
    push: [["Push-up", "4 × 8–15", "Chest"], ["Pike push-up", "3 × 6–10", "Shoulders"], ["Tempo push-up", "3 × 8", "Chest"], ["Plank shoulder tap", "3 × 12 / side", "Shoulders"], ["Close-grip push-up", "3 × 8–12", "Triceps"]],
    pull: [["Single-leg hip hinge", "3 × 10 / side", "Posterior chain"], ["Prone Y-T-W", "4 × 8", "Back"], ["Superman pull", "3 × 12", "Lats"], ["Reverse snow angel", "3 × 15", "Rear delts"], ["Reverse plank", "3 × 30 sec", "Arms"]],
    full: [["Tempo bodyweight squat", "3 × 12", "Legs"], ["Push-up", "3 × 8–15", "Chest"], ["Superman pull", "3 × 12", "Back"], ["Single-leg hip hinge", "3 × 10 / side", "Hamstrings"], ["Dead bug", "3 × 8 / side", "Core"]],
    conditioning: [["Squat jump", "4 × 8", "Power"], ["Push-up", "3 × 8–12", "Upper body"], ["Reverse lunge", "3 × 10 / side", "Legs"], ["Mountain climber", "8 × 30 sec", "Cardio"], ["Bear crawl", "4 × 30 sec", "Core"]],
    mobility: [["90/90 hip switch", "3 × 8 / side", "Hips"], ["World’s greatest stretch", "2 × 6 / side", "Full body"], ["Tempo bodyweight squat", "3 × 10", "Legs"], ["Scapular push-up", "3 × 10", "Shoulders"], ["Side plank", "3 × 30 sec", "Core"]],
  },
};

function coachExercises(type: TrainingType, equipment: Equipment) {
  const exercises = toExercises(
    limitedEquipmentLibraries[equipment]?.[type] ?? exerciseLibrary[type],
  );
  return equipment === "Bodyweight"
    ? exercises.map((exercise) => ({ ...exercise, weight: "0" }))
    : exercises;
}

function hydrateExercise(exercise: Exercise): Exercise {
  const [setPart, ...repParts] = exercise.sets.split("×");
  const reps = exercise.reps ?? (repParts.join("×").trim() || "10");
  const technique = exercise.technique ?? "straight";
  const savedDropStages = Array.isArray(exercise.dropSetStages)
    ? exercise.dropSetStages.slice(0, 4).map((stage) => ({
        weight: String(stage?.weight ?? ""),
        reps: String(stage?.reps ?? reps),
      }))
    : [];
  const startingWeight = Number(exercise.weight);
  const suggestedWeight = (factor: number) =>
    Number.isFinite(startingWeight) && startingWeight > 0
      ? String(Math.round(startingWeight * factor * 2) / 2)
      : "";
  return {
    ...exercise,
    setCount: exercise.setCount ?? (setPart.trim() || "3"),
    reps,
    weight: exercise.weight ?? "",
    rest: exercise.rest ?? "90 sec",
    technique,
    dropSetStages:
      technique === "drop-set" && savedDropStages.length === 0
        ? [
            { weight: suggestedWeight(0.8), reps },
            { weight: suggestedWeight(0.6), reps },
          ]
        : savedDropStages,
  };
}

function isSupersetLead(exercises: Exercise[], index: number) {
  return (
    index < exercises.length - 1 &&
    hydrateExercise(exercises[index]).technique === "superset"
  );
}

function isSupersetPartner(exercises: Exercise[], index: number) {
  return index > 0 && isSupersetLead(exercises, index - 1);
}

function normalizeExerciseTechniques(exercises: Exercise[]) {
  return exercises.map((exercise, index) => {
    const hydrated = hydrateExercise(exercise);
    if (
      isSupersetPartner(exercises, index) ||
      (hydrated.technique === "superset" && index === exercises.length - 1)
    ) {
      return { ...hydrated, technique: "straight" as SetTechnique };
    }
    return hydrated;
  });
}

function workoutTechniqueMeta(exercises: Exercise[], index: number) {
  const exercise = hydrateExercise(exercises[index]);
  if (isSupersetPartner(exercises, index)) {
    const lead = hydrateExercise(exercises[index - 1]);
    return {
      kind: "superset",
      label: "SUPERSET · B",
      detail: `After ${lead.name}, complete ${exercisePrescription(exercise)} at ${plannedLoadLabel(exercise)}, then take your planned rest.`,
    };
  }
  if (isSupersetLead(exercises, index)) {
    const partner = hydrateExercise(exercises[index + 1]);
    return {
      kind: "superset",
      label: "SUPERSET · A",
      detail: `Complete ${exercisePrescription(exercise)} at ${plannedLoadLabel(exercise)}, then ${partner.name} — ${exercisePrescription(partner)} at ${plannedLoadLabel(partner)} — without resting.`,
    };
  }
  if (exercise.technique === "drop-set") {
    const sequence = (exercise.dropSetStages ?? [])
      .map(
        (stage, stageIndex) =>
          `Drop ${stageIndex + 1}: ${stage.weight || "set KG"} kg × ${stage.reps || "set reps"}`,
      )
      .join(" → ");
    return {
      kind: "drop-set",
      label: "DROP SET · FINAL SET",
      detail: `Start at ${plannedLoadLabel(exercise)}, then ${sequence}. No rest between drops.`,
    };
  }
  return null;
}

function exercisePrescription(exercise: Exercise) {
  const hydrated = hydrateExercise(exercise);
  return `${hydrated.setCount} × ${hydrated.reps}`;
}

function plannedSetCount(exercise: Exercise) {
  const count = Number.parseInt(hydrateExercise(exercise).setCount ?? "1", 10);
  return Number.isFinite(count) ? Math.min(20, Math.max(1, count)) : 1;
}

function plannedWeight(exercise: Exercise) {
  const value = hydrateExercise(exercise).weight?.trim();
  if (!value) return null;
  const weight = Number(value);
  return Number.isFinite(weight) && weight >= 0 && weight <= 2000
    ? weight
    : null;
}

function plannedLoadLabel(exercise: Exercise) {
  const weight = plannedWeight(exercise);
  if (weight === null) return "KG not set";
  return weight === 0 ? "bodyweight" : `${weight} kg`;
}

function plannedDropStages(exercise: Exercise) {
  const hydrated = hydrateExercise(exercise);
  return hydrated.technique === "drop-set" ? hydrated.dropSetStages ?? [] : [];
}

function restToSeconds(rest = "90 sec") {
  const value = Number.parseInt(rest, 10);
  if (!Number.isFinite(value)) return 90;
  return rest.includes("min") ? value * 60 : value;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatSessionTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
    : `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function exercisesFromWorkouts(workouts: Workout[]) {
  return Object.fromEntries(
    dayLabels.map((day) => {
      const workout = workouts.find((item) => item.day === day);
      return [
        day,
        workout?.exercises.map(hydrateExercise) ?? [],
      ];
    }),
  ) as Record<string, Exercise[]>;
}

function inferTrainingType(workout: Workout): TrainingType {
  if (workout.type) return workout.type;
  const title = workout.title.toLowerCase();
  const matched = (
    ["conditioning", "mobility", "push", "pull", "lower", "upper", "full"] as TrainingType[]
  ).find((type) => title.includes(type));
  if (matched) return matched;
  if (workout.exercises.some((exercise) => exercise.focus === "Quads")) return "lower";
  return "full";
}

function scheduleFromWorkouts(workouts: Workout[]) {
  return Object.fromEntries(
    dayLabels.map((day) => {
      const workout = workouts.find((item) => item.day === day);
      return [day, workout ? inferTrainingType(workout) : "rest"];
    }),
  ) as Record<string, DayAssignment>;
}

function buildManualPlan(
  schedule: Record<string, DayAssignment>,
  dayExercises: Record<string, Exercise[]>,
): Recommendation {
  const workouts = dayLabels.flatMap((day, index) => {
    const type = schedule[day] ?? "rest";
    if (type === "rest") return [];
    const exercises = (dayExercises[day] ?? toExercises(exerciseLibrary[type]))
      .filter((exercise) => exercise.name.trim())
      .map((exercise) => {
        const hydrated = hydrateExercise(exercise);
        return {
          ...hydrated,
          name: hydrated.name.trim(),
          sets: exercisePrescription(hydrated),
        };
      });
    return [{
      day,
      title: manualTitles[type],
      duration: manualDurations[type],
      exercises,
      accent: manualAccents[index],
      type,
    }];
  });

  return {
    name: "My weekly plan",
    summary: "A weekly training schedule built by you.",
    reason: `You set ${workouts.length} training ${workouts.length === 1 ? "day" : "days"} this week, with rest days kept visible for recovery.`,
    workouts,
  };
}

function buildRecommendation(profile: Profile): Recommendation {
  const days = dayLabels.slice(0, profile.days);
  const beginner = profile.experience === "Beginner";
  let split: Array<keyof typeof exerciseLibrary>;
  let name: string;
  let summary: string;

  if (profile.goal === "Move better") {
    split =
      profile.days <= 3
        ? ["mobility", "full", "mobility"]
        : ["mobility", "upper", "mobility", "lower", "full"];
    name = "Move Well";
    summary = "Strength, control and mobility without rushing the basics.";
  } else if (profile.goal === "Lose fat") {
    split =
      profile.days <= 3
        ? ["full", "conditioning", "full"]
        : ["upper", "lower", "conditioning", "full", "conditioning"];
    name = "Strong & Lean";
    summary = "Full-body strength paired with short, repeatable conditioning.";
  } else if (profile.days <= 3 || beginner) {
    split = ["full", "full", "full"];
    name =
      profile.goal === "Get stronger"
        ? "Foundation Strength"
        : "Full Body Build";
    summary = "Frequent full-body practice with enough recovery to progress.";
  } else if (profile.days === 4) {
    split = ["upper", "lower", "upper", "lower"];
    name =
      profile.goal === "Get stronger"
        ? "Upper / Lower Strength"
        : "Upper / Lower Build";
    summary = "A balanced four-day split with focused work and clear recovery.";
  } else {
    split = ["push", "pull", "lower", "upper", "conditioning"];
    name = profile.goal === "Get stronger" ? "Power Five" : "Build Five";
    summary = "Higher-frequency training with one clear job for each session.";
  }

  const titles = {
    upper: ["Upper strength", "Upper volume"],
    lower: ["Lower strength", "Lower volume"],
    push: ["Push", "Push"],
    pull: ["Pull", "Pull"],
    full: ["Full body A", "Full body B"],
    conditioning: ["Conditioning", "Conditioning"],
    mobility: ["Mobility reset", "Mobility reset"],
  };
  const uses = new Map<string, number>();
  const accents = ["#ec6335", "#a6c76e", "#668fa0", "#c98c9b", "#8976b8"];

  const workouts = split.slice(0, profile.days).map((type, index) => {
    const useIndex = uses.get(type) ?? 0;
    uses.set(type, useIndex + 1);
    return {
      day: days[index],
      title: titles[type][Math.min(useIndex, 1)],
      duration: beginner ? 45 : type === "conditioning" ? 38 : 55,
      exercises: coachExercises(type, profile.equipment),
      accent: accents[index],
      type,
    };
  });

  const equipmentReason =
    profile.equipment === "Full gym"
      ? "Your full-gym access lets us combine stable compound lifts with simple accessories."
      : profile.equipment === "Dumbbells only"
        ? "Every session can be completed with dumbbells and a bench."
        : "Controlled tempo and progressive variations keep bodyweight work challenging.";

  return {
    name,
    summary,
    reason: `${profile.days} training days gives you enough work without unnecessary fatigue. ${equipmentReason}`,
    workouts,
  };
}

function formatDate(value: string) {
  const date = parseWorkoutDate(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en", {
    day: "numeric",
    month: "short",
  });
}

function parseWorkoutDate(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;
  return new Date(normalized);
}

function startOfLocalWeek(value = new Date()) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function duplicateExerciseNames(exercises: Exercise[]) {
  const names = new Map<string, { count: number; label: string }>();
  for (const exercise of exercises) {
    const label = exercise.name.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    const current = names.get(key);
    names.set(key, {
      count: (current?.count ?? 0) + 1,
      label: current?.label ?? label,
    });
  }
  return Array.from(names.values())
    .filter((item) => item.count > 1)
    .map((item) => item.label);
}

function restoredWorkoutTiming(draft: WorkoutDraft, now = Date.now()) {
  const savedElapsed = Number(draft.elapsedSeconds);
  const savedElapsedIsInvalid =
    !Number.isFinite(savedElapsed) ||
    savedElapsed < 0 ||
    savedElapsed > MAX_WORKOUT_SESSION_SECONDS;
  const elapsedSeconds = savedElapsedIsInvalid ? 0 : Math.round(savedElapsed);
  const savedAt = Number(draft.savedAt);
  const idleSeconds = Number.isFinite(savedAt)
    ? Math.max(0, Math.round((now - savedAt) / 1000))
    : MAX_DRAFT_IDLE_SECONDS + 1;
  const isStale = idleSeconds > MAX_DRAFT_IDLE_SECONDS;
  const candidateElapsed =
    elapsedSeconds + (!draft.paused && !isStale ? idleSeconds : 0);
  const exceedsSessionLimit = candidateElapsed > MAX_WORKOUT_SESSION_SECONDS;
  const inactiveTimeRemoved =
    savedElapsedIsInvalid || isStale || exceedsSessionLimit;

  return {
    elapsedSeconds: exceedsSessionLimit ? elapsedSeconds : candidateElapsed,
    inactiveTimeRemoved,
    paused: draft.paused || inactiveTimeRemoved,
  };
}

function workoutCompletionStatus(log: WorkoutLog) {
  return log.exercisesCompleted >= log.totalExercises ? "Completed" : "Partial";
}

function EmptyActivity({ onStart }: { onStart: () => void }) {
  return (
    <div className="emptyActivity">
      <span className="emptyIcon">✓</span>
      <div>
        <strong>No workouts logged yet</strong>
        <p>Your completed sessions will appear here.</p>
      </div>
      <button className="linkButton" onClick={onStart} type="button">
        Start workout
      </button>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [recommendation, setRecommendation] = useState<Recommendation>(() =>
    buildRecommendation(defaultProfile),
  );
  const [weekSchedule, setWeekSchedule] = useState<Record<string, DayAssignment>>(
    () => scheduleFromWorkouts(buildRecommendation(defaultProfile).workouts),
  );
  const [dayExercises, setDayExercises] = useState<Record<string, Exercise[]>>(
    () => exercisesFromWorkouts(buildRecommendation(defaultProfile).workouts),
  );
  const [expandedDay, setExpandedDay] = useState("MON");
  const [draggedExercise, setDraggedExercise] = useState<{
    day: string;
    index: number;
  } | null>(null);
  const [dragTarget, setDragTarget] = useState<{
    day: string;
    index: number;
  } | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState(0);
  const [pendingWorkoutSwitch, setPendingWorkoutSwitch] = useState<number | null>(
    null,
  );
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [entries, setEntries] = useState<
    Record<string, { reps: string }>
  >({});
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [bodyWeights, setBodyWeights] = useState<BodyWeightLog[]>([]);
  const [bodyWeightInput, setBodyWeightInput] = useState("");
  const [account, setAccount] = useState<AccountSync>({
    signedIn: false,
    displayName: "Device profile",
  });
  const [progressExercise, setProgressExercise] = useState("");
  const [progressRange, setProgressRange] = useState<ProgressRange>("12w");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryMuscle, setLibraryMuscle] = useState("All");
  const [libraryEquipment, setLibraryEquipment] = useState("All");
  const [libraryDay, setLibraryDay] = useState("MON");
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [timerLabel, setTimerLabel] = useState("");
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [workoutNote, setWorkoutNote] = useState("");
  const [savedDraft, setSavedDraft] = useState<WorkoutDraft | null>(null);
  const [finishReview, setFinishReview] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [activeWorkoutExercise, setActiveWorkoutExercise] = useState(0);
  const [workoutChooserOpen, setWorkoutChooserOpen] = useState(false);
  const [coachProfile, setCoachProfile] = useState<Profile>(defaultProfile);
  const [pendingCoachPlan, setPendingCoachPlan] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedChanges, setQueuedChanges] = useState(0);
  const [completedWorkoutSummary, setCompletedWorkoutSummary] =
    useState<CompletedWorkoutSummary | null>(null);
  const [restAlerts, setRestAlerts] = useState<RestAlerts>({
    sound: true,
    vibration: true,
    notification: false,
  });
  const [profileId, setProfileId] = useState("");
  const [today] = useState(() =>
    new Date().toLocaleDateString("en", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const duplicatePlanDays = dayLabels.filter(
    (day) => duplicateExerciseNames(dayExercises[day] ?? []).length > 0,
  );
  const hasPlanDuplicates = duplicatePlanDays.length > 0;

  const workout =
    recommendation.workouts[selectedWorkout] ?? recommendation.workouts[0];
  const completedSets = Object.values(completed).filter(Boolean).length;
  const totalPlannedSets = workout.exercises.reduce(
    (sum, exercise) =>
      sum + plannedSetCount(exercise) + plannedDropStages(exercise).length,
    0,
  );
  const completedCount = workout.exercises.reduce((count, exercise, index) => {
    const exerciseDone = Array.from(
      { length: plannedSetCount(exercise) },
      (_, setIndex) =>
        completed[`${workout.day}-${workout.title}-${index}-${setIndex + 1}`],
    ).some(Boolean);
    return count + (exerciseDone ? 1 : 0);
  }, 0);
  const currentWorkoutVolume = Math.round(
    workout.exercises.reduce((sum, exercise, exerciseIndex) => {
      const weight = plannedWeight(exercise);
      if (weight === null) return sum;
      const baseKey = `${workout.day}-${workout.title}-${exerciseIndex}`;
      const mainSetVolume = Array.from(
        { length: plannedSetCount(exercise) },
        (_, setIndex) => {
          const key = `${baseKey}-${setIndex + 1}`;
          const reps = Number(entries[key]?.reps);
          return completed[key] && Number.isFinite(reps) ? weight * reps : 0;
        },
      ).reduce((setTotal, volume) => setTotal + volume, 0);
      const dropVolume = plannedDropStages(exercise).reduce(
        (dropTotal, stage, stageIndex) => {
          const key = `${baseKey}-drop-${stageIndex + 1}`;
          const stageWeight = Number(stage.weight);
          const reps = Number(entries[key]?.reps);
          return dropTotal + (
            completed[key] && Number.isFinite(stageWeight) && Number.isFinite(reps)
              ? stageWeight * reps
              : 0
          );
        },
        0,
      );
      return sum + mainSetVolume + dropVolume;
    }, 0),
  );
  const currentDurationMinutes = Math.max(1, Math.ceil(sessionElapsed / 60));
  const weeklyTarget = recommendation.workouts.length;
  const weeklyLogs = useMemo(() => {
    const start = startOfLocalWeek();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return logs.filter((log) => {
      const performedAt = parseWorkoutDate(log.performedAt);
      return performedAt >= start && performedAt < end;
    });
  }, [logs]);
  const weeklyDone = Math.min(weeklyLogs.length, weeklyTarget);
  const weeklyPercent = weeklyTarget
    ? Math.round((weeklyDone / weeklyTarget) * 100)
    : 0;
  const progressCutoff = useMemo(() => {
    if (progressRange === "all") return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (progressRange === "4w" ? 28 : 84));
    return cutoff;
  }, [progressRange]);
  const progressLogs = useMemo(
    () => logs.filter((log) =>
      !progressCutoff || parseWorkoutDate(log.performedAt) >= progressCutoff,
    ),
    [logs, progressCutoff],
  );
  const loggedSets = logs.flatMap((log) => log.sets ?? []);
  const totalVolume = Math.round(
    loggedSets.reduce((sum, set) => sum + set.weight * set.reps, 0),
  );
  const heaviestSet = loggedSets.reduce(
    (heaviest, set) => Math.max(heaviest, set.weight),
    0,
  );
  const rangeSets = progressLogs.flatMap((log) => log.sets ?? []);
  const rangeVolume = Math.round(
    rangeSets.reduce((sum, set) => sum + set.weight * set.reps, 0),
  );
  const estimatedOneRepMax = Math.round(rangeSets.reduce(
    (best, set) => Math.max(best, set.weight * (1 + set.reps / 30)),
    0,
  ));
  const rangeCompleted = progressLogs.filter(
    (log) => workoutCompletionStatus(log) === "Completed",
  ).length;
  const rangePartial = progressLogs.length - rangeCompleted;
  const exerciseNames = Array.from(
    new Set(loggedSets.map((set) => set.exerciseName)),
  ).sort();
  const activeProgressExercise = progressExercise || exerciseNames[0] || "";
  const exerciseProgress = progressLogs
    .slice()
    .reverse()
    .flatMap((log) => {
      const sets = (log.sets ?? []).filter(
        (set) =>
          set.exerciseName.toLowerCase() ===
          activeProgressExercise.toLowerCase(),
      );
      if (!sets.length) return [];
      return [{
        date: log.performedAt,
        weight: Math.max(...sets.map((set) => set.weight)),
      }];
    });
  const progressMax = Math.max(
    1,
    ...exerciseProgress.map((point) => point.weight),
  );
  const bodyWeightProgress = bodyWeights
    .filter((entry) =>
      !progressCutoff || parseWorkoutDate(entry.recordedAt) >= progressCutoff,
    )
    .slice()
    .reverse();
  const bodyWeightMin = bodyWeightProgress.length
    ? Math.min(...bodyWeightProgress.map((entry) => entry.weight))
    : 0;
  const bodyWeightMax = bodyWeightProgress.length
    ? Math.max(...bodyWeightProgress.map((entry) => entry.weight))
    : 1;
  const coachRecommendation = useMemo(
    () => buildRecommendation(coachProfile),
    [coachProfile],
  );
  const accountInitials = account.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LP";
  const activePlanDays = dayLabels.filter(
    (day) => (weekSchedule[day] ?? "rest") !== "rest",
  );
  const libraryTargetDay = activePlanDays.includes(libraryDay)
    ? libraryDay
    : activePlanDays[0] ?? "";
  const filteredCatalog = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    return exerciseCatalog.filter((exercise) => {
      const matchesQuery =
        !query ||
        exercise.name.toLowerCase().includes(query) ||
        exercise.focus.toLowerCase().includes(query) ||
        exercise.equipment.toLowerCase().includes(query);
      const matchesMuscle =
        libraryMuscle === "All" || exercise.focus === libraryMuscle;
      const matchesEquipment =
        libraryEquipment === "All" ||
        exercise.equipment === libraryEquipment;
      return matchesQuery && matchesMuscle && matchesEquipment;
    });
  }, [libraryEquipment, libraryMuscle, librarySearch]);

  useEffect(() => {
    const initialization = window.setTimeout(() => {
      const existing = window.localStorage.getItem("liftly-profile-id");
      const id = existing ?? crypto.randomUUID();
      window.localStorage.setItem("liftly-profile-id", id);
      setProfileId(id);
      let draftToRestore: WorkoutDraft | null = null;

      try {
        const storedDraft = window.localStorage.getItem(
          `liftly-workout-draft-${id}`,
        );
        if (storedDraft) {
          draftToRestore = JSON.parse(storedDraft) as WorkoutDraft;
        }
        const storedAlerts = window.localStorage.getItem("liftly-rest-alerts");
        if (storedAlerts) {
          setRestAlerts((current) => ({
            ...current,
            ...(JSON.parse(storedAlerts) as Partial<RestAlerts>),
          }));
        }
        const cachedTraining = window.localStorage.getItem(
          `liftly-fitness-cache-${id}`,
        );
        if (cachedTraining) applyFitnessData(JSON.parse(cachedTraining));
      } catch {
        window.localStorage.removeItem(`liftly-workout-draft-${id}`);
        window.localStorage.removeItem(`liftly-fitness-cache-${id}`);
      }

      setQueuedChanges(readMutationQueue(id).length);

      fetch(`/api/fitness?profileId=${encodeURIComponent(id)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load");
          return response.json();
        })
        .then((data) => {
          window.localStorage.setItem(
            `liftly-fitness-cache-${id}`,
            JSON.stringify(data),
          );
          applyFitnessData(data);
          if (draftToRestore) setSavedDraft(draftToRestore);
          void flushMutationQueue(id);
        })
        .catch(() => {
          if (draftToRestore) setSavedDraft(draftToRestore);
          setNotice("Working offline — new changes will sync automatically.");
        });
    }, 0);
    return () => window.clearTimeout(initialization);
    // Initialization intentionally runs once for this browser profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (profileId) void flushMutationQueue(profileId);
    };
    const handleOffline = () => setIsOnline(false);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);

    const initialOnlineCheck = window.setTimeout(
      () => setIsOnline(navigator.onLine),
      0,
    );
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    return () => {
      window.clearTimeout(initialOnlineCheck);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
    // Rebind only when the local profile used by the sync queue changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => {
    if (!sessionStarted || sessionPaused || view !== "workout") return;
    let lastTick = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const secondsPassed = Math.max(1, Math.round((now - lastTick) / 1000));
      lastTick = now;
      setSessionElapsed((current) => current + secondsPassed);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionPaused, sessionStarted, view]);

  useEffect(() => {
    if (!timerEndsAt) return;
    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((timerEndsAt - Date.now()) / 1000),
      );
      setTimerLeft(remaining);
      if (remaining === 0) setTimerEndsAt(null);
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 500);
    return () => window.clearInterval(interval);
  }, [timerEndsAt]);

  useEffect(() => {
    if (timerLeft !== 0 || !timerLabel) return;
    let noticeTimeout: number | undefined;
    const alertTimeout = window.setTimeout(() => {
      setNotice(`Rest complete — ready for your next ${timerLabel} set.`);
      if (restAlerts.sound) {
        try {
          const AudioContextClass =
            window.AudioContext ??
            (window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }).webkitAudioContext;
          if (AudioContextClass) {
            const context = new AudioContextClass();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.frequency.value = 740;
            gain.gain.setValueAtTime(0.08, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              context.currentTime + 0.45,
            );
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.45);
          }
        } catch {
          // The visual timer still completes if audio is unavailable.
        }
      }
      if (restAlerts.vibration && "vibrate" in navigator) {
        navigator.vibrate([180, 80, 180]);
      }
      if (
        restAlerts.notification &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      ) {
        new Notification("Liftly rest complete", {
          body: `Ready for your next ${timerLabel} set.`,
          icon: "/liftly-icon.png",
        });
      }
      setTimerLabel("");
      noticeTimeout = window.setTimeout(() => setNotice(""), 2800);
    }, 0);
    return () => {
      window.clearTimeout(alertTimeout);
      if (noticeTimeout) window.clearTimeout(noticeTimeout);
    };
  }, [restAlerts, timerLeft, timerLabel]);

  useEffect(() => {
    if (!profileId || !sessionStarted || view !== "workout") return;
    const draft: WorkoutDraft = {
      workoutDay: workout.day,
      workoutTitle: workout.title,
      entries,
      completed,
      elapsedSeconds: sessionElapsed,
      paused: sessionPaused,
      note: workoutNote,
      timerEndsAt,
      timerLabel,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(
      `liftly-workout-draft-${profileId}`,
      JSON.stringify(draft),
    );
  }, [
    completed,
    entries,
    profileId,
    sessionElapsed,
    sessionPaused,
    sessionStarted,
    timerEndsAt,
    timerLabel,
    view,
    workout.day,
    workout.title,
    workoutNote,
  ]);

  const activityBars = useMemo(() => {
    const start = startOfLocalWeek();
    return Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(start);
      dayStart.setDate(dayStart.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayLogs = weeklyLogs.filter((log) => {
        const performedAt = parseWorkoutDate(log.performedAt);
        return performedAt >= dayStart && performedAt < dayEnd;
      });
      if (!dayLogs.length) return 6;
      const completedExercises = dayLogs.reduce(
        (sum, log) => sum + log.exercisesCompleted,
        0,
      );
      const totalExercises = dayLogs.reduce(
        (sum, log) => sum + log.totalExercises,
        0,
      );
      return Math.max(
        28,
        Math.round((completedExercises / Math.max(1, totalExercises)) * 100),
      );
    });
  }, [weeklyLogs]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  function applyFitnessData(value: unknown) {
    const data = value as {
      account?: AccountSync;
      profile?: {
        goal: Goal;
        experience: Experience;
        days: number;
        equipment: Equipment;
        planJson?: string;
      };
      logs?: WorkoutLog[];
      bodyWeights?: BodyWeightLog[];
    };
    if (data.account) setAccount(data.account);
    if (data.profile?.planJson) {
      const savedProfile: Profile = {
        goal: data.profile.goal,
        experience: data.profile.experience,
        days: data.profile.days,
        equipment: data.profile.equipment,
      };
      const savedPlan = JSON.parse(data.profile.planJson) as Recommendation;
      setProfile(savedProfile);
      setCoachProfile(savedProfile);
      setRecommendation(savedPlan);
      setWeekSchedule(scheduleFromWorkouts(savedPlan.workouts));
      setDayExercises(exercisesFromWorkouts(savedPlan.workouts));
    }
    if (Array.isArray(data.logs)) setLogs(data.logs);
    if (Array.isArray(data.bodyWeights)) setBodyWeights(data.bodyWeights);
  }

  function mutationQueueKey(id: string) {
    return `liftly-sync-queue-${id}`;
  }

  function cacheTrainingState(
    id: string,
    nextProfile: Profile,
    nextPlan: Recommendation,
    nextLogs: WorkoutLog[],
    nextBodyWeights: BodyWeightLog[],
  ) {
    window.localStorage.setItem(`liftly-fitness-cache-${id}`, JSON.stringify({
      account,
      profile: {
        ...nextProfile,
        planJson: JSON.stringify(nextPlan),
      },
      logs: nextLogs,
      bodyWeights: nextBodyWeights,
    }));
  }

  function readMutationQueue(id: string): QueuedMutation[] {
    try {
      const stored = window.localStorage.getItem(mutationQueueKey(id));
      return stored ? JSON.parse(stored) as QueuedMutation[] : [];
    } catch {
      window.localStorage.removeItem(mutationQueueKey(id));
      return [];
    }
  }

  function writeMutationQueue(id: string, queue: QueuedMutation[]) {
    window.localStorage.setItem(mutationQueueKey(id), JSON.stringify(queue));
    setQueuedChanges(queue.length);
  }

  function queueMutation(payload: Record<string, unknown>) {
    if (!profileId) return;
    const queue = readMutationQueue(profileId);
    queue.push({ id: crypto.randomUUID(), payload });
    writeMutationQueue(profileId, queue);
  }

  async function sendFitnessMutation(payload: Record<string, unknown>) {
    const response = await fetch("/api/fitness", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error || "Sync failed");
    }
    return response.json();
  }

  async function loadFitnessData(id: string) {
    const response = await fetch(`/api/fitness?profileId=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error("Could not refresh training data");
    applyFitnessData(await response.json());
  }

  async function flushMutationQueue(id: string) {
    if (!navigator.onLine) return;
    const queue = readMutationQueue(id);
    if (!queue.length) return;
    const remaining = [...queue];
    while (remaining.length) {
      try {
        await sendFitnessMutation(remaining[0].payload);
        remaining.shift();
        writeMutationQueue(id, remaining);
      } catch {
        break;
      }
    }
    if (!remaining.length) {
      await loadFitnessData(id).catch(() => undefined);
      setNotice("Offline changes synced");
      window.setTimeout(() => setNotice(""), 2400);
    }
  }

  async function installLiftly() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function clearStoredWorkoutDraft() {
    if (profileId) {
      window.localStorage.removeItem(`liftly-workout-draft-${profileId}`);
    }
    setSavedDraft(null);
  }

  function openWorkout(index = selectedWorkout) {
    if (sessionStarted && index === selectedWorkout) {
      setView("workout");
      return;
    }
    clearStoredWorkoutDraft();
    setSelectedWorkout(index);
    setActiveWorkoutExercise(0);
    setWorkoutChooserOpen(false);
    setCompleted({});
    setEntries({});
    setTimerLeft(0);
    setTimerEndsAt(null);
    setTimerLabel("");
    setSessionElapsed(0);
    setSessionPaused(false);
    setSessionStarted(true);
    setWorkoutNote("");
    setFinishReview(false);
    setView("workout");
  }

  function resumeSavedWorkout() {
    if (!savedDraft) return;
    const workoutIndex = recommendation.workouts.findIndex(
      (item) =>
        item.day === savedDraft.workoutDay &&
        item.title === savedDraft.workoutTitle,
    );
    if (workoutIndex < 0) {
      clearStoredWorkoutDraft();
      setNotice("That saved workout is no longer in your plan.");
      window.setTimeout(() => setNotice(""), 2800);
      return;
    }
    const restoredTiming = restoredWorkoutTiming(savedDraft);
    const restoredTimerEndsAt =
      !restoredTiming.inactiveTimeRemoved &&
      savedDraft.timerEndsAt &&
      savedDraft.timerEndsAt > Date.now()
        ? savedDraft.timerEndsAt
        : null;
    setSelectedWorkout(workoutIndex);
    setActiveWorkoutExercise(0);
    setWorkoutChooserOpen(false);
    setEntries(savedDraft.entries);
    setCompleted(savedDraft.completed);
    setSessionElapsed(restoredTiming.elapsedSeconds);
    setSessionPaused(restoredTiming.paused);
    setSessionStarted(true);
    setWorkoutNote(savedDraft.note);
    setTimerEndsAt(restoredTimerEndsAt);
    setTimerLeft(
      restoredTimerEndsAt
        ? Math.max(0, Math.ceil((restoredTimerEndsAt - Date.now()) / 1000))
        : 0,
    );
    setTimerLabel(restoredTimerEndsAt ? savedDraft.timerLabel : "");
    setSavedDraft(null);
    setView("workout");
    setNotice(
      restoredTiming.inactiveTimeRemoved
        ? "Workout restored paused — inactive time was not added."
        : "Workout restored",
    );
    window.setTimeout(() => setNotice(""), 3200);
  }

  function discardSavedWorkout() {
    clearStoredWorkoutDraft();
    setNotice("Workout draft discarded");
    window.setTimeout(() => setNotice(""), 2200);
  }

  function selectWorkout(index: number) {
    if (index === selectedWorkout) return;
    const hasDraft =
      sessionElapsed > 0 ||
      completedSets > 0 ||
      workoutNote.trim().length > 0 ||
      Object.values(entries).some(
        (entry) => entry.reps.trim(),
      );
    if (hasDraft) {
      setPendingWorkoutSwitch(index);
      return;
    }
    openWorkout(index);
  }

  function confirmWorkoutSwitch() {
    if (pendingWorkoutSwitch === null) return;
    setSessionStarted(false);
    openWorkout(pendingWorkoutSwitch);
    setPendingWorkoutSwitch(null);
  }

  function previousPerformance(exerciseName: string) {
    for (const log of logs) {
      const previous = (log.sets ?? [])
        .filter(
          (set) =>
            set.exerciseName.toLowerCase() === exerciseName.toLowerCase(),
        )
        .sort((a, b) => (a.setNumber ?? 1) - (b.setNumber ?? 1));
      if (previous.length) return previous;
    }
    return [];
  }

  function startRestTimer(exercise: Exercise) {
    const seconds = restToSeconds(exercise.rest);
    setTimerLeft(seconds);
    setTimerEndsAt(() => Date.now() + seconds * 1000);
    setTimerLabel(exercise.name);
  }

  function adjustRestTimer(seconds: number) {
    const nextSeconds = Math.max(0, timerLeft + seconds);
    setTimerLeft(nextSeconds);
    setTimerEndsAt(nextSeconds > 0 ? Date.now() + nextSeconds * 1000 : null);
    if (nextSeconds === 0) setTimerLabel("");
  }

  async function toggleRestAlert(setting: keyof RestAlerts) {
    let nextValue = !restAlerts[setting];
    if (setting === "notification" && nextValue) {
      const NotificationClass = (window as Window & {
        Notification?: typeof Notification;
      }).Notification;
      if (!NotificationClass) {
        setNotice("Browser notifications are not supported on this device.");
        window.setTimeout(() => setNotice(""), 2800);
        return;
      }
      const permission = await NotificationClass.requestPermission();
      nextValue = permission === "granted";
      if (!nextValue) {
        setNotice("Notification permission was not enabled.");
        window.setTimeout(() => setNotice(""), 2800);
      }
    }
    const next = { ...restAlerts, [setting]: nextValue };
    setRestAlerts(next);
    window.localStorage.setItem("liftly-rest-alerts", JSON.stringify(next));
  }

  function copyPreviousReps(
    key: string,
    previousSet: { weight: number; reps: number },
  ) {
    setEntries((current) => ({
      ...current,
      [key]: {
        reps: String(previousSet.reps),
      },
    }));
    setNotice("Previous reps copied");
    window.setTimeout(() => setNotice(""), 1800);
  }

  function confirmWorkoutReset() {
    setCompleted({});
    setEntries({});
    setTimerLeft(0);
    setTimerEndsAt(null);
    setTimerLabel("");
    setSessionElapsed(0);
    setSessionPaused(false);
    setWorkoutNote("");
    setPendingReset(false);
  }

  async function savePlan(
    next: Recommendation,
    nextProfile = profile,
    successMessage = "Plan saved",
  ) {
    if (!profileId) return;
    const payload = {
      action: "save-plan",
      profileId,
      profile: nextProfile,
      plan: next,
    };
    cacheTrainingState(profileId, nextProfile, next, logs, bodyWeights);
    setSaving(true);
    try {
      await sendFitnessMutation(payload);
      setNotice(successMessage);
    } catch {
      queueMutation(payload);
      setNotice("Plan saved on this device — it will sync when online.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setNotice(""), 2600);
    }
  }

  function persistManualPlan(
    exercisesByDay: Record<string, Exercise[]>,
    options: {
      resetWorkout?: boolean;
      successMessage?: string;
    } = {},
  ) {
    const next = buildManualPlan(weekSchedule, exercisesByDay);
    if (next.workouts.length === 0) {
      setNotice("Choose at least one training day before saving.");
      window.setTimeout(() => setNotice(""), 2600);
      return false;
    }
    if (next.workouts.some((item) => item.exercises.length === 0)) {
      setNotice("Add at least one exercise to every training day.");
      window.setTimeout(() => setNotice(""), 2600);
      return false;
    }
    if (
      next.workouts.some((item) =>
        item.exercises.some(
          (exercise) =>
            !exercise.setCount?.trim() || !exercise.reps?.trim(),
        ),
      )
    ) {
      setNotice("Add sets and reps for every exercise before saving.");
      window.setTimeout(() => setNotice(""), 2600);
      return false;
    }
    const duplicateWorkout = next.workouts.find(
      (item) => duplicateExerciseNames(item.exercises).length > 0,
    );
    if (duplicateWorkout) {
      const duplicates = duplicateExerciseNames(duplicateWorkout.exercises);
      setNotice(
        `Remove duplicate ${duplicates.join(", ")} from ${duplicateWorkout.day} before saving.`,
      );
      window.setTimeout(() => setNotice(""), 3200);
      return false;
    }
    const invalidSuperset = next.workouts.find((item) =>
      item.exercises.some(
        (exercise, index) =>
          hydrateExercise(exercise).technique === "superset" &&
          index === item.exercises.length - 1,
      ),
    );
    if (invalidSuperset) {
      setNotice(`Move the superset in ${invalidSuperset.day} above another exercise to create a pair.`);
      window.setTimeout(() => setNotice(""), 3200);
      return false;
    }
    const invalidDropSet = next.workouts.flatMap((item) =>
      item.exercises.map((exercise) => ({ day: item.day, exercise })),
    ).find(({ exercise }) => {
      if (hydrateExercise(exercise).technique !== "drop-set") return false;
      const startingWeight = plannedWeight(exercise);
      const stages = plannedDropStages(exercise);
      let previousWeight = startingWeight ?? 0;
      return startingWeight === null || startingWeight <= 0 || stages.length === 0 ||
        plannedSetCount(exercise) + stages.length > 20 || stages.some((stage) => {
        const weight = Number(stage.weight);
        const invalid =
          !Number.isFinite(weight) ||
          weight < 0 ||
          weight >= previousWeight ||
          !stage.reps.trim();
        previousWeight = weight;
        return invalid;
      });
    });
    if (invalidDropSet) {
      setNotice(
        `Complete the drop sequence for ${invalidDropSet.exercise.name} in ${invalidDropSet.day}. Each drop must be lighter than the previous KG.`,
      );
      window.setTimeout(() => setNotice(""), 3600);
      return false;
    }
    const nextProfile = { ...profile, days: next.workouts.length };
    setProfile(nextProfile);
    setRecommendation(next);
    if (options.resetWorkout !== false) {
      setSelectedWorkout(0);
      setCompleted({});
      setEntries({});
    }
    void savePlan(
      next,
      nextProfile,
      options.successMessage ?? "Plan saved",
    );
    return true;
  }

  function saveManualPlan() {
    persistManualPlan(dayExercises);
  }

  function removeDuplicateExercises(day: string) {
    setDayExercises((current) => {
      const seen = new Set<string>();
      const exercises = (current[day] ?? []).filter((exercise) => {
        const key = exercise.name.trim().toLowerCase();
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { ...current, [day]: exercises };
    });
    setNotice(`Duplicate exercises removed from ${day}. Review and save your plan.`);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function changeDayAssignment(day: string, assignment: DayAssignment) {
    setWeekSchedule((current) => ({ ...current, [day]: assignment }));
    setDayExercises((current) => ({
      ...current,
      [day]:
        assignment === "rest"
          ? []
          : toExercises(exerciseLibrary[assignment]),
    }));
    if (assignment !== "rest") setExpandedDay(day);
  }

  function updateDayExercise(
    day: string,
    index: number,
    field: "name" | "setCount" | "reps" | "weight" | "rest" | "technique",
    value: string,
  ) {
    setDayExercises((current) => {
      const nextExercises = (current[day] ?? []).map((exercise, exerciseIndex) => {
        if (exerciseIndex !== index) return exercise;
        const next = { ...hydrateExercise(exercise), [field]: value };
        return {
          ...next,
          sets: `${next.setCount} × ${next.reps}`,
        };
      });
      if (field === "technique" && value === "superset" && nextExercises[index + 1]) {
        nextExercises[index + 1] = {
          ...hydrateExercise(nextExercises[index + 1]),
          technique: "straight",
        };
      }
      return { ...current, [day]: nextExercises };
    });
  }

  function updateDropSetStage(
    day: string,
    exerciseIndex: number,
    stageIndex: number,
    field: keyof DropSetStage,
    value: string,
  ) {
    setDayExercises((current) => {
      const nextExercises = [...(current[day] ?? [])];
      const exercise = hydrateExercise(nextExercises[exerciseIndex]);
      const stages = [...(exercise.dropSetStages ?? [])];
      stages[stageIndex] = { ...stages[stageIndex], [field]: value };
      nextExercises[exerciseIndex] = { ...exercise, dropSetStages: stages };
      return { ...current, [day]: nextExercises };
    });
  }

  function addDropSetStage(day: string, exerciseIndex: number) {
    setDayExercises((current) => {
      const nextExercises = [...(current[day] ?? [])];
      const exercise = hydrateExercise(nextExercises[exerciseIndex]);
      const stages = [...(exercise.dropSetStages ?? [])];
      if (stages.length >= 4) return current;
      const previousWeight = Number(stages.at(-1)?.weight ?? exercise.weight);
      const weight = Number.isFinite(previousWeight) && previousWeight > 0
        ? String(Math.round(previousWeight * 0.8 * 2) / 2)
        : "";
      nextExercises[exerciseIndex] = {
        ...exercise,
        dropSetStages: [...stages, { weight, reps: exercise.reps ?? "10" }],
      };
      return { ...current, [day]: nextExercises };
    });
  }

  function removeDropSetStage(
    day: string,
    exerciseIndex: number,
    stageIndex: number,
  ) {
    setDayExercises((current) => {
      const nextExercises = [...(current[day] ?? [])];
      const exercise = hydrateExercise(nextExercises[exerciseIndex]);
      const stages = exercise.dropSetStages ?? [];
      if (stages.length <= 1) return current;
      nextExercises[exerciseIndex] = {
        ...exercise,
        dropSetStages: stages.filter((_, index) => index !== stageIndex),
      };
      return { ...current, [day]: nextExercises };
    });
  }

  function addDayExercise(day: string) {
    setDayExercises((current) => ({
      ...current,
      [day]: [
        ...(current[day] ?? []),
        {
          name: "",
          focus: "Custom",
          sets: "3 × 10",
          setCount: "3",
          reps: "10",
          weight: "",
          rest: "90 sec",
          technique: "straight",
        },
      ],
    }));
  }

  function addLibraryExercise(exercise: LibraryExercise) {
    if (!libraryTargetDay) {
      setNotice("Choose a training day in My Plan first.");
      window.setTimeout(() => setNotice(""), 2600);
      return;
    }

    const currentDayExercises = dayExercises[libraryTargetDay] ?? [];
    if (
      currentDayExercises.some(
        (item) => item.name.toLowerCase() === exercise.name.toLowerCase(),
      )
    ) {
      setNotice(`${exercise.name} is already in ${libraryTargetDay}.`);
      window.setTimeout(() => setNotice(""), 2600);
      return;
    }

    const plannedExercise: Exercise = {
      name: exercise.name,
      focus: exercise.focus,
      sets: exercise.sets,
      setCount: exercise.setCount,
      reps: exercise.reps,
      weight: exercise.weight ?? "",
      rest: exercise.rest,
      technique: exercise.technique ?? "straight",
    };
    const nextDayExercises = {
      ...dayExercises,
      [libraryTargetDay]: [
        ...currentDayExercises,
        hydrateExercise(plannedExercise),
      ],
    };
    setDayExercises(nextDayExercises);
    setExpandedDay(libraryTargetDay);
    persistManualPlan(nextDayExercises, {
      resetWorkout: false,
      successMessage: `${exercise.name} added to ${libraryTargetDay}`,
    });
  }

  function removeDayExercise(day: string, index: number) {
    setDayExercises((current) => ({
      ...current,
      [day]: normalizeExerciseTechniques(
        (current[day] ?? []).filter((_, exerciseIndex) => exerciseIndex !== index),
      ),
    }));
  }

  function moveDayExercise(day: string, fromIndex: number, toIndex: number) {
    const exercises = [...(dayExercises[day] ?? [])];
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= exercises.length ||
      toIndex >= exercises.length
    ) {
      return;
    }
    const [moved] = exercises.splice(fromIndex, 1);
    exercises.splice(toIndex, 0, moved);
    const nextDayExercises = {
      ...dayExercises,
      [day]: normalizeExerciseTechniques(exercises),
    };
    setDayExercises(nextDayExercises);
    persistManualPlan(nextDayExercises, {
      resetWorkout: false,
      successMessage: "Exercise order saved",
    });
  }

  function dropDayExercise(day: string, toIndex: number) {
    if (draggedExercise?.day === day) {
      moveDayExercise(day, draggedExercise.index, toIndex);
    }
    setDraggedExercise(null);
    setDragTarget(null);
  }

  async function logWorkout() {
    if (!profileId || completedCount === 0) return;
    const completedSetPayload = workout.exercises.flatMap(
      (exercise, exerciseIndex) => {
        const baseKey = `${workout.day}-${workout.title}-${exerciseIndex}`;
        const mainSets = Array.from(
          { length: plannedSetCount(exercise) },
          (_, setIndex) => {
            const setNumber = setIndex + 1;
            const key = `${baseKey}-${setNumber}`;
            const entry = entries[key];
            const weight = plannedWeight(exercise);
            const reps = Number(entry?.reps);
            if (
              !completed[key] ||
              weight === null ||
              !Number.isInteger(reps) ||
              reps <= 0
            ) return [];
            return [{
              exerciseName: exercise.name,
              setNumber,
              weight,
              reps,
            }];
          },
        ).flat();
        const dropSets = plannedDropStages(exercise).flatMap(
          (stage, stageIndex) => {
            const key = `${baseKey}-drop-${stageIndex + 1}`;
            const weight = Number(stage.weight);
            const reps = Number(entries[key]?.reps);
            if (
              !completed[key] ||
              !Number.isFinite(weight) ||
              weight < 0 ||
              !Number.isInteger(reps) ||
              reps <= 0
            ) return [];
            return [{
              exerciseName: exercise.name,
              setNumber: plannedSetCount(exercise) + stageIndex + 1,
              weight,
              reps,
            }];
          },
        );
        return [...mainSets, ...dropSets];
      },
    );
    if (completedSetPayload.length !== completedSets) {
      setNotice("Set KG in My Plan and enter reps for every completed set.");
      window.setTimeout(() => setNotice(""), 2800);
      return;
    }
    const clientId = crypto.randomUUID();
    const payload = {
      action: "log-workout",
      clientId,
      profileId,
      workoutName: workout.title,
      duration: currentDurationMinutes,
      exercisesCompleted: completedCount,
      totalExercises: workout.exercises.length,
      note: workoutNote,
      sets: completedSetPayload,
    };
    const finishSavedWorkout = (
      log: WorkoutLog,
      personalRecords: string[],
      pendingSync = false,
    ) => {
      const nextLogs = [log, ...logs].slice(0, 100);
      setLogs(nextLogs);
      cacheTrainingState(profileId, profile, recommendation, nextLogs, bodyWeights);
      setCompletedWorkoutSummary({
        workoutName: workout.title,
        duration: currentDurationMinutes,
        completedSets,
        volume: currentWorkoutVolume,
        personalRecords,
        note: workoutNote.trim(),
        pendingSync,
      });
      clearStoredWorkoutDraft();
      setCompleted({});
      setEntries({});
      setTimerLeft(0);
      setTimerEndsAt(null);
      setTimerLabel("");
      setSessionElapsed(0);
      setSessionPaused(false);
      setSessionStarted(false);
      setWorkoutNote("");
      setFinishReview(false);
      setActiveWorkoutExercise(0);
      setView("progress");
    };
    setSaving(true);
    try {
      const data = await sendFitnessMutation(payload) as {
        log: WorkoutLog;
        personalRecords?: string[];
      };
      finishSavedWorkout(data.log, data.personalRecords ?? []);
    } catch {
      queueMutation(payload);
      finishSavedWorkout({
        id: -Date.now(),
        workoutName: workout.title,
        duration: currentDurationMinutes,
        exercisesCompleted: completedCount,
        totalExercises: workout.exercises.length,
        note: workoutNote,
        performedAt: new Date().toISOString(),
        sets: completedSetPayload,
      }, [], true);
    } finally {
      setSaving(false);
      window.setTimeout(() => setNotice(""), 2800);
    }
  }

  async function logBodyWeight() {
    if (!profileId) return;
    const weight = Number(bodyWeightInput);
    if (!Number.isFinite(weight) || weight < 25 || weight > 400) {
      setNotice("Enter a body weight between 25 and 400 kg.");
      window.setTimeout(() => setNotice(""), 2600);
      return;
    }
    const payload = {
      action: "log-bodyweight",
      clientId: crypto.randomUUID(),
      profileId,
      weight,
    };
    setSaving(true);
    try {
      const data = await sendFitnessMutation(payload) as {
        bodyWeight: BodyWeightLog;
      };
      const nextBodyWeights = [data.bodyWeight, ...bodyWeights].slice(0, 100);
      setBodyWeights(nextBodyWeights);
      cacheTrainingState(profileId, profile, recommendation, logs, nextBodyWeights);
      setNotice("Body weight saved");
    } catch {
      queueMutation(payload);
      const nextBodyWeights = [{
        id: -Date.now(),
        weight,
        recordedAt: new Date().toISOString(),
      }, ...bodyWeights].slice(0, 100);
      setBodyWeights(nextBodyWeights);
      cacheTrainingState(profileId, profile, recommendation, logs, nextBodyWeights);
      setNotice("Body weight saved on this device — sync is queued.");
    } finally {
      setBodyWeightInput("");
      setSaving(false);
      window.setTimeout(() => setNotice(""), 2800);
    }
  }

  function useCoachPlan() {
    const nextProfile = { ...coachProfile, days: coachRecommendation.workouts.length };
    setProfile(nextProfile);
    setRecommendation(coachRecommendation);
    setWeekSchedule(scheduleFromWorkouts(coachRecommendation.workouts));
    setDayExercises(exercisesFromWorkouts(coachRecommendation.workouts));
    setSelectedWorkout(0);
    setActiveWorkoutExercise(0);
    setCompleted({});
    setEntries({});
    setPendingCoachPlan(false);
    setView("plan");
    void savePlan(coachRecommendation, nextProfile, "Coach plan added to My Plan");
  }

  const navItems: Array<{ id: View; label: string; icon: string }> = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "plan", label: "My plan", icon: "▦" },
    { id: "library", label: "Exercises", icon: "≡" },
    { id: "workout", label: "Log workout", icon: "+" },
    { id: "progress", label: "Progress", icon: "◔" },
    { id: "coach", label: "AI Coach", icon: "✦" },
  ];

  return (
    <main className="appShell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setView("dashboard")}
          type="button"
        >
          <span className="brandGlyph" aria-hidden="true" />
          LIFTLY
        </button>

        <nav className="appNav" aria-label="Application navigation">
          <span className="navLabel">WORKSPACE</span>
          {navItems.map((item) => (
            <button
              aria-current={view === item.id ? "page" : undefined}
              className={view === item.id ? "active" : ""}
              key={item.id}
              onClick={() =>
                item.id === "workout" ? openWorkout() : setView(item.id)
              }
              type="button"
            >
              <span className="navIcon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
              {item.id === "workout" && (
                <span className="navBadge">{completedCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidePlan">
          <span className="sidePlanLabel">CURRENT PLAN</span>
          <strong>{recommendation.name}</strong>
          <span>{weeklyDone} of {weeklyTarget} this week</span>
          <div className="miniProgress">
            <span style={{ width: `${weeklyPercent}%` }} />
          </div>
        </div>

        <a
          className="userCard"
          href={account.signedIn ? undefined : "/signin-with-chatgpt?return_to=%2F"}
        >
          <span className="avatar">{accountInitials}</span>
          <span>
            <strong>{account.displayName}</strong>
            <small>{account.signedIn ? "Account sync active" : "Sign in to sync devices"}</small>
          </span>
        </a>
      </aside>

      <section className="appMain">
        <header className="appHeader">
          <div>
            <span className="mobileBrand">
              <span className="brandGlyph" aria-hidden="true" /> LIFTLY
            </span>
            <p>{today}</p>
          </div>
          <div className="headerActions">
            {installPrompt && (
              <button
                className="installAction"
                onClick={() => void installLiftly()}
                type="button"
              >
                Install app
              </button>
            )}
            <button
              className="primaryAction"
              onClick={() => openWorkout()}
              type="button"
            >
              <span aria-hidden="true">＋</span> Start workout
            </button>
          </div>
        </header>

        {(!isOnline || queuedChanges > 0) && (
          <div className="syncBanner" role="status">
            <span aria-hidden="true">{isOnline ? "↻" : "◌"}</span>
            <strong>{isOnline ? "Syncing your changes" : "You are offline"}</strong>
            <small>
              {queuedChanges} {queuedChanges === 1 ? "change" : "changes"} saved on this device
            </small>
          </div>
        )}

        {view === "dashboard" && (
          <div className="appPage">
            <div className="pageTitle">
              <div>
                <p className="eyebrow">TRAINING DASHBOARD</p>
                <h1>Your lifting progress</h1>
                <span>Track training volume, your best load and your next session.</span>
              </div>
              <button
                className="secondaryAction"
                onClick={() => setView("plan")}
                type="button"
              >
                Edit plan
              </button>
            </div>

            <section className="trainingHero">
              <div className="trainingHeroContent">
                <span className="heroTag">NEXT PLANNED SESSION</span>
                <p>{workout.day} · {recommendation.name}</p>
                <h2>{workout.title}</h2>
                <div className="heroMeta">
                  <span><strong>{workout.duration}</strong> min</span>
                  <span><strong>{workout.exercises.length}</strong> exercises</span>
                  <span><strong>{weeklyTarget}</strong> days planned</span>
                </div>
                <div className="heroFocus">
                  {Array.from(new Set(workout.exercises.map((exercise) => exercise.focus)))
                    .slice(0, 3)
                    .map((focus) => (
                      <span key={focus}>{focus}</span>
                    ))}
                </div>
                <div className="heroActions">
                  <button
                    className="heroStart"
                    onClick={() => openWorkout()}
                    type="button"
                  >
                    Start this workout <span aria-hidden="true">→</span>
                  </button>
                  <button onClick={() => setView("plan")} type="button">
                    View full plan
                  </button>
                </div>
              </div>
              <div className="readinessCard">
                <span>THIS WEEK</span>
                <strong>{weeklyDone}<small>/{weeklyTarget}</small></strong>
                <p>Planned sessions completed.</p>
              </div>
              <span className="heroWatermark" aria-hidden="true">LIFT</span>
            </section>

            <div className="statGrid">
              <article className="statCard">
                <span className="statIcon orange">◔</span>
                <div>
                  <small>WEEKLY PROGRESS</small>
                  <strong>{weeklyDone} / {weeklyTarget}</strong>
                  <span>sessions completed</span>
                </div>
                <div className="statProgress">
                  <span style={{ width: `${weeklyPercent}%` }} />
                </div>
              </article>
              <article className="statCard">
                <span className="statIcon green">⌁</span>
                <div>
                  <small>TOTAL VOLUME</small>
                  <strong>{totalVolume.toLocaleString()}</strong>
                  <span>kg from recorded sets</span>
                </div>
                <span className="statTrend">All logs</span>
              </article>
              <article className="statCard">
                <span className="statIcon blue">⌁</span>
                <div>
                  <small>HEAVIEST SET</small>
                  <strong>{heaviestSet}</strong>
                  <span>kg recorded</span>
                </div>
                <button
                  className="miniLink"
                  onClick={() => setView("progress")}
                  type="button"
                >
                  Details
                </button>
              </article>
            </div>

            <div className="dashboardGrid">
              <article className="todayCard">
                <div className="cardHeader">
                  <div>
                    <p className="eyebrow">TODAY’S TRAINING</p>
                    <h2>{workout.title}</h2>
                  </div>
                  <span className="durationBadge">{workout.duration} min</span>
                </div>
                <div className="exercisePreview">
                  {workout.exercises.slice(0, 4).map((exercise, index) => (
                    <div key={exercise.name}>
                      <span className="exerciseNumber">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <strong>{exercise.name}</strong>
                        <small>{exercise.focus}</small>
                      </span>
                      <span className="sets">{exercise.sets}</span>
                    </div>
                  ))}
                </div>
                <div className="cardFooter">
                  <span>
                    + {Math.max(0, workout.exercises.length - 4)} more exercise
                  </span>
                  <button
                    className="primaryAction"
                    onClick={() => openWorkout()}
                    type="button"
                  >
                    Begin session <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>

              <aside className="weekCard">
                <div className="cardHeader compact">
                  <div>
                    <p className="eyebrow">YOUR WEEK</p>
                    <h2>{recommendation.name}</h2>
                  </div>
                  <button
                    className="moreButton"
                    onClick={() => setView("plan")}
                    type="button"
                  >
                    Manage plan
                  </button>
                </div>
                <div className="weekList">
                  {recommendation.workouts.map((item, index) => (
                    <button
                      className={index === selectedWorkout ? "selected" : ""}
                      key={`${item.day}-${item.title}`}
                      onClick={() => openWorkout(index)}
                      type="button"
                    >
                      <span
                        className="daySquare"
                        style={{ "--accent": item.accent } as React.CSSProperties}
                      >
                        {item.day}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.exercises.length} exercises · {item.duration} min</small>
                      </span>
                      <span aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              </aside>
            </div>

            <div className="lowerGrid">
              <article className="insightCard">
                <div className="coachMark">L</div>
                <div>
                  <p className="eyebrow">COACH NOTE</p>
                  <h3>Your plan is balanced for recovery.</h3>
                  <p>{recommendation.reason}</p>
                </div>
                <button onClick={() => setView("plan")} type="button">
                  Review plan <span aria-hidden="true">→</span>
                </button>
              </article>
              <article className="activityCard">
                <div className="cardHeader compact">
                  <div>
                    <p className="eyebrow">RECENT ACTIVITY</p>
                    <h3>Workout history</h3>
                  </div>
                  <button
                    className="miniLink"
                    onClick={() => setView("progress")}
                    type="button"
                  >
                    View all
                  </button>
                </div>
                {logs.length ? (
                  <div className="activityRows">
                    {logs.slice(0, 3).map((log) => (
                      <div key={log.id}>
                        <span className="activityCheck">✓</span>
                        <span>
                          <strong>{log.workoutName}</strong>
                          <small>{formatDate(log.performedAt)}</small>
                        </span>
                        <span>{log.duration} min</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyActivity onStart={() => openWorkout()} />
                )}
              </article>
            </div>
          </div>
        )}

        {view === "plan" && (
          <div className="appPage">
            <div className="pageTitle">
              <div>
                <p className="eyebrow">WEEKLY PROGRAM</p>
                <h1>My training plan</h1>
                <span>Choose what you want to train on each day of the week.</span>
              </div>
              <button
                aria-describedby={hasPlanDuplicates ? "plan-duplicate-summary" : undefined}
                className="primaryAction planSaveAction"
                disabled={saving || hasPlanDuplicates}
                onClick={saveManualPlan}
                type="button"
              >
                {saving ? "Saving…" : "Save weekly plan"}
              </button>
            </div>

            {hasPlanDuplicates && (
              <div
                className="planValidationBanner"
                id="plan-duplicate-summary"
                role="alert"
              >
                <span aria-hidden="true">!</span>
                <div>
                  <strong>Fix duplicate exercises before saving</strong>
                  <p>
                    Review {duplicatePlanDays.join(", ")} and keep each exercise once.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const day = duplicatePlanDays[0];
                    setExpandedDay(day);
                    window.setTimeout(
                      () =>
                        document
                          .getElementById(`plan-day-${day}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                      0,
                    );
                  }}
                  type="button"
                >
                  Review {duplicatePlanDays[0]}
                </button>
              </div>
            )}

            <div className="planWorkspace">
              <section className="planBoard">
                <div className="panelTitle">
                  <div>
                    <p className="eyebrow">WEEKLY SCHEDULE</p>
                    <h2>Plan each training day</h2>
                  </div>
                  <span>
                    {Object.values(weekSchedule).filter((day) => day !== "rest").length} training days
                  </span>
                </div>
                <div className="dayPlanner">
                  {dayLabels.map((day, index) => {
                    const assignment = weekSchedule[day] ?? "rest";
                    const exercises = dayExercises[day] ?? [];
                    const option = trainingOptions.find(
                      (item) => item.value === assignment,
                    ) ?? trainingOptions[0];
                    const isRest = assignment === "rest";
                    const isExpanded = expandedDay === day && !isRest;
                    const duplicateNames = duplicateExerciseNames(exercises);
                    const duplicateKeys = new Set(
                      duplicateNames.map((name) => name.toLowerCase()),
                    );
                    return (
                      <div
                        className="dayPlanGroup"
                        id={`plan-day-${day}`}
                        key={day}
                      >
                        <div className={isRest ? "dayPlanRow rest" : "dayPlanRow"}>
                          <span
                            className="dayPlanBadge"
                            style={{ "--accent": manualAccents[index] } as React.CSSProperties}
                          >
                            <small>DAY {index + 1}</small>
                            <strong>{day}</strong>
                          </span>
                          <span className="dayPlanCopy">
                            <strong>{option.label}</strong>
                            <small>
                              {isRest
                                ? option.note
                                : `${exercises.length} exercises · ${option.note}`}
                            </small>
                          </span>
                          <label className="dayPlanSelect">
                            <span className="srOnly">Training for {day}</span>
                            <select
                              value={assignment}
                              onChange={(event) =>
                                changeDayAssignment(
                                  day,
                                  event.target.value as DayAssignment,
                                )
                              }
                            >
                              {trainingOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            className="dayPlanAction"
                            disabled={isRest}
                            onClick={() =>
                              setExpandedDay(isExpanded ? "" : day)
                            }
                            type="button"
                          >
                            {isRest
                              ? "Rest"
                              : isExpanded
                                ? "Close"
                                : "Edit exercises"}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="exerciseEditor">
                            <div className="exerciseEditorHead">
                              <span />
                              <span>EXERCISE</span>
                              <span>SETS</span>
                              <span>REPS</span>
                              <span>KG</span>
                              <span>REST</span>
                              <span>TECHNIQUE</span>
                              <span>ORDER</span>
                            </div>
                            {duplicateNames.length > 0 && (
                              <div className="duplicateExerciseWarning" role="status">
                                <strong>Duplicate exercise</strong>
                                <span>
                                  Remove extra {duplicateNames.join(", ")} entries before saving.
                                </span>
                                <button
                                  onClick={() => removeDuplicateExercises(day)}
                                  type="button"
                                >
                                  Remove duplicates
                                </button>
                              </div>
                            )}
                            {exercises.map((exercise, exerciseIndex) => {
                              const hydrated = hydrateExercise(exercise);
                              const isDragging =
                                draggedExercise?.day === day &&
                                draggedExercise.index === exerciseIndex;
                              const isDropTarget =
                                dragTarget?.day === day &&
                                dragTarget.index === exerciseIndex &&
                                !isDragging;
                              const supersetLead = isSupersetLead(
                                exercises,
                                exerciseIndex,
                              );
                              const supersetPartner = isSupersetPartner(
                                exercises,
                                exerciseIndex,
                              );
                              const supersetPartnerExercise = supersetLead
                                ? hydrateExercise(exercises[exerciseIndex + 1])
                                : null;
                              return (
                                <div
                                  className={[
                                    "exerciseEditRow",
                                    isDragging ? "dragging" : "",
                                    isDropTarget ? "dropTarget" : "",
                                    duplicateKeys.has(hydrated.name.trim().toLowerCase())
                                      ? "duplicate"
                                      : "",
                                    supersetLead ? "supersetLead" : "",
                                    supersetPartner ? "supersetPartner" : "",
                                    hydrated.technique === "drop-set" ? "dropSet" : "",
                                  ].filter(Boolean).join(" ")}
                                  key={`${day}-${exerciseIndex}`}
                                  onDragOver={(event) => {
                                    if (draggedExercise?.day !== day) return;
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = "move";
                                    setDragTarget({
                                      day,
                                      index: exerciseIndex,
                                    });
                                  }}
                                  onDrop={(event) => {
                                    event.preventDefault();
                                    dropDayExercise(day, exerciseIndex);
                                  }}
                                >
                                  <button
                                    aria-label={`Drag ${hydrated.name || `exercise ${exerciseIndex + 1}`} to reorder`}
                                    className="dragExercise"
                                    draggable
                                    onDragEnd={() => {
                                      setDraggedExercise(null);
                                      setDragTarget(null);
                                    }}
                                    onDragStart={(event) => {
                                      event.dataTransfer.effectAllowed = "move";
                                      event.dataTransfer.setData(
                                        "text/plain",
                                        `${day}-${exerciseIndex}`,
                                      );
                                      setDraggedExercise({
                                        day,
                                        index: exerciseIndex,
                                      });
                                    }}
                                    title="Drag to reorder"
                                    type="button"
                                  >
                                    ⠿
                                  </button>
                                  <label className="exerciseNameField">
                                    <span className="fieldCaption">Exercise</span>
                                    <input
                                      aria-label={`Exercise ${exerciseIndex + 1} name`}
                                      onChange={(event) =>
                                        updateDayExercise(
                                          day,
                                          exerciseIndex,
                                          "name",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Exercise name"
                                      value={hydrated.name}
                                    />
                                  </label>
                                  <label>
                                    <span className="fieldCaption">Sets</span>
                                    <input
                                      aria-label={`Sets for ${hydrated.name || `exercise ${exerciseIndex + 1}`}`}
                                      inputMode="numeric"
                                      onChange={(event) =>
                                        updateDayExercise(
                                          day,
                                          exerciseIndex,
                                          "setCount",
                                          event.target.value,
                                        )
                                      }
                                      value={hydrated.setCount}
                                    />
                                  </label>
                                  <label>
                                    <span className="fieldCaption">Reps</span>
                                    <input
                                      aria-label={`Reps for ${hydrated.name || `exercise ${exerciseIndex + 1}`}`}
                                      onChange={(event) =>
                                        updateDayExercise(
                                          day,
                                          exerciseIndex,
                                          "reps",
                                          event.target.value,
                                        )
                                      }
                                      value={hydrated.reps}
                                    />
                                  </label>
                                  <label className="weightField">
                                    <span className="fieldCaption">KG</span>
                                    <input
                                      aria-label={`Planned weight in kilograms for ${hydrated.name || `exercise ${exerciseIndex + 1}`}`}
                                      inputMode="decimal"
                                      max="2000"
                                      min="0"
                                      onChange={(event) =>
                                        updateDayExercise(
                                          day,
                                          exerciseIndex,
                                          "weight",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="kg"
                                      step="0.5"
                                      type="number"
                                      value={hydrated.weight}
                                    />
                                  </label>
                                  <label className="restField">
                                    <span className="fieldCaption">Rest</span>
                                    <select
                                      aria-label={`Rest time for ${hydrated.name || `exercise ${exerciseIndex + 1}`}`}
                                      onChange={(event) =>
                                        updateDayExercise(
                                          day,
                                          exerciseIndex,
                                          "rest",
                                          event.target.value,
                                        )
                                      }
                                      value={hydrated.rest}
                                    >
                                      {["30 sec", "45 sec", "60 sec", "90 sec", "2 min", "3 min", "5 min"].map(
                                        (rest) => (
                                          <option key={rest}>{rest}</option>
                                        ),
                                      )}
                                    </select>
                                  </label>
                                  <label className="techniqueField">
                                    <span className="fieldCaption">Technique</span>
                                    <select
                                      aria-label={`Set technique for ${hydrated.name || `exercise ${exerciseIndex + 1}`}`}
                                      disabled={supersetPartner}
                                      onChange={(event) =>
                                        updateDayExercise(
                                          day,
                                          exerciseIndex,
                                          "technique",
                                          event.target.value,
                                        )
                                      }
                                      value={supersetPartner ? "straight" : hydrated.technique}
                                    >
                                      {supersetPartner ? (
                                        <option value="straight">Superset partner</option>
                                      ) : (
                                        techniqueOptions.map((technique) => (
                                          <option
                                            disabled={
                                              technique.value === "superset" &&
                                              exerciseIndex === exercises.length - 1
                                            }
                                            key={technique.value}
                                            value={technique.value}
                                          >
                                            {technique.label}
                                          </option>
                                        ))
                                      )}
                                    </select>
                                  </label>
                                  <div className="exerciseOrderActions">
                                    <button
                                      aria-label={`Move ${hydrated.name || `exercise ${exerciseIndex + 1}`} up`}
                                      disabled={exerciseIndex === 0}
                                      onClick={() =>
                                        moveDayExercise(
                                          day,
                                          exerciseIndex,
                                          exerciseIndex - 1,
                                        )
                                      }
                                      type="button"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      aria-label={`Move ${hydrated.name || `exercise ${exerciseIndex + 1}`} down`}
                                      disabled={
                                        exerciseIndex === exercises.length - 1
                                      }
                                      onClick={() =>
                                        moveDayExercise(
                                          day,
                                          exerciseIndex,
                                          exerciseIndex + 1,
                                        )
                                      }
                                      type="button"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      aria-label={`Remove ${hydrated.name || `exercise ${exerciseIndex + 1}`}`}
                                      className="removeExercise"
                                      onClick={() =>
                                        removeDayExercise(day, exerciseIndex)
                                      }
                                      type="button"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  {supersetPartnerExercise && (
                                    <div className="techniqueDetails supersetDetails">
                                      <div className="techniqueDetailsHead">
                                        <strong>Superset order</strong>
                                        <span>Repeat A → B, then rest</span>
                                      </div>
                                      <div className="supersetSequence">
                                        <span>
                                          <b>A</b>
                                          <strong>{hydrated.name || "First exercise"}</strong>
                                          <small>
                                            {exercisePrescription(hydrated)} · {plannedLoadLabel(hydrated)}
                                          </small>
                                        </span>
                                        <i>NO REST →</i>
                                        <span>
                                          <b>B</b>
                                          <strong>{supersetPartnerExercise.name || "Next exercise"}</strong>
                                          <small>
                                            {exercisePrescription(supersetPartnerExercise)} · {plannedLoadLabel(supersetPartnerExercise)}
                                          </small>
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {hydrated.technique === "drop-set" && (
                                    <div className="techniqueDetails dropSetDetails">
                                      <div className="techniqueDetailsHead">
                                        <strong>Final-set drop sequence</strong>
                                        <span>Start at {plannedLoadLabel(hydrated)}, then reduce without rest</span>
                                      </div>
                                      <div className="dropSetSequence">
                                        {(hydrated.dropSetStages ?? []).map((stage, stageIndex) => (
                                          <div className="dropStage" key={`${day}-${exerciseIndex}-drop-${stageIndex}`}>
                                            <strong>DROP {stageIndex + 1}</strong>
                                            <label>
                                              <span>KG</span>
                                              <input
                                                aria-label={`Drop ${stageIndex + 1} weight for ${hydrated.name || `exercise ${exerciseIndex + 1}`}`}
                                                inputMode="decimal"
                                                min="0"
                                                onChange={(event) =>
                                                  updateDropSetStage(
                                                    day,
                                                    exerciseIndex,
                                                    stageIndex,
                                                    "weight",
                                                    event.target.value,
                                                  )
                                                }
                                                placeholder="kg"
                                                step="0.5"
                                                type="number"
                                                value={stage.weight}
                                              />
                                            </label>
                                            <label>
                                              <span>REPS</span>
                                              <input
                                                aria-label={`Drop ${stageIndex + 1} target reps for ${hydrated.name || `exercise ${exerciseIndex + 1}`}`}
                                                inputMode="numeric"
                                                onChange={(event) =>
                                                  updateDropSetStage(
                                                    day,
                                                    exerciseIndex,
                                                    stageIndex,
                                                    "reps",
                                                    event.target.value,
                                                  )
                                                }
                                                placeholder="reps"
                                                value={stage.reps}
                                              />
                                            </label>
                                            <button
                                              aria-label={`Remove drop ${stageIndex + 1}`}
                                              disabled={(hydrated.dropSetStages ?? []).length <= 1}
                                              onClick={() =>
                                                removeDropSetStage(day, exerciseIndex, stageIndex)
                                              }
                                              type="button"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          className="addDropStage"
                                          disabled={(hydrated.dropSetStages ?? []).length >= 4}
                                          onClick={() => addDropSetStage(day, exerciseIndex)}
                                          type="button"
                                        >
                                          + Add drop
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <button
                              className="addExercise"
                              onClick={() => addDayExercise(day)}
                              type="button"
                            >
                              <span aria-hidden="true">＋</span> Add exercise
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <aside className="planSide">
                <section className="aiFutureCard">
                  <span className="futureBadge">SMART PLAN BUILDER</span>
                  <div>
                    <p className="eyebrow">AI COACH</p>
                    <h2>Want a starting plan?</h2>
                    <p>
                      Tell Liftly your goal, experience, schedule and equipment.
                      You will get a complete recommendation to review before it
                      changes My Plan.
                    </p>
                  </div>
                <button
                  className="futureAction"
                  onClick={() => setView("coach")}
                  type="button"
                >
                  Build a recommended plan →
                </button>
                </section>
                <section className="planTipCard">
                  <p className="eyebrow">SIMPLE RULE</p>
                  <h3>Give trained muscles time to recover.</h3>
                  <p>
                    Avoid placing the same hard session on back-to-back days.
                    Use Rest or Mobility between demanding workouts.
                  </p>
                </section>
              </aside>
            </div>
          </div>
        )}

        {view === "library" && (
          <div className="appPage libraryPage">
            <div className="pageTitle">
              <div>
                <p className="eyebrow">EXERCISE LIBRARY</p>
                <h1>Find your next movement</h1>
                <span>
                  Search common exercises, filter by muscle or equipment, then
                  add one directly to a training day.
                </span>
              </div>
              <button
                className="secondaryAction"
                onClick={() => setView("plan")}
                type="button"
              >
                Open My Plan
              </button>
            </div>

            <section className="libraryToolbar">
              <label className="librarySearch">
                <span className="srOnly">Search exercises</span>
                <span aria-hidden="true">⌕</span>
                <input
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Search exercise, muscle or equipment"
                  type="search"
                  value={librarySearch}
                />
              </label>
              <label>
                <span>Muscle</span>
                <select
                  onChange={(event) => setLibraryMuscle(event.target.value)}
                  value={libraryMuscle}
                >
                  {catalogMuscles.map((muscle) => (
                    <option key={muscle}>{muscle}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Equipment</span>
                <select
                  onChange={(event) => setLibraryEquipment(event.target.value)}
                  value={libraryEquipment}
                >
                  {catalogEquipment.map((equipment) => (
                    <option key={equipment}>{equipment}</option>
                  ))}
                </select>
              </label>
              <label className="libraryDaySelect">
                <span>Add to training day</span>
                <select
                  disabled={!activePlanDays.length}
                  onChange={(event) => setLibraryDay(event.target.value)}
                  value={libraryTargetDay}
                >
                  {!activePlanDays.length && (
                    <option value="">No training days</option>
                  )}
                  {activePlanDays.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </label>
            </section>

            {!activePlanDays.length && (
              <section className="libraryPlanPrompt">
                <span aria-hidden="true">▦</span>
                <div>
                  <strong>Create a training day first</strong>
                  <p>
                    Set at least one day to Push, Pull, Legs or another workout
                    type before adding exercises.
                  </p>
                </div>
                <button onClick={() => setView("plan")} type="button">
                  Go to My Plan
                </button>
              </section>
            )}

            <div className="libraryResultsHeader">
              <div>
                <p className="eyebrow">BROWSE MOVEMENTS</p>
                <h2>
                  {filteredCatalog.length}{" "}
                  {filteredCatalog.length === 1 ? "exercise" : "exercises"}
                </h2>
              </div>
              <span>
                {libraryTargetDay
                  ? `Adding to ${libraryTargetDay}`
                  : "Choose a training day"}
              </span>
            </div>

            {filteredCatalog.length ? (
              <section className="exerciseLibraryGrid">
                {filteredCatalog.map((exercise) => {
                  const alreadyAdded =
                    Boolean(libraryTargetDay) &&
                    (dayExercises[libraryTargetDay] ?? []).some(
                      (item) =>
                        item.name.toLowerCase() === exercise.name.toLowerCase(),
                    );
                  return (
                    <article className="libraryExerciseCard" key={exercise.id}>
                      <div className="libraryExerciseVisual">
                        <span>{exercise.focus.slice(0, 2).toUpperCase()}</span>
                        <small>{exercise.equipment}</small>
                      </div>
                      <div className="libraryExerciseBody">
                        <div className="libraryExerciseTags">
                          <span>{exercise.focus}</span>
                          <span>{exercise.difficulty}</span>
                        </div>
                        <h3>{exercise.name}</h3>
                        <p>
                          <strong>{exercisePrescription(exercise)}</strong>
                          <span>·</span>
                          {exercise.rest} rest
                        </p>
                        <button
                          disabled={
                            !libraryTargetDay || saving || alreadyAdded
                          }
                          onClick={() => addLibraryExercise(exercise)}
                          type="button"
                        >
                          {alreadyAdded
                            ? `Added to ${libraryTargetDay}`
                            : libraryTargetDay
                              ? `Add to ${libraryTargetDay}`
                              : "Choose a training day"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : (
              <section className="libraryEmpty">
                <span aria-hidden="true">⌕</span>
                <h2>No exercises found</h2>
                <p>Try another search or reset one of the filters.</p>
                <button
                  onClick={() => {
                    setLibrarySearch("");
                    setLibraryMuscle("All");
                    setLibraryEquipment("All");
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              </section>
            )}
          </div>
        )}

        {view === "coach" && (
          <div className="appPage coachPage">
            <div className="pageTitle">
              <div>
                <p className="eyebrow">AI COACH</p>
                <h1>Build a plan that fits your week</h1>
                <span>
                  Choose your training needs, review the recommendation, then
                  decide whether to use it.
                </span>
              </div>
              <button
                className="secondaryAction"
                onClick={() => setView("plan")}
                type="button"
              >
                Back to My Plan
              </button>
            </div>

            <div className="coachGrid">
              <section className="coachFormPanel">
                <div className="panelTitle">
                  <div>
                    <p className="eyebrow">YOUR INPUTS</p>
                    <h2>What should the plan work around?</h2>
                  </div>
                </div>
                <label>
                  <span>Primary goal</span>
                  <select
                    onChange={(event) => setCoachProfile((current) => ({
                      ...current,
                      goal: event.target.value as Goal,
                    }))}
                    value={coachProfile.goal}
                  >
                    {(["Build muscle", "Get stronger", "Lose fat", "Move better"] as Goal[])
                      .map((goal) => <option key={goal}>{goal}</option>)}
                  </select>
                </label>
                <label>
                  <span>Experience level</span>
                  <select
                    onChange={(event) => setCoachProfile((current) => ({
                      ...current,
                      experience: event.target.value as Experience,
                    }))}
                    value={coachProfile.experience}
                  >
                    {(["Beginner", "Intermediate", "Advanced"] as Experience[])
                      .map((level) => <option key={level}>{level}</option>)}
                  </select>
                </label>
                <label>
                  <span>Available equipment</span>
                  <select
                    onChange={(event) => setCoachProfile((current) => ({
                      ...current,
                      equipment: event.target.value as Equipment,
                    }))}
                    value={coachProfile.equipment}
                  >
                    {(["Full gym", "Dumbbells only", "Bodyweight"] as Equipment[])
                      .map((equipment) => <option key={equipment}>{equipment}</option>)}
                  </select>
                </label>
                <label className="coachDaysField">
                  <span>Training days each week</span>
                  <strong>{coachProfile.days} days</strong>
                  <input
                    aria-label="Training days each week"
                    max="5"
                    min="2"
                    onChange={(event) => setCoachProfile((current) => ({
                      ...current,
                      days: Number(event.target.value),
                    }))}
                    type="range"
                    value={coachProfile.days}
                  />
                  <small>2 days</small><small>5 days</small>
                </label>
                <div className="coachHistoryNote">
                  <span aria-hidden="true">◔</span>
                  <p>
                    <strong>{logs.length ? `${logs.length} past workouts considered` : "Ready for your first plan"}</strong>
                    {logs.length
                      ? "Liftly keeps your recent consistency visible while you choose a realistic schedule."
                      : "You can fine-tune every exercise, set, rep, KG and rest time after applying it."}
                  </p>
                </div>
              </section>

              <section className="coachPreviewPanel">
                <div className="coachPlanHero">
                  <span>RECOMMENDED FOR YOU</span>
                  <h2>{coachRecommendation.name}</h2>
                  <p>{coachRecommendation.summary}</p>
                  <small>{coachRecommendation.reason}</small>
                </div>
                <div className="coachWorkoutList">
                  {coachRecommendation.workouts.map((item) => (
                    <article key={`${item.day}-${item.title}`}>
                      <span style={{ "--accent": item.accent } as React.CSSProperties}>
                        {item.day}
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.duration} min · {item.exercises.length} exercises</small>
                        <p>{item.exercises.map((exercise) => exercise.name).join(" · ")}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <button
                  className="primaryAction coachUsePlan"
                  onClick={() => setPendingCoachPlan(true)}
                  type="button"
                >
                  Use this recommended plan
                </button>
                <p className="coachControlNote">
                  Nothing changes until you confirm. Afterward, the plan stays
                  fully editable in My Plan.
                </p>
              </section>
            </div>
          </div>
        )}

        {view === "workout" && (
          <div className="appPage workoutPage">
            <div className="pageTitle workoutTitle">
              <div>
                <button
                  className="backButton"
                  onClick={() => setView("dashboard")}
                  type="button"
                >
                  ← Dashboard
                </button>
                <p className="eyebrow">ACTIVE SESSION · {workout.day}</p>
                <h1>{workout.title}</h1>
                <span>
                  Planned {workout.duration} min · {workout.exercises.length} exercises
                </span>
              </div>
              <div className="workoutTitleActions">
                <div className="sessionClock">
                  <strong>{formatSessionTime(sessionElapsed)}</strong>
                  <span>{sessionPaused ? "Session paused" : "Elapsed time"}</span>
                  <button
                    onClick={() => setSessionPaused((current) => !current)}
                    type="button"
                  >
                    {sessionPaused ? "Resume" : "Pause"}
                  </button>
                </div>
                <div className="sessionProgress">
                  <strong>{completedSets}/{totalPlannedSets}</strong>
                  <span>sets completed</span>
                </div>
              </div>
            </div>

            <section className="workoutChooser compact">
              <div className="workoutChooserHeader">
                <div>
                  <p className="eyebrow">CURRENT SESSION</p>
                  <h2>{workout.day} · {workout.title}</h2>
                </div>
                <div className="workoutChooserActions">
                  <button
                    onClick={() => setWorkoutChooserOpen((current) => !current)}
                    type="button"
                  >
                    {workoutChooserOpen ? "Close sessions" : "Change session"}
                  </button>
                  <button onClick={() => setView("plan")} type="button">
                    Edit plan
                  </button>
                </div>
              </div>
              {workoutChooserOpen && (
                <div className="workoutChoiceList">
                  {recommendation.workouts.map((item, index) => (
                    <button
                      aria-pressed={index === selectedWorkout}
                      className={index === selectedWorkout ? "active" : ""}
                      key={`${item.day}-${item.title}`}
                      onClick={() => selectWorkout(index)}
                      type="button"
                    >
                      <span
                        className="workoutChoiceDay"
                        style={{ "--accent": item.accent } as React.CSSProperties}
                      >
                        {item.day}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.exercises.length} exercises</small>
                      </span>
                      <span className="workoutChoiceState">
                        {index === selectedWorkout ? "SELECTED" : "CHOOSE"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <div className="loggerLayout">
              <section className="loggerPanel">
                <div className="exerciseRail" aria-label="Workout exercise progress">
                  {workout.exercises.map((exercise, index) => {
                    const baseKey = `${workout.day}-${workout.title}-${index}`;
                    const done = [
                      ...Array.from(
                      { length: plannedSetCount(exercise) },
                      (_, setIndex) => completed[`${baseKey}-${setIndex + 1}`],
                      ),
                      ...plannedDropStages(exercise).map(
                        (_, stageIndex) => completed[`${baseKey}-drop-${stageIndex + 1}`],
                      ),
                    ].every(Boolean);
                    return (
                      <button
                        aria-current={index === activeWorkoutExercise ? "step" : undefined}
                        className={`${index === activeWorkoutExercise ? "active " : ""}${done ? "done" : ""}`.trim()}
                        key={baseKey}
                        onClick={() => setActiveWorkoutExercise(index)}
                        type="button"
                      >
                        <span>{done ? "✓" : index + 1}</span>
                        <small>{exercise.name}</small>
                      </button>
                    );
                  })}
                </div>
                {workout.exercises.map((exercise, index) => {
                  if (index !== activeWorkoutExercise) return null;
                  const baseKey = `${workout.day}-${workout.title}-${index}`;
                  const previous = previousPerformance(exercise.name);
                  const targetWeight = plannedWeight(exercise);
                  const dropStages = plannedDropStages(exercise);
                  const techniqueMeta = workoutTechniqueMeta(
                    workout.exercises,
                    index,
                  );
                  const exerciseDone = [
                    ...Array.from(
                      { length: plannedSetCount(exercise) },
                      (_, setIndex) => completed[`${baseKey}-${setIndex + 1}`],
                    ),
                    ...dropStages.map(
                      (_, stageIndex) => completed[`${baseKey}-drop-${stageIndex + 1}`],
                    ),
                  ].every(Boolean);
                  return (
                    <div
                      className={exerciseDone ? "loggerExerciseBlock done" : "loggerExerciseBlock"}
                      key={baseKey}
                    >
                      <div className="loggerExerciseTop">
                        <span className="exerciseNumber" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="loggerExercise">
                          <strong>{exercise.name}</strong>
                          <small>
                            Target {exercisePrescription(exercise)} ·{" "}
                            {targetWeight === null
                              ? "KG not set — update My Plan"
                              : targetWeight === 0
                                ? "Bodyweight"
                                : `${targetWeight} kg`} ·{" "}
                            {exercise.rest ?? "90 sec"} rest
                          </small>
                          <span className="previousPerformance">
                            {previous.length
                              ? `Last: ${previous
                                  .slice(0, 4)
                                  .map((set) => `${set.weight} kg × ${set.reps}`)
                                  .join(" · ")}`
                              : "No previous performance yet"}
                          </span>
                        </span>
                      </div>
                      {techniqueMeta && (
                        <div className={`techniqueCue ${techniqueMeta.kind}`}>
                          <strong>{techniqueMeta.label}</strong>
                          <span>{techniqueMeta.detail}</span>
                        </div>
                      )}
                      <div className="setLoggerHead">
                        <span>SET</span>
                        <span>PREVIOUS</span>
                        <span>REPS</span>
                        <span>DONE</span>
                      </div>
                      <div className="setLoggerRows">
                        {Array.from(
                          { length: plannedSetCount(exercise) },
                          (_, setIndex) => {
                            const setNumber = setIndex + 1;
                            const key = `${baseKey}-${setNumber}`;
                            const isDone = Boolean(completed[key]);
                            const entry = entries[key] ?? {
                              reps: "",
                            };
                            const previousSet = previous[setIndex];
                            return (
                              <div
                                className={isDone ? "setLoggerRow done" : "setLoggerRow"}
                                key={key}
                              >
                                <span className="setNumber">{setNumber}</span>
                                {previousSet ? (
                                  <button
                                    aria-label={`Copy ${previousSet.reps} reps from the previous set`}
                                    className="previousSet"
                                    onClick={() =>
                                      copyPreviousReps(key, previousSet)
                                    }
                                    title="Use previous reps"
                                    type="button"
                                  >
                                    {previousSet.weight} × {previousSet.reps}
                                  </button>
                                ) : (
                                  <span className="previousSet">—</span>
                                )}
                                <label>
                                  <span className="srOnly">
                                    Reps for {exercise.name}, set {setNumber}
                                  </span>
                                  <input
                                    inputMode="numeric"
                                    onChange={(event) =>
                                      setEntries((current) => ({
                                        ...current,
                                        [key]: {
                                          ...entry,
                                          reps: event.target.value,
                                        },
                                      }))
                                    }
                                    placeholder={previousSet ? String(previousSet.reps) : exercise.reps}
                                    value={entry.reps}
                                  />
                                </label>
                                <label className="doneControl">
                                  <input
                                    checked={isDone}
                                    onChange={(event) => {
                                      const checked = event.target.checked;
                                      if (checked && targetWeight === null) {
                                        setNotice(`Set KG for ${exercise.name} in My Plan first.`);
                                        window.setTimeout(() => setNotice(""), 2800);
                                        return;
                                      }
                                      setCompleted((current) => ({
                                        ...current,
                                        [key]: checked,
                                      }));
                                      if (
                                        checked &&
                                        dropStages.length > 0 &&
                                        setNumber === plannedSetCount(exercise)
                                      ) {
                                        setTimerLeft(0);
                                        setTimerEndsAt(null);
                                        setTimerLabel("");
                                        setNotice(
                                          `Final set: continue with Drop 1 at ${dropStages[0].weight} kg without resting.`,
                                        );
                                        window.setTimeout(() => setNotice(""), 2800);
                                      } else if (checked && isSupersetLead(workout.exercises, index)) {
                                        setTimerLeft(0);
                                        setTimerEndsAt(null);
                                        setTimerLabel("");
                                        setActiveWorkoutExercise(index + 1);
                                        setNotice(
                                          `Superset: continue with ${workout.exercises[index + 1].name} without resting.`,
                                        );
                                        window.setTimeout(() => setNotice(""), 2600);
                                      } else if (checked) {
                                        startRestTimer(exercise);
                                        if (isSupersetPartner(workout.exercises, index)) {
                                          setActiveWorkoutExercise(index - 1);
                                        }
                                      }
                                    }}
                                    type="checkbox"
                                  />
                                  <span>{isDone ? "✓" : ""}</span>
                                </label>
                              </div>
                            );
                          },
                        )}
                      </div>
                      {dropStages.length > 0 && (
                        <div className="dropSetLogger">
                          <div className="dropSetLoggerTitle">
                            <strong>Final-set drops</strong>
                            <span>Continue without rest after your last working set</span>
                          </div>
                          {dropStages.map((stage, stageIndex) => {
                            const key = `${baseKey}-drop-${stageIndex + 1}`;
                            const isDone = Boolean(completed[key]);
                            const entry = entries[key] ?? { reps: "" };
                            return (
                              <div
                                className={isDone ? "dropSetLoggerRow done" : "dropSetLoggerRow"}
                                key={key}
                              >
                                <span className="dropStageNumber">DROP {stageIndex + 1}</span>
                                <span className="dropStageWeight">{stage.weight} kg</span>
                                <label>
                                  <span className="srOnly">
                                    Reps for {exercise.name}, drop {stageIndex + 1}
                                  </span>
                                  <input
                                    inputMode="numeric"
                                    onChange={(event) =>
                                      setEntries((current) => ({
                                        ...current,
                                        [key]: { ...entry, reps: event.target.value },
                                      }))
                                    }
                                    placeholder={stage.reps}
                                    value={entry.reps}
                                  />
                                </label>
                                <label className="doneControl">
                                  <input
                                    checked={isDone}
                                    onChange={(event) => {
                                      const checked = event.target.checked;
                                      const stageWeight = Number(stage.weight);
                                      if (
                                        checked &&
                                        (!Number.isFinite(stageWeight) || stageWeight < 0)
                                      ) {
                                        setNotice(`Set Drop ${stageIndex + 1} KG in My Plan first.`);
                                        window.setTimeout(() => setNotice(""), 2800);
                                        return;
                                      }
                                      setCompleted((current) => ({
                                        ...current,
                                        [key]: checked,
                                      }));
                                      if (!checked) return;
                                      const nextStage = dropStages[stageIndex + 1];
                                      if (nextStage) {
                                        setNotice(
                                          `Continue with Drop ${stageIndex + 2} at ${nextStage.weight} kg — no rest.`,
                                        );
                                        window.setTimeout(() => setNotice(""), 2600);
                                      } else {
                                        startRestTimer(exercise);
                                      }
                                    }}
                                    type="checkbox"
                                  />
                                  <span>{isDone ? "✓" : ""}</span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="exerciseStepper">
                  <button
                    disabled={activeWorkoutExercise === 0}
                    onClick={() => setActiveWorkoutExercise((current) => Math.max(0, current - 1))}
                    type="button"
                  >
                    ← Previous
                  </button>
                  <span>
                    Exercise {activeWorkoutExercise + 1} of {workout.exercises.length}
                  </span>
                  <button
                    disabled={activeWorkoutExercise === workout.exercises.length - 1}
                    onClick={() => setActiveWorkoutExercise((current) =>
                      Math.min(workout.exercises.length - 1, current + 1),
                    )}
                    type="button"
                  >
                    Next →
                  </button>
                </div>
                <div className="loggerFooter">
                  <button
                    className="secondaryAction"
                    onClick={() => setPendingReset(true)}
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    className="primaryAction"
                    disabled={completedCount === 0 || saving}
                    onClick={() => setFinishReview(true)}
                    type="button"
                  >
                    Finish workout
                  </button>
                </div>
              </section>

              <aside className="sessionAside">
                <div className={timerLeft > 0 ? "restTimer active" : "restTimer"}>
                  <p className="eyebrow">REST TIMER</p>
                  <strong>{timerLeft > 0 ? formatTimer(timerLeft) : "0:00"}</strong>
                  <span>
                    {timerLeft > 0
                      ? `After ${timerLabel}`
                      : "Completing a set starts the timer"}
                  </span>
                  <div className="timerAdjustments">
                    <button
                      disabled={timerLeft <= 0}
                      onClick={() => adjustRestTimer(-15)}
                      type="button"
                    >
                      −15s
                    </button>
                    <button
                      disabled={timerLeft <= 0}
                      onClick={() => adjustRestTimer(15)}
                      type="button"
                    >
                      +15s
                    </button>
                    <button
                      disabled={timerLeft <= 0}
                      onClick={() => {
                        setTimerLeft(0);
                        setTimerEndsAt(null);
                        setTimerLabel("");
                      }}
                      type="button"
                    >
                      Skip
                    </button>
                  </div>
                  <div className="restAlertControls">
                    <button
                      aria-pressed={restAlerts.sound}
                      onClick={() => void toggleRestAlert("sound")}
                      type="button"
                    >
                      Sound {restAlerts.sound ? "on" : "off"}
                    </button>
                    <button
                      aria-pressed={restAlerts.vibration}
                      onClick={() => void toggleRestAlert("vibration")}
                      type="button"
                    >
                      Vibrate {restAlerts.vibration ? "on" : "off"}
                    </button>
                    <button
                      aria-pressed={restAlerts.notification}
                      onClick={() => void toggleRestAlert("notification")}
                      type="button"
                    >
                      Notify {restAlerts.notification ? "on" : "off"}
                    </button>
                  </div>
                </div>
                <div className="sessionSummary">
                  <p className="eyebrow">SESSION SUMMARY</p>
                  <div
                    className="sessionRing"
                    style={{
                      "--progress": `${(completedSets / totalPlannedSets) * 360}deg`,
                    } as React.CSSProperties}
                  >
                    <span>{Math.round((completedSets / totalPlannedSets) * 100)}%</span>
                  </div>
                  <div className="summaryRows">
                    <p><span>Elapsed</span><strong>{formatSessionTime(sessionElapsed)}</strong></p>
                    <p><span>Volume</span><strong>{currentWorkoutVolume.toLocaleString()} kg</strong></p>
                    <p><span>Sets completed</span><strong>{completedSets}</strong></p>
                    <p><span>Sets remaining</span><strong>{totalPlannedSets - completedSets}</strong></p>
                  </div>
                </div>
                <div className="tipCard">
                  <span>TIP</span>
                  <p>Leave 1–2 good reps in reserve. Clean, repeatable sets build progress.</p>
                </div>
              </aside>
            </div>
          </div>
        )}

        {view === "progress" && (
          <div className="appPage">
            <div className="pageTitle">
              <div>
                <p className="eyebrow">HISTORY</p>
                <h1>Your progress</h1>
                <span>Every completed session adds to the bigger picture.</span>
              </div>
              <button
                className="primaryAction"
                onClick={() => openWorkout()}
                type="button"
              >
                Log a workout
              </button>
            </div>

            <div className="progressRangeTabs" aria-label="Progress time range">
              {(["4w", "12w", "all"] as ProgressRange[]).map((range) => (
                <button
                  aria-pressed={progressRange === range}
                  className={progressRange === range ? "active" : ""}
                  key={range}
                  onClick={() => setProgressRange(range)}
                  type="button"
                >
                  {range === "4w" ? "4 weeks" : range === "12w" ? "12 weeks" : "All time"}
                </button>
              ))}
            </div>

            <section className="progressKpis" aria-label="Progress summary">
              <article><span>COMPLETED</span><strong>{rangeCompleted}</strong><small>full workouts</small></article>
              <article><span>PARTIAL</span><strong>{rangePartial}</strong><small>saved sessions</small></article>
              <article><span>VOLUME</span><strong>{rangeVolume.toLocaleString()}</strong><small>kg lifted</small></article>
              <article><span>EST. 1RM</span><strong>{estimatedOneRepMax}</strong><small>best estimated kg</small></article>
            </section>

            <div className="progressGrid">
              <article className="chartPanel">
                <div className="panelTitle">
                  <div>
                    <p className="eyebrow">THIS WEEK</p>
                    <h2>Training consistency</h2>
                  </div>
                  <span>{weeklyLogs.length} workouts this week</span>
                </div>
                <div className="barChart" aria-label="Current week workout completion chart">
                  {activityBars.map((height, index) => (
                    <div key={index}>
                      <span style={{ height: `${height}%` }} />
                      <small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className="bodyWeightPanel">
                <div>
                  <p className="eyebrow">BODY WEIGHT</p>
                  <h2>Quick check-in</h2>
                  <span>
                    {bodyWeights[0]
                      ? `Latest ${bodyWeights[0].weight} kg · ${formatDate(bodyWeights[0].recordedAt)}`
                      : "Add your first measurement"}
                  </span>
                </div>
                <div className="bodyWeightEntry">
                  <label>
                    <span className="srOnly">Body weight in kilograms</span>
                    <input
                      inputMode="decimal"
                      max="400"
                      min="25"
                      onChange={(event) => setBodyWeightInput(event.target.value)}
                      placeholder="72.5"
                      step="0.1"
                      type="number"
                      value={bodyWeightInput}
                    />
                    <small>KG</small>
                  </label>
                  <button
                    disabled={saving || !bodyWeightInput}
                    onClick={() => void logBodyWeight()}
                    type="button"
                  >
                    Save
                  </button>
                </div>
                {bodyWeightProgress.length > 1 && (
                  <div className="bodyWeightBars" aria-label="Body weight trend">
                    {bodyWeightProgress.slice(-10).map((entry) => (
                      <span
                        key={`${entry.id}-${entry.recordedAt}`}
                        style={{
                          height: `${bodyWeightMax === bodyWeightMin
                            ? 55
                            : 25 + ((entry.weight - bodyWeightMin) /
                              (bodyWeightMax - bodyWeightMin)) * 65}%`,
                        }}
                        title={`${entry.weight} kg on ${formatDate(entry.recordedAt)}`}
                      />
                    ))}
                  </div>
                )}
              </article>
            </div>

            <section className="liftProgressPanel">
              <div className="panelTitle">
                <div>
                  <p className="eyebrow">EXERCISE PROGRESS</p>
                  <h2>Best weight over time</h2>
                </div>
                {exerciseNames.length > 0 && (
                  <label className="progressExerciseSelect">
                    <span className="srOnly">Choose an exercise</span>
                    <select
                      onChange={(event) =>
                        setProgressExercise(event.target.value)
                      }
                      value={activeProgressExercise}
                    >
                      {exerciseNames.map((name) => (
                        <option key={name}>{name}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {exerciseProgress.length ? (
                <div className="liftProgressBody">
                  <div
                    aria-label={`${activeProgressExercise} best weight history`}
                    className="liftBars"
                  >
                    {exerciseProgress.slice(-10).map((point, index) => (
                      <div key={`${point.date}-${index}`}>
                        <strong>{point.weight} kg</strong>
                        <span
                          style={{
                            height: `${Math.max(12, (point.weight / progressMax) * 100)}%`,
                          }}
                        />
                        <small>{formatDate(point.date)}</small>
                      </div>
                    ))}
                  </div>
                  <div className="liftProgressStats">
                    <div>
                      <span>LATEST</span>
                      <strong>
                        {exerciseProgress.at(-1)?.weight ?? 0}
                        <small> kg</small>
                      </strong>
                    </div>
                    <div>
                      <span>PERSONAL BEST</span>
                      <strong>
                        {progressMax}
                        <small> kg</small>
                      </strong>
                    </div>
                    <div>
                      <span>CHANGE</span>
                      <strong>
                        {exerciseProgress.length > 1
                          ? `${exerciseProgress.at(-1)!.weight - exerciseProgress[0].weight >= 0 ? "+" : ""}${exerciseProgress.at(-1)!.weight - exerciseProgress[0].weight}`
                          : "—"}
                        {exerciseProgress.length > 1 && <small> kg</small>}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="emptyLiftProgress">
                  <strong>No weight history yet</strong>
                  <p>
                    Complete sets with weight and reps to unlock exercise
                    progress charts and personal records.
                  </p>
                  <button onClick={() => openWorkout()} type="button">
                    Log your first sets
                  </button>
                </div>
              )}
            </section>

            <section className="historyPanel">
              <div className="panelTitle">
                <div>
                  <p className="eyebrow">ACTIVITY LOG</p>
                  <h2>Workout history</h2>
                </div>
              </div>
              {progressLogs.length ? (
                <div className="historyTable">
                  <div className="historyHead">
                    <span>WORKOUT</span>
                    <span>DATE</span>
                    <span>EXERCISES</span>
                    <span>DURATION</span>
                    <span>STATUS</span>
                  </div>
                  {progressLogs.map((log) => (
                    <div className="historyRow" key={log.id}>
                      <span>
                        <span
                          className={
                            workoutCompletionStatus(log) === "Completed"
                              ? "activityCheck"
                              : "activityCheck partial"
                          }
                        >
                          {workoutCompletionStatus(log) === "Completed" ? "✓" : "–"}
                        </span>
                        <span className="historyWorkoutCopy">
                          <strong>{log.workoutName}</strong>
                          {log.note && <small>{log.note}</small>}
                        </span>
                      </span>
                      <span>{formatDate(log.performedAt)}</span>
                      <span>{log.exercisesCompleted} / {log.totalExercises}</span>
                      <span>{log.duration} min</span>
                      <span
                        className={
                          workoutCompletionStatus(log) === "Completed"
                            ? "statusPill"
                            : "statusPill partial"
                        }
                      >
                        {workoutCompletionStatus(log)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyActivity onStart={() => openWorkout()} />
              )}
            </section>
          </div>
        )}
      </section>

      <nav className="mobileNav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button
            aria-current={view === item.id ? "page" : undefined}
            className={view === item.id ? "active" : ""}
            key={item.id}
            onClick={() =>
              item.id === "workout" ? openWorkout() : setView(item.id)
            }
            type="button"
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {pendingCoachPlan && (
        <div
          aria-labelledby="coach-plan-title"
          aria-modal="true"
          className="modalBackdrop"
          role="dialog"
        >
          <div className="confirmModal">
            <span className="confirmIcon">✦</span>
            <p className="eyebrow">APPLY COACH PLAN</p>
            <h2 id="coach-plan-title">Replace your current weekly plan?</h2>
            <p>
              <strong>{coachRecommendation.name}</strong> will become My Plan.
              Your workout history stays unchanged, and every exercise remains editable.
            </p>
            <div>
              <button
                className="secondaryAction"
                onClick={() => setPendingCoachPlan(false)}
                type="button"
              >
                Keep current plan
              </button>
              <button
                className="primaryAction"
                onClick={useCoachPlan}
                type="button"
              >
                Replace My Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {savedDraft && (
        <div
          aria-labelledby="resume-workout-title"
          aria-modal="true"
          className="modalBackdrop"
          role="dialog"
        >
          <div className="confirmModal">
            <span className="confirmIcon">↻</span>
            <p className="eyebrow">WORKOUT FOUND</p>
            <h2 id="resume-workout-title">Resume your unfinished workout?</h2>
            <p>
              <strong>{savedDraft.workoutTitle}</strong> has saved reps and
              completed sets from your previous visit.
            </p>
            <div>
              <button
                className="secondaryAction"
                onClick={discardSavedWorkout}
                type="button"
              >
                Discard draft
              </button>
              <button
                className="primaryAction"
                onClick={resumeSavedWorkout}
                type="button"
              >
                Resume workout
              </button>
            </div>
          </div>
        </div>
      )}

      {finishReview && (
        <div
          aria-labelledby="finish-workout-title"
          aria-modal="true"
          className="modalBackdrop"
          role="dialog"
        >
          <div className="confirmModal workoutFinishModal">
            <span className="confirmIcon">✓</span>
            <p className="eyebrow">FINISH WORKOUT</p>
            <h2 id="finish-workout-title">Review your session</h2>
            <div className="finishMetrics">
              <span><strong>{completedSets}</strong> sets</span>
              <span><strong>{currentWorkoutVolume.toLocaleString()}</strong> kg volume</span>
              <span><strong>{currentDurationMinutes}</strong> min</span>
            </div>
            <label className="workoutNoteField">
              <span>Workout note (optional)</span>
              <textarea
                maxLength={500}
                onChange={(event) => setWorkoutNote(event.target.value)}
                placeholder="Energy, technique, pain or anything to remember…"
                rows={3}
                value={workoutNote}
              />
              <small>{workoutNote.length}/500</small>
            </label>
            <div className="finishActions">
              <button
                className="secondaryAction"
                disabled={saving}
                onClick={() => setFinishReview(false)}
                type="button"
              >
                Continue workout
              </button>
              <button
                className="primaryAction"
                disabled={saving}
                onClick={() => void logWorkout()}
                type="button"
              >
                {saving ? "Saving…" : "Save workout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingReset && (
        <div
          aria-labelledby="reset-workout-title"
          aria-modal="true"
          className="modalBackdrop"
          role="alertdialog"
        >
          <div className="confirmModal">
            <span className="confirmIcon">×</span>
            <p className="eyebrow">RESET SESSION</p>
            <h2 id="reset-workout-title">Clear this workout?</h2>
            <p>
              All entered reps, completed sets, notes and elapsed time
              will be cleared.
            </p>
            <div>
              <button
                className="secondaryAction"
                onClick={() => setPendingReset(false)}
                type="button"
              >
                Keep workout
              </button>
              <button
                className="primaryAction"
                onClick={confirmWorkoutReset}
                type="button"
              >
                Reset everything
              </button>
            </div>
          </div>
        </div>
      )}

      {completedWorkoutSummary && (
        <div
          aria-labelledby="workout-saved-title"
          aria-modal="true"
          className="modalBackdrop"
          role="dialog"
        >
          <div className="confirmModal workoutCompleteModal">
            <span className="confirmIcon">✓</span>
            <p className="eyebrow">
              {completedWorkoutSummary.pendingSync ? "SAVED ON DEVICE" : "WORKOUT SAVED"}
            </p>
            <h2 id="workout-saved-title">
              {completedWorkoutSummary.workoutName} complete
            </h2>
            <div className="finishMetrics">
              <span><strong>{completedWorkoutSummary.completedSets}</strong> sets</span>
              <span><strong>{completedWorkoutSummary.volume.toLocaleString()}</strong> kg volume</span>
              <span><strong>{completedWorkoutSummary.duration}</strong> min</span>
            </div>
            {completedWorkoutSummary.personalRecords.length > 0 && (
              <div className="personalRecordSummary">
                <span aria-hidden="true">★</span>
                <p>
                  <strong>New personal record</strong>
                  {completedWorkoutSummary.personalRecords.join(", ")}
                </p>
              </div>
            )}
            {completedWorkoutSummary.note && (
              <p className="savedWorkoutNote">
                “{completedWorkoutSummary.note}”
              </p>
            )}
            {completedWorkoutSummary.pendingSync && (
              <p className="savedWorkoutNote">
                This workout will sync automatically when your connection returns.
              </p>
            )}
            <button
              className="primaryAction summaryDoneButton"
              onClick={() => setCompletedWorkoutSummary(null)}
              type="button"
            >
              View progress
            </button>
          </div>
        </div>
      )}

      {pendingWorkoutSwitch !== null && (
        <div
          aria-labelledby="switch-workout-title"
          aria-modal="true"
          className="modalBackdrop"
          role="dialog"
        >
          <div className="confirmModal">
            <span className="confirmIcon">↻</span>
            <p className="eyebrow">CHANGE WORKOUT</p>
            <h2 id="switch-workout-title">Switch to another session?</h2>
            <p>
              Your unsaved reps and completed sets in{" "}
              <strong>{workout.title}</strong> will be cleared.
            </p>
            <div>
              <button
                className="secondaryAction"
                onClick={() => setPendingWorkoutSwitch(null)}
                type="button"
              >
                Keep current workout
              </button>
              <button
                className="primaryAction"
                onClick={confirmWorkoutSwitch}
                type="button"
              >
                Switch and clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        aria-live="polite"
        className={notice ? "toast visible" : "toast"}
      >
        {notice}
      </div>
    </main>
  );
}
