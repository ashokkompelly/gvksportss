import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const sessionKey = 'gvk-launch-seen-v1';
let seenInPage = false;
function alreadyLaunched() {
  try {
    return seenInPage || sessionStorage.getItem(sessionKey) === 'yes';
  } catch {
    return seenInPage;
  }
}
function rememberLaunch() {
  seenInPage = true;
  try {
    sessionStorage.setItem(sessionKey, 'yes');
  } catch {
    /* Keep the in-memory fallback when browser storage is unavailable. */
  }
}

export default function LaunchExperience({ settings, brand, loading, replay = false }) {
  const [done, setDone] = useState(() => !replay && alreadyLaunched());
  const [phase, setPhase] = useState('ready');
  const [seconds, setSeconds] = useState(5);
  const dialog = useRef(null);
  const viewport = useRef(null);
  const content = useRef(null);
  const deadline = useRef(0);
  const visible = !done && !loading && settings && (settings.enabled || replay);
  useLayoutEffect(() => {
    if (!visible) return;
    const stage = viewport.current;
    const panel = content.current;
    const fit = () => {
      const scale = Math.min(
        1,
        stage.clientHeight / panel.scrollHeight,
        stage.clientWidth / panel.scrollWidth,
      );
      panel.style.setProperty('--launch-fit', String(scale));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [visible, loading, phase, settings, brand]);
  const complete = useCallback(() => {
    rememberLaunch();
    setDone(true);
    window.dispatchEvent(new Event('gvk:launch-complete'));
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      const heading = document.querySelector('main h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }, []);
  useEffect(() => {
    if (!visible) return;
    const node = dialog.current;
    if (!node.open) node.showModal();
    // Count the first display, including visitors who refresh before completing it.
    rememberLaunch();
    window.dispatchEvent(new CustomEvent('gvk:launch-visibility', { detail: true }));
    return () => {
      node.close();
      window.dispatchEvent(new CustomEvent('gvk:launch-visibility', { detail: false }));
    };
  }, [visible]);
  useEffect(() => {
    if (!visible || phase !== 'countdown') return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000));
      setSeconds(remaining);
      if (!remaining) setPhase('revealing');
    };
    tick();
    const timer = window.setInterval(tick, 80);
    return () => window.clearInterval(timer);
  }, [phase, visible]);
  useEffect(() => {
    if (!visible || phase !== 'revealing') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(complete, reduced ? 250 : 2400);
    return () => window.clearTimeout(timer);
  }, [phase, visible, complete]);
  if (!visible) return null;
  const start = () => {
    if (phase !== 'ready' || loading) return;
    deadline.current = performance.now() + 5000;
    setSeconds(5);
    setPhase('countdown');
  };
  return createPortal(
    <dialog
      className={'launch-experience launch-phase-' + phase}
      ref={dialog}
      aria-labelledby={loading ? undefined : 'launch-title'}
      aria-label={loading ? 'Preparing the website launch' : undefined}
      onCancel={(event) => {
        event.preventDefault();
        complete();
      }}
    >
      <div className="launch-curtain">
        <div className="launch-spotlight launch-spotlight-left" aria-hidden="true" />
        <div className="launch-spotlight launch-spotlight-right" aria-hidden="true" />
        <div className="launch-grain" aria-hidden="true" />
        <div className="launch-stars" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <i key={index} style={{ '--i': index, top: 12 + ((index * 17) % 74) + '%' }} />
          ))}
        </div>
        <div className="launch-frame" aria-hidden="true" />
        <div className="launch-viewport" ref={viewport}>
          <div className="launch-content" ref={content}>
            <div className="launch-logo">
              <div className="launch-logo-orbit" aria-hidden="true" />
              {brand?.image && (
                <img src={brand.image} alt={brand.alt || brand.name || 'GVK Sportss'} />
              )}
            </div>
            {/* <div className="launch-brand">
              <span />
              {brand?.name || 'GVK SPORTSS'}
              <span />
            </div> */}
            {!loading && <p className="launch-tagline">{settings.tagline}</p>}
            {loading ? (
              <p className="launch-eyebrow" role="status">
                Preparing your front-row seat…
              </p>
            ) : (
              <>
                <p className="launch-eyebrow">
                  <Sparkles size={15} aria-hidden="true" />
                  {settings.eyebrow}
                </p>
                <h1 id="launch-title">{settings.title}</h1>
                <p className="launch-description">{settings.description}</p>
                <div className="launch-action-stage">
                  {phase === 'ready' ? (
                    <button type="button" className="launch-button" onClick={start}>
                      <span>{settings.buttonLabel}</span>
                      <ArrowUpRight size={22} aria-hidden="true" />
                    </button>
                  ) : (
                    <div
                      className="launch-countdown"
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <svg viewBox="0 0 160 160" aria-hidden="true">
                        <circle cx="80" cy="80" r="72" className="countdown-track" />
                        <circle cx="80" cy="80" r="72" className="countdown-progress" />
                      </svg>
                      <span className="launch-number" key={seconds}>
                        {seconds || <Sparkles size={44} />}
                      </span>
                      <span className="launch-countdown-label">
                        {phase === 'revealing' ? settings.welcomeLabel : settings.countdownLabel}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="launch-hem" aria-hidden="true" />
      </div>
      {!loading && (
        <button type="button" className="launch-skip" onClick={complete}>
          {settings.skipLabel}
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      )}
    </dialog>,
    document.body,
  );
}
