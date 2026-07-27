"use client";

import { useEffect, useMemo, useState } from "react";

type Goal = "Build muscle" | "Get stronger" | "Lose fat" | "Move better";
type Experience = "Beginner" | "Intermediate" | "Advanced";
type Equipment = "Full gym" | "Dumbbells only" | "Bodyweight";
type View = "dashboard" | "plan" | "workout" | "progress";
type TrainingType =
  | "upper"
  | "lower"
  | "push"
  | "pull"
  | "full"
  | "conditioning"
  | "mobility";
type DayAssignment = TrainingType | "rest";

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
  rest?: string;
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
  sets?: Array<{
    exerciseName: string;
    setNumber?: number;
    weight: number;
    reps: number;
  }>;
};

const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

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

function hydrateExercise(exercise: Exercise): Exercise {
  const [setPart, ...repParts] = exercise.sets.split("×");
  return {
    ...exercise,
    setCount: exercise.setCount ?? (setPart.trim() || "3"),
    reps: exercise.reps ?? (repParts.join("×").trim() || "10"),
    rest: exercise.rest ?? "90 sec",
  };
}

function exercisePrescription(exercise: Exercise) {
  const hydrated = hydrateExercise(exercise);
  return `${hydrated.setCount} × ${hydrated.reps}`;
}

function plannedSetCount(exercise: Exercise) {
  const count = Number.parseInt(hydrateExercise(exercise).setCount ?? "1", 10);
  return Number.isFinite(count) ? Math.min(20, Math.max(1, count)) : 1;
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

function getExerciseVisual(exercise: Exercise) {
  const movement = `${exercise.name} ${exercise.focus}`.toLowerCase();

  if (
    movement.includes("bike") ||
    movement.includes("kettlebell") ||
    movement.includes("interval")
  ) {
    return { label: "Conditioning example", position: "100% 100%" };
  }

  if (
    movement.includes("core") ||
    movement.includes("dead bug") ||
    movement.includes("carry") ||
    movement.includes("stretch") ||
    movement.includes("full body")
  ) {
    return { label: "Core and mobility example", position: "50% 100%" };
  }

  if (
    movement.includes("deadlift") ||
    movement.includes("hinge") ||
    movement.includes("hamstring") ||
    movement.includes("posterior")
  ) {
    return { label: "Hip hinge example", position: "0% 100%" };
  }

  if (
    movement.includes("squat") ||
    movement.includes("lunge") ||
    movement.includes("leg") ||
    movement.includes("quad") ||
    movement.includes("calf") ||
    movement.includes("hip")
  ) {
    return { label: "Lower-body example", position: "100% 0%" };
  }

  if (
    movement.includes("row") ||
    movement.includes("pulldown") ||
    movement.includes("lat") ||
    movement.includes("back") ||
    movement.includes("curl") ||
    movement.includes("biceps") ||
    movement.includes("face pull") ||
    movement.includes("rear delt")
  ) {
    return { label: "Pull movement example", position: "50% 0%" };
  }

  return { label: "Push movement example", position: "0% 0%" };
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
      exercises: toExercises(exerciseLibrary[type]),
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en", {
    day: "numeric",
    month: "short",
  });
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
    Record<string, { weight: string; reps: string }>
  >({});
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [progressExercise, setProgressExercise] = useState("");
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerLabel, setTimerLabel] = useState("");
  const [profileId, setProfileId] = useState("");
  const [today, setToday] = useState("Today");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const workout =
    recommendation.workouts[selectedWorkout] ?? recommendation.workouts[0];
  const completedSets = Object.values(completed).filter(Boolean).length;
  const totalPlannedSets = workout.exercises.reduce(
    (sum, exercise) => sum + plannedSetCount(exercise),
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
  const weeklyTarget = recommendation.workouts.length;
  const weeklyDone = Math.min(logs.length, weeklyTarget);
  const weeklyPercent = Math.round((weeklyDone / weeklyTarget) * 100);
  const totalMinutes = logs.reduce((sum, log) => sum + log.duration, 0);
  const loggedSets = logs.flatMap((log) => log.sets ?? []);
  const totalVolume = Math.round(
    loggedSets.reduce((sum, set) => sum + set.weight * set.reps, 0),
  );
  const heaviestSet = loggedSets.reduce(
    (heaviest, set) => Math.max(heaviest, set.weight),
    0,
  );
  const exerciseNames = Array.from(
    new Set(loggedSets.map((set) => set.exerciseName)),
  ).sort();
  const activeProgressExercise = progressExercise || exerciseNames[0] || "";
  const exerciseProgress = logs
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

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );

    const existing = window.localStorage.getItem("liftly-profile-id");
    const id = existing ?? crypto.randomUUID();
    window.localStorage.setItem("liftly-profile-id", id);
    setProfileId(id);

    fetch(`/api/fitness?profileId=${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load");
        return response.json();
      })
      .then((data) => {
        if (data.profile?.planJson) {
          const savedProfile: Profile = {
            goal: data.profile.goal,
            experience: data.profile.experience,
            days: data.profile.days,
            equipment: data.profile.equipment,
          };
          setProfile(savedProfile);
          const savedPlan = JSON.parse(data.profile.planJson) as Recommendation;
          setRecommendation(savedPlan);
          setWeekSchedule(scheduleFromWorkouts(savedPlan.workouts));
          setDayExercises(exercisesFromWorkouts(savedPlan.workouts));
        }
        if (Array.isArray(data.logs)) setLogs(data.logs);
      })
      .catch(() => setNotice("Working offline — changes may not be saved."));
  }, []);

  useEffect(() => {
    if (timerLeft <= 0) return;
    const timeout = window.setTimeout(
      () => setTimerLeft((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearTimeout(timeout);
  }, [timerLeft]);

  useEffect(() => {
    if (timerLeft !== 0 || !timerLabel) return;
    setNotice(`Rest complete — ready for your next ${timerLabel} set.`);
    setTimerLabel("");
    const timeout = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [timerLeft, timerLabel]);

  const activityBars = useMemo(() => {
    const source = logs.slice(0, 7).reverse();
    return Array.from({ length: 7 }, (_, index) => {
      const log = source[index];
      return log
        ? Math.max(28, Math.round((log.exercisesCompleted / log.totalExercises) * 100))
        : index === 6
          ? 12
          : 6;
    });
  }, [logs]);

  function openWorkout(index = selectedWorkout) {
    setSelectedWorkout(index);
    setCompleted({});
    setEntries({});
    setTimerLeft(0);
    setTimerLabel("");
    setView("workout");
  }

  function selectWorkout(index: number) {
    if (index === selectedWorkout) return;
    const hasDraft =
      completedSets > 0 ||
      Object.values(entries).some(
        (entry) => entry.weight.trim() || entry.reps.trim(),
      );
    if (hasDraft) {
      setPendingWorkoutSwitch(index);
      return;
    }
    openWorkout(index);
  }

  function confirmWorkoutSwitch() {
    if (pendingWorkoutSwitch === null) return;
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
    setTimerLeft(restToSeconds(exercise.rest));
    setTimerLabel(exercise.name);
  }

  async function savePlan(
    next: Recommendation,
    nextProfile = profile,
    successMessage = "Plan saved",
  ) {
    if (!profileId) return;
    setSaving(true);
    try {
      const response = await fetch("/api/fitness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-plan",
          profileId,
          profile: nextProfile,
          plan: next,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      setNotice(successMessage);
    } catch {
      setNotice("Could not save the plan. Please try again.");
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
    field: "name" | "setCount" | "reps" | "rest",
    value: string,
  ) {
    setDayExercises((current) => ({
      ...current,
      [day]: (current[day] ?? []).map((exercise, exerciseIndex) => {
        if (exerciseIndex !== index) return exercise;
        const next = { ...hydrateExercise(exercise), [field]: value };
        return {
          ...next,
          sets: `${next.setCount} × ${next.reps}`,
        };
      }),
    }));
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
          rest: "90 sec",
        },
      ],
    }));
  }

  function removeDayExercise(day: string, index: number) {
    setDayExercises((current) => ({
      ...current,
      [day]: (current[day] ?? []).filter(
        (_, exerciseIndex) => exerciseIndex !== index,
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
    const nextDayExercises = { ...dayExercises, [day]: exercises };
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
        return Array.from(
          { length: plannedSetCount(exercise) },
          (_, setIndex) => {
            const setNumber = setIndex + 1;
            const key = `${baseKey}-${setNumber}`;
            const entry = entries[key];
            const weight = Number(entry?.weight);
            const reps = Number(entry?.reps);
            if (!completed[key] || weight <= 0 || reps <= 0) return [];
            return [{
              exerciseName: exercise.name,
              setNumber,
              weight,
              reps,
            }];
          },
        ).flat();
      },
    );
    if (completedSetPayload.length !== completedSets) {
      setNotice("Add weight and reps before marking a set complete.");
      window.setTimeout(() => setNotice(""), 2800);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/fitness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "log-workout",
          profileId,
          workoutName: workout.title,
          duration: workout.duration,
          exercisesCompleted: completedCount,
          totalExercises: workout.exercises.length,
          sets: completedSetPayload,
        }),
      });
      if (!response.ok) throw new Error("Log failed");
      const data = await response.json();
      setLogs((current) => [data.log, ...current].slice(0, 20));
      setCompleted({});
      setEntries({});
      setTimerLeft(0);
      setTimerLabel("");
      setNotice(
        data.personalRecords?.length
          ? `New personal record: ${data.personalRecords.join(", ")}`
          : "Workout saved to your history",
      );
      setView("progress");
    } catch {
      setNotice("Could not save this workout. Please try again.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setNotice(""), 2800);
    }
  }

  const navItems: Array<{ id: View; label: string; icon: string }> = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "plan", label: "My plan", icon: "▦" },
    { id: "workout", label: "Log workout", icon: "+" },
    { id: "progress", label: "Progress", icon: "◔" },
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
              onClick={() => setView(item.id)}
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

        <button className="userCard" type="button">
          <span className="avatar">JL</span>
          <span>
            <strong>My profile</strong>
            <small>Lift tracker</small>
          </span>
          <span aria-hidden="true">•••</span>
        </button>
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
            <button
              className="headerIcon"
              aria-label="Notifications"
              type="button"
            >
              ◌
              <span />
            </button>
            <button
              className="primaryAction"
              onClick={() => openWorkout()}
              type="button"
            >
              <span aria-hidden="true">＋</span> Start workout
            </button>
          </div>
        </header>

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
                    •••
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
                className="primaryAction"
                disabled={saving}
                onClick={saveManualPlan}
                type="button"
              >
                {saving ? "Saving…" : "Save weekly plan"}
              </button>
            </div>

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
                    return (
                      <div className="dayPlanGroup" key={day}>
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
                              <span>REST</span>
                              <span>ORDER</span>
                            </div>
                            {exercises.map((exercise, exerciseIndex) => {
                              const hydrated = hydrateExercise(exercise);
                              const isDragging =
                                draggedExercise?.day === day &&
                                draggedExercise.index === exerciseIndex;
                              const isDropTarget =
                                dragTarget?.day === day &&
                                dragTarget.index === exerciseIndex &&
                                !isDragging;
                              return (
                                <div
                                  className={[
                                    "exerciseEditRow",
                                    isDragging ? "dragging" : "",
                                    isDropTarget ? "dropTarget" : "",
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
                  <span className="futureBadge">FUTURE FEATURE</span>
                  <div>
                    <p className="eyebrow">AI COACH</p>
                    <h2>Recommended plans</h2>
                    <p>
                      Later, AI can use your goal, experience and available
                      equipment to suggest a weekly plan. For now, your schedule
                      stays completely in your control.
                    </p>
                  </div>
                <button
                  className="futureAction"
                  disabled
                  type="button"
                >
                  AI coach coming later
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
                <span>{workout.duration} min · {workout.exercises.length} exercises</span>
              </div>
              <div className="sessionProgress">
                <strong>{completedSets}/{totalPlannedSets}</strong>
                <span>sets completed</span>
              </div>
            </div>

            <section className="workoutChooser">
              <div className="workoutChooserHeader">
                <div>
                  <p className="eyebrow">CHOOSE YOUR SESSION</p>
                  <h2>Which workout are you doing?</h2>
                </div>
                <button onClick={() => setView("plan")} type="button">
                  Edit exercises in My Plan
                </button>
              </div>
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
                      <small>
                        {item.exercises.length} exercises ·{" "}
                        {item.exercises.reduce(
                          (sum, exercise) => sum + plannedSetCount(exercise),
                          0,
                        )}{" "}
                        sets
                      </small>
                    </span>
                    <span className="workoutChoiceState">
                      {index === selectedWorkout ? "SELECTED" : "CHOOSE"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <div className="loggerLayout">
              <section className="loggerPanel">
                {workout.exercises.map((exercise, index) => {
                  const baseKey = `${workout.day}-${workout.title}-${index}`;
                  const visual = getExerciseVisual(exercise);
                  const previous = previousPerformance(exercise.name);
                  const exerciseDone = Array.from(
                    { length: plannedSetCount(exercise) },
                    (_, setIndex) =>
                      completed[`${baseKey}-${setIndex + 1}`],
                  ).every(Boolean);
                  return (
                    <div
                      className={exerciseDone ? "loggerExerciseBlock done" : "loggerExerciseBlock"}
                      key={baseKey}
                    >
                      <div className="loggerExerciseTop">
                        <span
                          aria-label={visual.label}
                          className="exerciseVisual"
                          role="img"
                          style={{
                            "--exercise-position": visual.position,
                          } as React.CSSProperties}
                        >
                          <span className="exerciseNumber">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </span>
                        <span className="loggerExercise">
                          <strong>{exercise.name}</strong>
                          <small>
                            Target {exercisePrescription(exercise)} · {exercise.rest ?? "90 sec"} rest
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
                      <div className="setLoggerHead">
                        <span>SET</span>
                        <span>PREVIOUS</span>
                        <span>KG</span>
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
                              weight: "",
                              reps: "",
                            };
                            const previousSet = previous[setIndex];
                            return (
                              <div
                                className={isDone ? "setLoggerRow done" : "setLoggerRow"}
                                key={key}
                              >
                                <span className="setNumber">{setNumber}</span>
                                <span className="previousSet">
                                  {previousSet
                                    ? `${previousSet.weight} × ${previousSet.reps}`
                                    : "—"}
                                </span>
                                <label>
                                  <span className="srOnly">
                                    Weight for {exercise.name}, set {setNumber}
                                  </span>
                                  <input
                                    inputMode="decimal"
                                    onChange={(event) =>
                                      setEntries((current) => ({
                                        ...current,
                                        [key]: {
                                          ...entry,
                                          weight: event.target.value,
                                        },
                                      }))
                                    }
                                    placeholder={previousSet ? String(previousSet.weight) : "kg"}
                                    value={entry.weight}
                                  />
                                </label>
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
                                      setCompleted((current) => ({
                                        ...current,
                                        [key]: checked,
                                      }));
                                      if (checked) startRestTimer(exercise);
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
                    </div>
                  );
                })}
                <div className="loggerFooter">
                  <button
                    className="secondaryAction"
                    onClick={() => {
                      setCompleted({});
                      setEntries({});
                      setTimerLeft(0);
                      setTimerLabel("");
                    }}
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    className="primaryAction"
                    disabled={completedCount === 0 || saving}
                    onClick={logWorkout}
                    type="button"
                  >
                    {saving ? "Saving…" : "Finish and save workout"}
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
                  <div>
                    <button
                      disabled={timerLeft <= 0}
                      onClick={() =>
                        setTimerLeft((current) => Math.max(0, current - 15))
                      }
                      type="button"
                    >
                      −15s
                    </button>
                    <button
                      disabled={timerLeft <= 0}
                      onClick={() => setTimerLeft((current) => current + 15)}
                      type="button"
                    >
                      +15s
                    </button>
                    <button
                      disabled={timerLeft <= 0}
                      onClick={() => {
                        setTimerLeft(0);
                        setTimerLabel("");
                      }}
                      type="button"
                    >
                      Skip
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
                    <p><span>Duration</span><strong>{workout.duration} min</strong></p>
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

            <div className="progressGrid">
              <article className="chartPanel">
                <div className="panelTitle">
                  <div>
                    <p className="eyebrow">LAST 7 SESSIONS</p>
                    <h2>Training consistency</h2>
                  </div>
                  <span>{logs.length} total workouts</span>
                </div>
                <div className="barChart" aria-label="Recent workout completion chart">
                  {activityBars.map((height, index) => (
                    <div key={index}>
                      <span style={{ height: `${height}%` }} />
                      <small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className="progressSummary">
                <p className="eyebrow">TOTALS</p>
                <div>
                  <strong>{logs.length}</strong>
                  <span>workouts</span>
                </div>
                <div>
                  <strong>{totalMinutes}</strong>
                  <span>minutes trained</span>
                </div>
                <div>
                  <strong>
                    {logs.reduce((sum, log) => sum + log.exercisesCompleted, 0)}
                  </strong>
                  <span>exercises completed</span>
                </div>
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
              {logs.length ? (
                <div className="historyTable">
                  <div className="historyHead">
                    <span>WORKOUT</span>
                    <span>DATE</span>
                    <span>EXERCISES</span>
                    <span>DURATION</span>
                    <span>STATUS</span>
                  </div>
                  {logs.map((log) => (
                    <div className="historyRow" key={log.id}>
                      <span><span className="activityCheck">✓</span><strong>{log.workoutName}</strong></span>
                      <span>{formatDate(log.performedAt)}</span>
                      <span>{log.exercisesCompleted} / {log.totalExercises}</span>
                      <span>{log.duration} min</span>
                      <span className="statusPill">Completed</span>
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
            onClick={() => setView(item.id)}
            type="button"
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

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
              Your unsaved weights, reps and completed sets in{" "}
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
