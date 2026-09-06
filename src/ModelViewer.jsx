import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./model-viewer.css";

const SceneCanvas = lazy(() => import("./SceneCanvas"));

const modelNames = {
  apartment: "Многоквартирный жилой дом",
  school: "Общеобразовательная школа",
  hospital: "Медицинский центр",
};

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure("render");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Icon({ name }) {
  const paths = {
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    reset: (
      <>
        <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
      </>
    ),
    plus: <path d="M5 12h14M12 5v14" />,
    minus: <path d="M5 12h14" />,
    cube: (
      <>
        <path d="m12 3 9 5v9l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5v9" />
      </>
    ),
    top: (
      <>
        <path d="M4 4h16v16H4ZM4 10h16M10 4v16" />
      </>
    ),
    angle: (
      <>
        <path d="m12 3 9 5v9l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v9" />
      </>
    ),
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/** A self-contained, lazy architectural model. Model assets live in public/models. */
export default function ModelViewer({ model = "apartment", compact = false }) {
  const safeModel = Object.hasOwn(modelNames, model) ? model : "apartment";
  // A model switch creates a fresh loader, camera, and error boundary.
  return <Viewer key={safeModel} model={safeModel} compact={compact} />;
}

function Viewer({ model, compact }) {
  const rootRef = useRef(null);
  const recoveryTimer = useRef(null);
  const autoRecoveryUsed = useRef(false);
  const [activated, setActivated] = useState(false);
  const [visible, setVisible] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [status, setStatus] = useState("poster");
  const [mode, setMode] = useState("facade");
  const [view, setView] = useState("perspective");
  const [attempt, setAttempt] = useState(0);
  const [command, setCommand] = useState(null);
  const active = visible && documentVisible;
  const ready = status === "ready";
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      setReducedMotion(motion.matches);
      setRotating(!motion.matches);
    };
    const applyVisibility = () =>
      setDocumentVisible(document.visibilityState === "visible");
    applyMotion();
    applyVisibility();
    motion.addEventListener("change", applyMotion);
    document.addEventListener("visibilitychange", applyVisibility);
    return () => {
      motion.removeEventListener("change", applyMotion);
      document.removeEventListener("visibilitychange", applyVisibility);
      window.clearTimeout(recoveryTimer.current);
    };
  }, []);

  useEffect(() => {
    const element = rootRef.current;
    if (!("IntersectionObserver" in window)) {
      setActivated(true);
      setVisible(true);
      setStatus("loading");
      return undefined;
    }
    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActivated(true);
          setStatus((previous) =>
            previous === "poster" ? "loading" : previous,
          );
          nearby.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    const onscreen = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.02 },
    );
    nearby.observe(element);
    onscreen.observe(element);
    return () => {
      nearby.disconnect();
      onscreen.disconnect();
    };
  }, []);

  const retry = useCallback(() => {
    window.clearTimeout(recoveryTimer.current);
    import("./SceneCanvas")
      .then(({ clearModelCache }) => {
        clearModelCache(model);
        setAttempt((previous) => previous + 1);
        setStatus("loading");
      })
      .catch(() => setStatus("fallback"));
  }, [model]);

  const onFailure = useCallback(
    (reason) => {
      setStatus("fallback");
      // Recover once automatically after a lost GPU context; keep the poster usable.
      if (reason === "context-lost" && !autoRecoveryUsed.current) {
        autoRecoveryUsed.current = true;
        recoveryTimer.current = window.setTimeout(retry, 1400);
      }
    },
    [retry],
  );
  const onReady = useCallback(() => setStatus("ready"), []);
  const issueCommand = useCallback((type) => {
    setCommand((previous) => ({
      type,
      sequence: (previous?.sequence || 0) + 1,
    }));
  }, []);

  const changeView = () => {
    setView((previous) => (previous === "perspective" ? "top" : "perspective"));
    setRotating(false);
  };
  const reset = () => {
    setView("perspective");
    issueCommand("reset");
  };
  const onKeyDown = (event) => {
    if (event.target !== event.currentTarget || !ready) return;
    const action = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      "+": "zoom-in",
      "=": "zoom-in",
      "-": "zoom-out",
      _: "zoom-out",
      Home: "reset",
    }[event.key];
    if (action) {
      event.preventDefault();
      setRotating(false);
      if (action === "reset") setView("perspective");
      issueCommand(action);
    } else if (event.code === "Space") {
      event.preventDefault();
      setRotating((previous) => !previous);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`fort-model${compact ? " fort-model--compact" : ""}`}
      data-viewer
      data-model={model}
      data-status={status}
      data-mode={mode}
      data-view={view}
      data-rotation={
        ready && rotating && active && view !== "top" ? "playing" : "paused"
      }
    >
      <div
        className="fort-model__stage"
        tabIndex={0}
        role="group"
        aria-label={`${modelNames[model]}. Стрелки — поворот, плюс и минус — масштаб, пробел — вращение.`}
        onKeyDown={onKeyDown}
      >
        <img
          className="fort-model__poster"
          src={`${base}models/${model}.jpg`}
          alt={`Архитектурная концепция: ${modelNames[model].toLowerCase()}`}
          width="1400"
          height="1100"
          loading="lazy"
          decoding="async"
          aria-hidden={ready}
        />
        {activated && status !== "fallback" && (
          <SceneBoundary key={attempt} onFailure={onFailure}>
            <Suspense fallback={null}>
              <SceneCanvas
                model={model}
                active={active}
                rotating={rotating}
                reducedMotion={reducedMotion}
                mode={mode}
                view={view}
                command={command}
                onReady={onReady}
                onFailure={onFailure}
              />
            </Suspense>
          </SceneBoundary>
        )}
        <div className="fort-model__caption" aria-hidden="true">
          <span className="fort-model__caption-dot" /> Архитектурная концепция
        </div>
        <div className="fort-model__orientation" aria-hidden="true">
          <span>С</span>
          <svg viewBox="0 0 40 40" fill="none">
            <path d="M20 3 13 29l7-5 7 5Z" fill="currentColor" />
            <path d="M20 3v21" stroke="#e8edf0" />
          </svg>
        </div>
        {status === "loading" && (
          <div className="fort-model__loading" role="status">
            <span />
            Подготавливаем макет
          </div>
        )}
        {status === "fallback" && (
          <div className="fort-model__fallback">
            <span>Архитектурный макет</span>
            <button type="button" onClick={retry}>
              Открыть 3D <span aria-hidden="true">↗</span>
            </button>
          </div>
        )}
        <div
          className="fort-model__toolbar"
          role="group"
          aria-label="Управление архитектурным макетом"
        >
          <button
            type="button"
            className="fort-model__rotation"
            onClick={() => setRotating((previous) => !previous)}
            disabled={!ready}
            aria-label={
              rotating ? "Приостановить вращение" : "Включить вращение"
            }
            aria-pressed={rotating}
            title={rotating ? "Приостановить вращение" : "Включить вращение"}
          >
            <Icon name={rotating ? "pause" : "play"} />
            <span>{rotating ? "Пауза" : "Вращать"}</span>
          </button>
          <span className="fort-model__separator" />
          <button
            type="button"
            onClick={() => issueCommand("zoom-in")}
            disabled={!ready}
            aria-label="Приблизить макет"
            title="Приблизить"
          >
            <Icon name="plus" />
          </button>
          <button
            type="button"
            onClick={() => issueCommand("zoom-out")}
            disabled={!ready}
            aria-label="Отдалить макет"
            title="Отдалить"
          >
            <Icon name="minus" />
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!ready}
            aria-label="Вернуть исходный ракурс"
            title="Исходный ракурс"
          >
            <Icon name="reset" />
          </button>
          <span className="fort-model__separator" />
          <button
            type="button"
            className="fort-model__mode"
            onClick={() =>
              setMode((previous) =>
                previous === "facade" ? "structure" : "facade",
              )
            }
            disabled={!ready}
            aria-label={
              mode === "facade"
                ? "Показать каркас здания"
                : "Показать фасады здания"
            }
            aria-pressed={mode === "structure"}
          >
            <Icon name="cube" />
            <span>Каркас</span>
          </button>
          <button
            type="button"
            className="fort-model__view"
            onClick={changeView}
            disabled={!ready}
            aria-label={
              view === "perspective"
                ? "Посмотреть сверху"
                : "Вернуть перспективу"
            }
            aria-pressed={view === "top"}
          >
            <Icon name={view === "perspective" ? "top" : "angle"} />
            <span>{view === "perspective" ? "Сверху" : "Перспектива"}</span>
          </button>
        </div>
      </div>
      <div className="fort-model__footer">
        <span>{modelNames[model]}</span>
        <span>Вращайте макет · приближайте детали</span>
      </div>
    </div>
  );
}
