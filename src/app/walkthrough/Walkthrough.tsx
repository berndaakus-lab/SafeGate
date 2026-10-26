"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, CheckCircle2, Expand, KeyRound, Pause, PhoneCall, Play, Shrink, ShieldAlert, ShieldCheck, SkipBack, SkipForward } from "lucide-react";
import { PhoneCode, PhoneConfirmed, PhoneGuard, PhonePerson, PhoneScanner, PhoneSms, PhoneVerify } from "@/components/walkthrough/phones";

type Scene = { seconds: number; kicker?: string; title: string; points?: string[]; visual?: ReactNode; icon?: ReactNode };

function parentScenes(school: string): Scene[] {
  return [
    {
      seconds: 7,
      kicker: school ? `${school} parents` : "For parents",
      title: "Know exactly who collects your child.",
      points: ["How pickup works with VerifyGate, in about a minute."],
      icon: <ShieldCheck className="w-24 h-24 text-blue-300" />,
    },
    {
      seconds: 9,
      kicker: "Until now",
      title: "A paper notebook and a phone call.",
      points: ["Names get crossed out and pages torn.", "No record of who took which child.", "A phone call can't prove who is standing at the gate."],
      icon: (
        <div className="flex gap-6 text-amber-300">
          <BookOpen className="w-20 h-20" />
          <PhoneCall className="w-20 h-20" />
        </div>
      ),
    },
    {
      seconds: 10,
      kicker: "Step 1",
      title: "You add the people you trust.",
      points: ["A photo, their name and phone number.", "For a driver, the car number too.", "Only people on your list can ever be chosen."],
      visual: <PhonePerson />,
    },
    {
      seconds: 9,
      kicker: "Step 2",
      title: "You make a pickup code.",
      points: ["Choose your child and who is collecting today.", "A QR code appears on your phone, in about 30 seconds.", "Same person every day? Set up a regular pickup pass once, and skip the daily code."],
      visual: <PhoneCode />,
    },
    {
      seconds: 10,
      kicker: "Step 3",
      title: "The guard checks at the gate.",
      points: ["The guard scans the code.", "They see your child's photo and who is allowed to collect.", "They confirm only when it all matches."],
      visual: <PhoneGuard />,
    },
    {
      seconds: 9,
      kicker: "Step 4",
      title: "You hear about it straight away.",
      points: ["A text message tells you who collected your child, and when.", "It works on any phone, even a basic one."],
      visual: <PhoneSms />,
    },
    {
      seconds: 10,
      kicker: "Your child's safety",
      title: "Built so that mistakes are hard.",
      points: ["Each code works once, for one pickup.", "Codes run out after a short time.", "Every pickup is recorded by the school."],
      icon: <CheckCircle2 className="w-24 h-24 text-green-400" />,
    },
    {
      seconds: 14,
      kicker: "Getting started",
      title: "Four things to do.",
      points: [
        "1. Sign in with your phone number or email and the password the school gave you.",
        "2. Choose your own password and check your name.",
        "3. Add your child's photo and the people who may collect them.",
        "4. Make a code whenever someone is collecting.",
      ],
      icon: <ShieldCheck className="w-24 h-24 text-blue-300" />,
    },
    {
      seconds: 8,
      kicker: school || undefined,
      title: "Questions?",
      points: ["Ask now, or speak to the school office any time."],
      icon: <ShieldCheck className="w-24 h-24 text-blue-300" />,
    },
  ];
}

function staffScenes(school: string): Scene[] {
  return [
    {
      seconds: 7,
      kicker: school ? `${school} guards and teachers` : "For guards and teachers",
      title: "Checking pickups at the gate.",
      points: ["How to scan, check and confirm a pickup in VerifyGate."],
      icon: <ShieldCheck className="w-24 h-24 text-blue-300" />,
    },
    {
      seconds: 10,
      kicker: "Getting in",
      title: "Sign in with your own account.",
      points: [
        "Use your phone number or email and the password the school gave you.",
        "The first time, you choose your own password.",
        "Sign out when your duty ends.",
      ],
      icon: <KeyRound className="w-24 h-24 text-blue-300" />,
    },
    {
      seconds: 9,
      kicker: "Step 1",
      title: "Open the scanner.",
      points: ["Scan the parent's QR code: a daily code or a regular pickup pass.", "One driver for several families? One scan shows every family's children together.", "Camera not working? Type the code instead.", "No pass at all? Search the child's name and the parent gets a message to approve."],
      visual: <PhoneScanner />,
    },
    {
      seconds: 14,
      kicker: "Step 2",
      title: "Check three things.",
      points: [
        "Does the child's photo match the child?",
        "Is the person at the gate the one named, and in the photo?",
        "For a driver, does the car number match?",
      ],
      visual: <PhoneVerify />,
    },
    {
      seconds: 10,
      kicker: "Step 3",
      title: "Confirm only when it all matches.",
      points: ["Tap Confirm Pickup.", "Taking several children? Untick any who are not leaving now.", "The parent gets a text message straight away."],
      visual: <PhoneConfirmed />,
    },
    {
      seconds: 15,
      kicker: "When something is wrong",
      title: "If it doesn't match, don't release the child.",
      points: [
        "Already used: that code has been used. Do not release again.",
        "Code expired: ask the parent to make a new one.",
        "Different school or invalid code: do not release. Send the parent to the school office.",
        "No photo on file: be extra careful and check with the school office.",
      ],
      icon: <ShieldAlert className="w-24 h-24 text-amber-300" />,
    },
    {
      seconds: 8,
      kicker: school || undefined,
      title: "Questions?",
      points: ["Ask now, or speak to the school office any time."],
      icon: <ShieldCheck className="w-24 h-24 text-blue-300" />,
    },
  ];
}

export default function Walkthrough({ school, audience = "parents" }: { school: string; audience?: "parents" | "staff" }) {
  const scenes = useMemo(() => (audience === "staff" ? staffScenes(school) : parentScenes(school)), [audience, school]);
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0); // seconds into the current scene
  const [playing, setPlaying] = useState(true);
  const [idle, setIdle] = useState(false);
  const [full, setFull] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((i: number) => {
    setIndex(Math.min(scenes.length - 1, Math.max(0, i)));
    setElapsed(0);
  }, [scenes.length]);

  // Advance on a timer; stop on the last scene
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setElapsed((e) => {
        const next = e + 0.1;
        if (next < scenes[index].seconds) return next;
        if (index < scenes.length - 1) {
          setIndex(index + 1);
          return 0;
        }
        setPlaying(false);
        return scenes[index].seconds;
      });
    }, 100);
    return () => clearInterval(t);
  }, [playing, index, scenes]);

  const toggleFull = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Some browsers refuse; the page still works
    }
  }, []);

  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "f" || e.key === "F") toggleFull();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, toggleFull]);

  // Hide the controls while it plays and the mouse is still
  function wake() {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2500);
  }
  useEffect(() => () => { if (idleTimer.current) clearTimeout(idleTimer.current); }, []);

  const scene = scenes[index];
  const progress = Math.min(100, (elapsed / scene.seconds) * 100);
  const hideControls = playing && idle;

  return (
    <div onMouseMove={wake} onTouchStart={wake} className="min-h-screen bg-slate-900 text-white flex flex-col overflow-hidden select-none">
      <div className="h-1.5 bg-slate-800 shrink-0">
        <div className="h-full bg-blue-500 transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      <main key={index} className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-20 py-8 animate-[walk-in_0.6s_ease-out_both]">
        <div className={`w-full max-w-6xl flex flex-col ${scene.visual ? "lg:flex-row" : ""} items-center justify-center gap-10 lg:gap-20`}>
          <div className={`${scene.visual ? "lg:flex-1" : "text-center max-w-4xl"} min-w-0`}>
            {!scene.visual && scene.icon && <div className="flex justify-center mb-8">{scene.icon}</div>}
            {scene.kicker && (
              <p className="text-base sm:text-xl font-bold uppercase tracking-widest text-blue-300 mb-4">{scene.kicker}</p>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">{scene.title}</h1>
            {scene.points && (
              <ul className={`mt-8 space-y-4 text-xl sm:text-2xl lg:text-3xl text-slate-200 leading-snug ${scene.visual ? "" : "mx-auto"}`}>
                {scene.points.map((p, i) => (
                  <li key={p} className="animate-[walk-in_0.6s_ease-out_both]" style={{ animationDelay: `${0.35 + i * 0.35}s` }}>{p}</li>
                ))}
              </ul>
            )}
          </div>
          {scene.visual && (
            <div className="shrink-0 py-6 lg:py-10 scale-110 lg:scale-[1.35] origin-center motion-safe:animate-[walk-in_0.8s_ease-out_0.2s_both]">
              {scene.visual}
            </div>
          )}
        </div>
      </main>

      <footer className={`shrink-0 flex items-center justify-between gap-4 px-5 py-4 transition-opacity duration-300 ${hideControls ? "opacity-0" : "opacity-100"}`}>
        <div className="flex items-center gap-1" role="tablist" aria-label="Scenes">
          {scenes.map((s, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Go to scene ${i + 1}: ${s.title}`} onClick={() => go(i)}
              className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-blue-400" : "w-2.5 bg-slate-600 hover:bg-slate-400"}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous"
            className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center"><SkipBack className="w-5 h-5" /></button>
          <button type="button" onClick={() => {
            if (!playing && index === scenes.length - 1 && elapsed >= scene.seconds) go(0);
            setPlaying((p) => !p);
          }} aria-label={playing ? "Pause" : "Play"}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button type="button" onClick={() => go(index + 1)} disabled={index === scenes.length - 1} aria-label="Next"
            className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center"><SkipForward className="w-5 h-5" /></button>
          <button type="button" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"}
            className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
            {full ? <Shrink className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
