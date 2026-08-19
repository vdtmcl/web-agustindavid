import { useEffect, useRef } from "react";

type PointerPosition = { x: number; y: number };

const DEFAULT_POSITION: PointerPosition = { x: 50, y: 42 };

function App() {
  const targetPosition = useRef({ ...DEFAULT_POSITION });
  const currentPosition = useRef({ ...DEFAULT_POSITION });
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reducedMotion = reducedMotionQuery.matches;

    const setPosition = (x: number, y: number) => {
      root.style.setProperty("--pointer-x", `${x}%`);
      root.style.setProperty("--pointer-y", `${y}%`);
    };

    setPosition(DEFAULT_POSITION.x, DEFAULT_POSITION.y);

    const stopAnimation = () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };

    const interpolatePosition = () => {
      const current = currentPosition.current;
      const target = targetPosition.current;

      current.x += (target.x - current.x) * 0.075;
      current.y += (target.y - current.y) * 0.075;
      setPosition(current.x, current.y);

      const distance =
        Math.abs(target.x - current.x) + Math.abs(target.y - current.y);

      if (!reducedMotion && distance > 0.02) {
        animationFrame.current = requestAnimationFrame(interpolatePosition);
      } else {
        animationFrame.current = null;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === "touch") {
        return;
      }

      targetPosition.current = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };

      if (animationFrame.current === null) {
        animationFrame.current = requestAnimationFrame(interpolatePosition);
      }
    };

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;

      if (reducedMotion) {
        stopAnimation();
        targetPosition.current = { ...DEFAULT_POSITION };
        currentPosition.current = { ...DEFAULT_POSITION };
        setPosition(DEFAULT_POSITION.x, DEFAULT_POSITION.y);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      stopAnimation();
      window.removeEventListener("pointermove", handlePointerMove);
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
    };
  }, []);

  return (
    <main className="site-shell" aria-labelledby="site-title">
      <section className="intro" aria-label="Presentación">
        <h1 id="site-title">Agustín David | Realizador Audiovisual</h1>
        <p>desde el 2015 registrando en Valparaíso</p>
      </section>
    </main>
  );
}

export default App;
