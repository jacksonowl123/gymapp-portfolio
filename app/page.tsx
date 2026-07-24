"use client";

import { useEffect, useMemo, useState } from "react";

type Goal = "Build muscle" | "Get stronger" | "Lose fat" | "Move better";
type Experience = "Beginner" | "Intermediate" | "Advanced";
type Equipment = "Full gym" | "Dumbbells only" | "Bodyweight";

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

function toExercises(items: string[][]): Exercise[] {
  return items.map(([name, sets, focus]) => ({ name, sets, focus }));
}

function buildRecommendation(profile: Profile): Recommendation {
  const days = dayLabels.slice(0, profile.days);
  const isBeginner = profile.experience === "Beginner";

  let split: Array<keyof typeof exerciseLibrary>;
  let name: string;
  let summary: string;

  if (profile.goal === "Move better") {
    split =
      profile.days <= 3
        ? ["mobility", "full", "mobility"]
        : ["mobility", "upper", "mobility", "lower", "full"];
    name = "Move Well";
    summary = "Strength, control, and mobility without rushing the basics.";
  } else if (profile.goal === "Lose fat") {
    split =
      profile.days <= 3
        ? ["full", "conditioning", "full"]
        : ["upper", "lower", "conditioning", "full", "conditioning"];
    name = "Strong & Lean";
    summary = "Full-body strength paired with short, repeatable conditioning.";
  } else if (profile.days <= 3 || isBeginner) {
    split = ["full", "full", "full"];
    name = profile.goal === "Get stronger" ? "Foundation Strength" : "Full Body Build";
    summary = "Frequent full-body practice with enough recovery to progress.";
  } else if (profile.days === 4) {
    split = ["upper", "lower", "upper", "lower"];
    name = profile.goal === "Get stronger" ? "Upper / Lower Strength" : "Upper / Lower Build";
    summary = "A balanced four-day split with focused work and simple recovery.";
  } else {
    split = ["push", "pull", "lower", "upper", "conditioning"];
    name = profile.goal === "Get stronger" ? "Power Five" : "Build Five";
    summary = "Higher-frequency training with each session given one clear job.";
  }

  const activeSplit = split.slice(0, profile.days);
  const accents = ["#f36b35", "#d6e56f", "#7fb6a4", "#e0b2d3", "#79a8d8"];
  const workouts = activeSplit.map((type, index) => {
    const titleMap = {
      upper: index > 1 ? "Upper · Volume" : "Upper · Strength",
      lower: index > 1 ? "Lower · Volume" : "Lower · Strength",
      push: "Push · Chest & shoulders",
      pull: "Pull · Back & arms",
      full: `Full body · ${String.fromCharCode(65 + index)}`,
      conditioning: "Conditioning · Engine",
      mobility: "Mobility · Reset",
    };

    return {
      day: days[index],
      title: titleMap[type],
      duration: isBeginner ? 45 : type === "conditioning" ? 38 : 55,
      exercises: toExercises(exerciseLibrary[type]),
      accent: accents[index % accents.length],
    };
  });

  const equipmentNote =
    profile.equipment === "Full gym"
      ? "You have full equipment access, so the plan uses stable compound lifts and simple accessories."
      : profile.equipment === "Dumbbells only"
        ? "Every movement can be completed with dumbbells and a bench; swap cable work for supported dumbbell rows."
        : "Use controlled tempo and harder variations to keep bodyweight sessions challenging.";

  return {
    name,
    summary,
    reason: `${profile.days} days fits your week without creating unnecessary fatigue. ${equipmentNote}`,
    workouts,
  };
}

const defaultProfile: Profile = {
  goal: "Build muscle",
  experience: "Intermediate",
  days: 4,
  equipment: "Full gym",
};

function formatLogDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [recommendation, setRecommendation] = useState<Recommendation>(() =>
    buildRecommendation(defaultProfile),
  );
  const [selectedWorkout, setSelectedWorkout] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [profileId, setProfileId] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const workout =
    recommendation.workouts[selectedWorkout] ?? recommendation.workouts[0];
  const completedCount = Object.values(completed).filter(Boolean).length;
  const weeklyTarget = recommendation.workouts.length;
  const weeklyDone = Math.min(logs.length, weeklyTarget);
  const weeklyPercent = Math.round((weeklyDone / weeklyTarget) * 100);

  useEffect(() => {
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
      .catch(() => {
        // The app remains fully usable if persistence is temporarily unavailable.
      });
  }, []);

  const selectedDays = useMemo(
    () => new Set(recommendation.workouts.map((item) => item.day)),
    [recommendation],
  );

  async function savePlan(next: Recommendation) {
    if (!profileId) return;
    setSaveState("saving");
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
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2200);
    } catch {
      setSaveState("error");
    }
  }

  function generatePlan() {
    const next = buildRecommendation(profile);
    setRecommendation(next);
    setSelectedWorkout(0);
    setCompleted({});
    void savePlan(next);
    document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" });
  }

  async function logWorkout() {
    if (!profileId || completedCount === 0) return;
    setSaveState("saving");
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
      setLogs((current) => [data.log, ...current].slice(0, 8));
      setCompleted({});
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2200);
    } catch {
      setSaveState("error");
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Liftly home">
          <span className="brandGlyph" aria-hidden="true" />
          LIFTLY
        </a>
        <nav aria-label="Primary navigation">
          <a href="#today">Today</a>
          <a href="#plan">My plan</a>
          <a href="#coach">Coach</a>
        </nav>
        <a className="profilePill" href="#coach">
          <span>JL</span>
          <span className="profileText">
            <strong>My training</strong>
            <small>{recommendation.name}</small>
          </span>
          <span aria-hidden="true">⌄</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <p className="eyebrow">
            <span aria-hidden="true">✦</span> YOUR ADAPTIVE TRAINING PLAN
          </p>
          <h1>
            Train smarter.
            <br />
            <em>Show up stronger.</em>
          </h1>
          <p className="heroIntro">
            A plan built around your goal, your schedule, and the equipment you
            actually have—then adjusted as you log the work.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="#coach">
              Tune my plan <span aria-hidden="true">↗</span>
            </a>
            <a className="textButton" href="#today">
              Start today’s workout <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="heroVisual" aria-label="Weekly training overview">
          <div className="orangeOrb" aria-hidden="true" />
          <div className="weekCard">
            <div className="cardTopline">
              <span>THIS WEEK</span>
              <strong>{weeklyDone} / {weeklyTarget} sessions</strong>
            </div>
            <div className="weekBars" aria-label={`${weeklyPercent}% of weekly plan complete`}>
              {recommendation.workouts.map((item, index) => (
                <span
                  className={index < weeklyDone ? "filled" : ""}
                  key={item.day}
                />
              ))}
            </div>
            <p>
              <strong>{weeklyPercent}%</strong>
              <span>Keep the rhythm.<br />One session at a time.</span>
            </p>
          </div>
          <div className="nextCard">
            <span className="smallLabel">UP NEXT · {workout.day}</span>
            <h2>{workout.title}</h2>
            <div>
              <span>{workout.duration} min</span>
              <span>{workout.exercises.length} exercises</span>
            </div>
            <a href="#today" aria-label={`Open ${workout.title}`}>↗</a>
          </div>
          <p className="sideCaption">PLAN · TRAIN · TRACK · ADAPT</p>
        </div>
      </section>

      <section className="dashboard" id="today">
        <div className="sectionHeader">
          <div>
            <p className="sectionKicker">01 · TODAY</p>
            <h2>Make today count.</h2>
          </div>
          <div className="dateBadge">
            <span>{workout.day}</span>
            <strong>{workout.duration}</strong>
            <small>MINUTES</small>
          </div>
        </div>

        <div className="trainingGrid">
          <article className="workoutPanel">
            <div className="workoutHeading">
              <div>
                <span className="smallLabel">TODAY’S SESSION</span>
                <h3>{workout.title}</h3>
              </div>
              <span className="focusPill">{profile.goal}</span>
            </div>

            <div className="exerciseList">
              {workout.exercises.map((exercise, index) => {
                const key = `${workout.title}-${exercise.name}`;
                const isDone = Boolean(completed[key]);
                return (
                  <label className={isDone ? "exerciseRow done" : "exerciseRow"} key={key}>
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
                    <span className="checkmark" aria-hidden="true">
                      {isDone ? "✓" : String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="exerciseName">
                      <strong>{exercise.name}</strong>
                      <small>{exercise.focus}</small>
                    </span>
                    <span className="exerciseSets">{exercise.sets}</span>
                  </label>
                );
              })}
            </div>

            <div className="workoutFooter">
              <p>
                <strong>{completedCount}/{workout.exercises.length}</strong>
                exercises checked
              </p>
              <button
                className="primaryButton"
                disabled={completedCount === 0 || saveState === "saving"}
                onClick={logWorkout}
                type="button"
              >
                {saveState === "saving" ? "Saving…" : "Finish & log workout"}
                <span aria-hidden="true">✓</span>
              </button>
            </div>
          </article>

          <aside className="progressPanel">
            <span className="smallLabel">WEEKLY PROGRESS</span>
            <div
              className="progressRing"
              style={{ "--progress": `${weeklyPercent * 3.6}deg` } as React.CSSProperties}
            >
              <div>
                <strong>{weeklyPercent}%</strong>
                <span>complete</span>
              </div>
            </div>
            <div className="progressStats">
              <p><strong>{weeklyDone}</strong><span>sessions</span></p>
              <p><strong>{logs.reduce((sum, log) => sum + log.duration, 0)}</strong><span>total min</span></p>
            </div>
            <p className="progressMessage">
              {weeklyDone === 0
                ? "Your first check-in starts the streak."
                : weeklyDone < weeklyTarget
                  ? "Momentum is building. Keep your next session easy to start."
                  : "Plan complete. Recovery is part of the work."}
            </p>
          </aside>
        </div>
      </section>

      <section className="planSection" id="plan">
        <div className="sectionHeader lightHeader">
          <div>
            <p className="sectionKicker">02 · YOUR WEEK</p>
            <h2>{recommendation.name}</h2>
          </div>
          <p className="sectionDescription">{recommendation.summary}</p>
        </div>

        <div className="planGrid">
          {recommendation.workouts.map((item, index) => (
            <button
              className={selectedWorkout === index ? "planDay active" : "planDay"}
              key={`${item.day}-${item.title}`}
              onClick={() => {
                setSelectedWorkout(index);
                setCompleted({});
              }}
              style={{ "--day-accent": item.accent } as React.CSSProperties}
              type="button"
            >
              <span className="planDayTop">
                <strong>{item.day}</strong>
                <span>{index === selectedWorkout ? "UP NEXT" : `${item.duration} MIN`}</span>
              </span>
              <span className="planDayTitle">{item.title}</span>
              <span className="planDayMeta">
                <span>{item.exercises.length} exercises</span>
                <span aria-hidden="true">↗</span>
              </span>
            </button>
          ))}
          {dayLabels
            .filter((day) => !selectedDays.has(day))
            .slice(0, Math.max(0, 5 - recommendation.workouts.length))
            .map((day) => (
              <div className="planDay rest" key={day}>
                <span className="planDayTop"><strong>{day}</strong><span>REST</span></span>
                <span className="planDayTitle">Recover well</span>
                <span className="planDayMeta"><span>Walk · eat · sleep</span></span>
              </div>
            ))}
        </div>
      </section>

      <section className="coachSection" id="coach">
        <div className="coachIntro">
          <p className="sectionKicker">03 · LIFTLY COACH</p>
          <h2>A plan that fits <em>real life.</em></h2>
          <p>
            Tell us what you’re training for. Liftly will choose a practical
            weekly structure—then you can tune it whenever life changes.
          </p>
          <div className="coachNote">
            <span aria-hidden="true">✦</span>
            <p>
              <strong>Why this plan?</strong>
              {recommendation.reason}
            </p>
          </div>
        </div>

        <div className="quizCard">
          <div className="quizHeader">
            <div>
              <span className="smallLabel">PERSONALISE YOUR PLAN</span>
              <h3>What are you working toward?</h3>
            </div>
            <span className="quizStep">4 inputs</span>
          </div>

          <fieldset className="goalOptions">
            <legend>Primary goal</legend>
            {goals.map((goal) => (
              <button
                aria-pressed={profile.goal === goal}
                className={profile.goal === goal ? "selected" : ""}
                key={goal}
                onClick={() => setProfile((current) => ({ ...current, goal }))}
                type="button"
              >
                {goal}
              </button>
            ))}
          </fieldset>

          <div className="formGrid">
            <label>
              <span>EXPERIENCE</span>
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
              <span>EQUIPMENT</span>
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
          </div>

          <fieldset className="dayOptions">
            <legend>DAYS PER WEEK</legend>
            {[2, 3, 4, 5].map((day) => (
              <button
                aria-pressed={profile.days === day}
                className={profile.days === day ? "selected" : ""}
                key={day}
                onClick={() => setProfile((current) => ({ ...current, days: day }))}
                type="button"
              >
                <strong>{day}</strong>
                <span>days</span>
              </button>
            ))}
          </fieldset>

          <button className="generateButton" onClick={generatePlan} type="button">
            Build my recommended plan <span aria-hidden="true">→</span>
          </button>
          <p className="safetyNote">
            General fitness guidance only. If you have pain, an injury, or a
            medical condition, check with a qualified health professional first.
          </p>
        </div>
      </section>

      <section className="historySection">
        <div>
          <p className="sectionKicker">04 · YOUR LOG</p>
          <h2>Proof of the work.</h2>
        </div>
        <div className="historyList">
          {logs.length > 0 ? (
            logs.slice(0, 4).map((log) => (
              <article key={log.id}>
                <span className="historyDate">{formatLogDate(log.performedAt)}</span>
                <div>
                  <strong>{log.workoutName}</strong>
                  <small>{log.exercisesCompleted}/{log.totalExercises} exercises · {log.duration} min</small>
                </div>
                <span className="historyCheck" aria-label="Workout logged">✓</span>
              </article>
            ))
          ) : (
            <div className="emptyHistory">
              <span>01</span>
              <p><strong>Your log starts here.</strong> Check an exercise above, then finish the workout to record it.</p>
            </div>
          )}
        </div>
      </section>

      <footer>
        <a className="brand footerBrand" href="#top">
          <span className="brandGlyph" aria-hidden="true" /> LIFTLY
        </a>
        <p>Build the plan. Do the work. Keep the promise.</p>
        <a href="#top">Back to top ↑</a>
      </footer>

      <div
        aria-live="polite"
        className={saveState === "saved" || saveState === "error" ? "saveToast visible" : "saveToast"}
      >
        {saveState === "saved" ? "Saved to your training log ✓" : "Couldn’t save yet — please try again"}
      </div>
    </main>
  );
}
