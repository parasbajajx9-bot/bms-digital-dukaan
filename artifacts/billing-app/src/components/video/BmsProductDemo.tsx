import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Scene1 } from "./video_scenes/Scene1";
import { Scene2 } from "./video_scenes/Scene2";
import { Scene3 } from "./video_scenes/Scene3";
import { Scene4 } from "./video_scenes/Scene4";
import "./video.css";

declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

const SCENE_DURATIONS = [6500, 8500, 9500, 5500] as const;
const TOTAL_DURATION = SCENE_DURATIONS.reduce((sum, duration) => sum + duration, 0);

export function BmsProductDemo() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    window.startRecording?.();
    let raf = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startedAt) % TOTAL_DURATION;
      let nextScene = 0;
      let boundary = SCENE_DURATIONS[0];
      while (elapsed >= boundary && nextScene < SCENE_DURATIONS.length - 1) {
        nextScene += 1;
        boundary += SCENE_DURATIONS[nextScene];
      }
      setCurrentScene((previous) => previous === nextScene ? previous : nextScene);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      window.stopRecording?.();
    };
  }, []);

  const scenes = [<Scene1 key="scene-1" />, <Scene2 key="scene-2" />, <Scene3 key="scene-3" />, <Scene4 key="scene-4" />];

  return (
    <div className="bms-video-frame" aria-label="30 second animated BMS product demo">
      <div className="bms-video-backdrop" />
      <motion.div className="bms-orbit orbit-a" animate={{ x: currentScene === 0 ? "3vw" : currentScene === 1 ? "68vw" : currentScene === 2 ? "44vw" : "12vw", y: currentScene === 0 ? "10vh" : currentScene === 1 ? "56vh" : currentScene === 2 ? "8vh" : "62vh", scale: currentScene === 3 ? 1.5 : 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
      <motion.div className="bms-orbit orbit-b" animate={{ x: currentScene === 2 ? "16vw" : currentScene === 3 ? "77vw" : "80vw", y: currentScene === 1 ? "13vh" : currentScene === 3 ? "20vh" : "70vh", rotate: currentScene * 18 }} transition={{ duration: 1.45, ease: [0.16, 1, 0.3, 1] }} />
      <div className="bms-video-brand"><img src={`${import.meta.env.BASE_URL}logo192.png`} alt="BMS" /><span>BMS</span><small>BUSINESS MANAGEMENT SYSTEM</small></div>
      <div className="bms-video-runtime"><span className="bms-runtime-dot" />30 sec product demo</div>
      <AnimatePresence mode="sync" initial={false}>
        {scenes[currentScene]}
      </AnimatePresence>
      <div className="bms-video-progress" aria-hidden="true">
        <motion.div className="bms-progress-fill" animate={{ width: `${((currentScene + 1) / 4) * 100}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
}

export const BMS_VIDEO_DURATION_SECONDS = TOTAL_DURATION / 1000;