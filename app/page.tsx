"use client";

import { useEffect, useMemo, useState } from "react";

type Goal = "Build muscle" | "Get stronger" | "Lose fat" | "Move better";
type Experience = "Beginner" | "Intermediate" | "Advanced";
type Equipment = "Full gym" | "Dumbbells only" | "Bodyweight";
type View = "dashboard" | "plan" | "workout" | "progress";

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
};

type Workout = {
  day: string;
  title: string;
  duration: number;
  exercises: Exercise[];
  accent: string;
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
};

const goals: Goal[] = [
  "Build muscle",
  "Get stronger",
  "Lose fat",
  "Move better",
];

const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

const defaultProfile: Profile = {
  goal: "Build muscle",
  experience: "Intermediate",
  days: 4,
  equipment: "Full gym",
};

function toExercises(items: string[][]): Exercise[] {
  return items.map(([name, sets, focus]) => ({ name, sets, focus }));
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
  const [selectedWorkout, setSelectedWorkout] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [entries, setEntries] = useState<
    Record<string, { weight: string; reps: string }>
  >({});
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [profileId, setProfileId] = useState("");
  const [today, setToday] = useState("Today");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const workout =
    recommendation.workouts[selectedWorkout] ?? recommendation.workouts[0];
  const completedCount = Object.values(completed).filter(Boolean).length;
  const weeklyTarget = recommendation.workouts.length;
  const weeklyDone = Math.min(logs.length, weeklyTarget);
  const weeklyPercent = Math.round((weeklyDone / weeklyTarget) * 100);
  const totalMinutes = logs.reduce((sum, log) => sum + log.duration, 0);

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
          setRecommendation(JSON.parse(data.profile.planJson));
        }
        if (Array.isArray(data.logs)) setLogs(data.logs);
      })
      .catch(() => setNotice("Working offline — changes may not be saved."));
  }, []);

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
    setView("workout");
  }

  async function savePlan(next: Recommendation) {
    if (!profileId) return;
    setSaving(true);
    try {
      const response = await fetch("/api/fitness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-plan",
          profileId,
          profile,
          plan: next,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      setNotice("Plan saved");
    } catch {
      setNotice("Could not save the plan. Please try again.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setNotice(""), 2600);
    }
  }

  function generatePlan() {
    const next = buildRecommendation(profile);
    setRecommendation(next);
    setSelectedWorkout(0);
    setCompleted({});
    setEntries({});
    void savePlan(next);
  }

  async function logWorkout() {
    if (!profileId || completedCount === 0) return;
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
        }),
      });
      if (!response.ok) throw new Error("Log failed");
      const data = await response.json();
      setLogs((current) => [data.log, ...current].slice(0, 20));
      setCompleted({});
      setEntries({});
      setNotice("Workout saved to your history");
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
            <small>{profile.experience}</small>
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
                <h1>Ready to put in the work?</h1>
                <span>Your plan, performance and next session in one place.</span>
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
                <span className="heroTag">TODAY&apos;S RECOMMENDATION</span>
                <p>{workout.day} · {recommendation.name}</p>
                <h2>{workout.title}</h2>
                <div className="heroMeta">
                  <span><strong>{workout.duration}</strong> min</span>
                  <span><strong>{workout.exercises.length}</strong> exercises</span>
                  <span><strong>{profile.experience}</strong> level</span>
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
                <span>PLAN MATCH</span>
                <strong>92<small>%</small></strong>
                <p>Right intensity for your current goal and schedule.</p>
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
                  <small>TRAINING TIME</small>
                  <strong>{totalMinutes}</strong>
                  <span>minutes logged</span>
                </div>
                <span className="statTrend">This week</span>
              </article>
              <article className="statCard">
                <span className="statIcon blue">⌁</span>
                <div>
                  <small>CURRENT GOAL</small>
                  <strong className="goalStat">{profile.goal}</strong>
                  <span>{profile.days} training days</span>
                </div>
                <button
                  className="miniLink"
                  onClick={() => setView("plan")}
                  type="button"
                >
                  Change
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
                <p className="eyebrow">PROGRAM</p>
                <h1>My training plan</h1>
                <span>{recommendation.summary}</span>
              </div>
              <button
                className="primaryAction"
                disabled={saving}
                onClick={generatePlan}
                type="button"
              >
                {saving ? "Saving…" : "Update plan"}
              </button>
            </div>

            <div className="planWorkspace">
              <section className="planBoard">
                <div className="panelTitle">
                  <div>
                    <p className="eyebrow">WEEKLY SCHEDULE</p>
                    <h2>{recommendation.name}</h2>
                  </div>
                  <span>{weeklyTarget} days / week</span>
                </div>
                <div className="planRows">
                  {recommendation.workouts.map((item, index) => (
                    <button
                      key={`${item.day}-${item.title}`}
                      onClick={() => openWorkout(index)}
                      type="button"
                    >
                      <span
                        className="planIndex"
                        style={{ "--accent": item.accent } as React.CSSProperties}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="planInfo">
                        <small>{item.day}</small>
                        <strong>{item.title}</strong>
                      </span>
                      <span className="planMeta">
                        {item.exercises.length} exercises
                      </span>
                      <span className="planMeta">{item.duration} min</span>
                      <span className="openArrow" aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </section>

              <aside className="settingsPanel">
                <div className="panelTitle">
                  <div>
                    <p className="eyebrow">PLAN SETTINGS</p>
                    <h2>Personalise</h2>
                  </div>
                </div>
                <label>
                  <span>Primary goal</span>
                  <select
                    value={profile.goal}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        goal: event.target.value as Goal,
                      }))
                    }
                  >
                    {goals.map((goal) => (
                      <option key={goal}>{goal}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Experience level</span>
                  <select
                    value={profile.experience}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        experience: event.target.value as Experience,
                      }))
                    }
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label>
                  <span>Available equipment</span>
                  <select
                    value={profile.equipment}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        equipment: event.target.value as Equipment,
                      }))
                    }
                  >
                    <option>Full gym</option>
                    <option>Dumbbells only</option>
                    <option>Bodyweight</option>
                  </select>
                </label>
                <fieldset>
                  <legend>Training days</legend>
                  <div className="dayChoice">
                    {[2, 3, 4, 5].map((day) => (
                      <button
                        aria-pressed={profile.days === day}
                        className={profile.days === day ? "active" : ""}
                        key={day}
                        onClick={() =>
                          setProfile((current) => ({ ...current, days: day }))
                        }
                        type="button"
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <button
                  className="fullAction"
                  disabled={saving}
                  onClick={generatePlan}
                  type="button"
                >
                  {saving ? "Building your plan…" : "Build recommended plan"}
                </button>
                <p className="safety">
                  General fitness guidance only. Consult a qualified professional
                  if you have pain, an injury or a medical condition.
                </p>
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
                <strong>{completedCount}/{workout.exercises.length}</strong>
                <span>completed</span>
              </div>
            </div>

            <div className="loggerLayout">
              <section className="loggerPanel">
                <div className="loggerHeader">
                  <span>EXERCISE</span>
                  <span>WEIGHT</span>
                  <span>REPS</span>
                  <span>DONE</span>
                </div>
                {workout.exercises.map((exercise, index) => {
                  const key = `${workout.title}-${exercise.name}`;
                  const isDone = Boolean(completed[key]);
                  const entry = entries[key] ?? { weight: "", reps: "" };
                  return (
                    <div className={isDone ? "loggerRow done" : "loggerRow"} key={key}>
                      <span className="exerciseNumber">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="loggerExercise">
                        <strong>{exercise.name}</strong>
                        <small>{exercise.sets} · {exercise.focus}</small>
                      </span>
                      <label>
                        <span className="srOnly">Weight for {exercise.name}</span>
                        <input
                          inputMode="decimal"
                          onChange={(event) =>
                            setEntries((current) => ({
                              ...current,
                              [key]: { ...entry, weight: event.target.value },
                            }))
                          }
                          placeholder="kg"
                          value={entry.weight}
                        />
                      </label>
                      <label>
                        <span className="srOnly">Reps for {exercise.name}</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) =>
                            setEntries((current) => ({
                              ...current,
                              [key]: { ...entry, reps: event.target.value },
                            }))
                          }
                          placeholder="reps"
                          value={entry.reps}
                        />
                      </label>
                      <label className="doneControl">
                        <input
                          checked={isDone}
                          onChange={(event) =>
                            setCompleted((current) => ({
                              ...current,
                              [key]: event.target.checked,
                            }))
                          }
                          type="checkbox"
                        />
                        <span>{isDone ? "✓" : ""}</span>
                      </label>
                    </div>
                  );
                })}
                <div className="loggerFooter">
                  <button
                    className="secondaryAction"
                    onClick={() => {
                      setCompleted({});
                      setEntries({});
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
                <div className="sessionSummary">
                  <p className="eyebrow">SESSION SUMMARY</p>
                  <div
                    className="sessionRing"
                    style={{
                      "--progress": `${(completedCount / workout.exercises.length) * 360}deg`,
                    } as React.CSSProperties}
                  >
                    <span>{Math.round((completedCount / workout.exercises.length) * 100)}%</span>
                  </div>
                  <div className="summaryRows">
                    <p><span>Duration</span><strong>{workout.duration} min</strong></p>
                    <p><span>Completed</span><strong>{completedCount}</strong></p>
                    <p><span>Remaining</span><strong>{workout.exercises.length - completedCount}</strong></p>
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

      <div
        aria-live="polite"
        className={notice ? "toast visible" : "toast"}
      >
        {notice}
      </div>
    </main>
  );
}
