import { useCallback, useEffect, useMemo, useState } from "react";
import { Background } from "@/components/Background";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Rules } from "@/components/Rules";
import { PhaseList } from "@/components/PhaseList";
import { DeployPanel } from "@/components/DeployPanel";
import { VerifyList } from "@/components/VerifyList";
import { Footer } from "@/components/Footer";
import { useCountdown } from "@/hooks/useCountdown";
import { usePersistentState } from "@/hooks/usePersistentState";
import { SPRINT_TOTAL_MIN, launchChecks, phases } from "@/data/sprint";

function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent">
      <div
        className="h-full origin-left bg-gradient-to-r from-signal via-amber to-mint"
        style={{ transform: `scaleX(${p})`, transition: "transform .12s linear" }}
      />
    </div>
  );
}

export default function App() {
  const timer = useCountdown();
  const [done, setDone] = usePersistentState<Record<string, boolean>>("ship2h.tasks", {});
  const [checks, setChecks] = usePersistentState<Record<string, boolean>>("ship2h.checks", {});

  const tasksTotal = useMemo(
    () => phases.reduce((n, p) => n + p.tasks.length, 0),
    [],
  );

  const tasksDone = useMemo(
    () =>
      phases.reduce(
        (n, p) => n + p.tasks.filter((_, i) => done[`${p.id}:${i}`]).length,
        0,
      ),
    [done],
  );

  const current =
    phases.find(
      (p) => timer.elapsedMin >= p.start && timer.elapsedMin < p.start + p.minutes,
    ) ?? (timer.done ? phases[phases.length - 1] : null);

  const toggleTask = useCallback(
    (key: string) => setDone((d) => ({ ...d, [key]: !d[key] })),
    [setDone],
  );

  const toggleCheck = useCallback(
    (id: string) => setChecks((c) => ({ ...c, [id]: !c[id] })),
    [setChecks],
  );

  /** Move the clock so that `minute` minutes have elapsed. */
  const jumpTo = useCallback(
    (minute: number) => {
      timer.nudge((SPRINT_TOTAL_MIN - minute) * 60 - timer.left);
    },
    [timer],
  );

  const resetAll = useCallback(() => {
    setDone({});
    setChecks({});
    timer.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setDone, setChecks, timer]);

  const launchDone = launchChecks.filter((c) => checks[c.id]).length;

  return (
    <div className="relative min-h-dvh">
      <Background />
      <ScrollProgress />
      <Nav
        mmss={timer.mmss}
        running={timer.running}
        onStart={timer.running ? timer.pause : timer.start}
      />

      <main>
        <Hero
          timer={timer}
          current={current}
          tasksDone={tasksDone}
          tasksTotal={tasksTotal}
        />
        <Marquee />
        <Rules />
        <PhaseList
          phases={phases}
          elapsedMin={timer.elapsedMin}
          done={done}
          onToggle={toggleTask}
          onJump={jumpTo}
        />
        <DeployPanel />
        <VerifyList
          checks={checks}
          onToggle={toggleCheck}
          tasksDone={tasksDone}
          tasksTotal={tasksTotal}
          elapsedMin={timer.elapsedMin}
          onReset={resetAll}
        />
      </main>

      <Footer />

      {/* floating status */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:bottom-6">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-ink/90 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-fog shadow-[0_20px_50px_-20px_rgba(0,0,0,1)] backdrop-blur-xl">
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (timer.running ? "animate-blink bg-mint" : "bg-fog/50")
            }
          />
          <span className="tabular-nums text-chalk">{timer.hhmmss}</span>
          <span className="hidden text-line sm:inline">|</span>
          <span className="hidden sm:inline">
            {tasksDone}/{tasksTotal} tasks
          </span>
          <span className="hidden text-line sm:inline">|</span>
          <span className="hidden sm:inline">
            {launchDone}/{launchChecks.length} checks
          </span>
        </div>
      </div>
    </div>
  );
}
