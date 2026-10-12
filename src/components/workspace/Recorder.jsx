import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Icon } from '../ui';
import { t } from '../../i18n';

/**
 * Real microphone check + recorder using the browser's MediaRecorder API.
 * Audio stays in memory on this device (blob URL) and is never uploaded.
 */
export default function Recorder({ onRecorded, compact }) {
  const [status, setStatus] = useState('idle'); // idle | requesting | ready | recording | denied | unsupported
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const rafRef = useRef(0);
  const timerRef = useRef(0);
  const ctxRef = useRef(null);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close?.();
    },
    []
  );

  const supported = typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined';

  const enable = async () => {
    if (!supported) return setStatus('unsupported');
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setStatus('ready');
    } catch {
      setStatus('denied');
    }
  };

  const start = () => {
    const chunks = [];
    const rec = new MediaRecorder(streamRef.current);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
      setClip((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { url, seconds: (Date.now() - rec.startedAt) / 1000 };
      });
      onRecorded?.({ seconds: (Date.now() - rec.startedAt) / 1000 });
    };
    rec.startedAt = Date.now();
    rec.start();
    recRef.current = rec;
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    setStatus('recording');
  };

  const stop = () => {
    recRef.current?.stop();
    clearInterval(timerRef.current);
    setStatus('ready');
  };

  const bars = 18;
  return (
    <div className={`recorder ${compact ? 'compact' : ''}`}>
      {status === 'idle' || status === 'requesting' ? (
        <div className="rec-intro">
          <span className="icon-tile steel"><Icon name="mic" /></span>
          <div className="grow">
            <strong className="small">{t('Microphone check')}</strong>
            <p className="xs subtle">{t('Your browser will ask for microphone permission. Recordings stay on this device and are not uploaded.')}</p>
          </div>
          <Button size="sm" onClick={enable} loading={status === 'requesting'}>
            {t('Enable microphone')}
          </Button>
        </div>
      ) : status === 'denied' ? (
        <Alert tone="warning" title={t('Microphone access was blocked')}>
          {t('Allow microphone access in your browser’s site settings, then try again.')}
          <div style={{ marginTop: 8 }}><Button size="sm" variant="secondary" onClick={enable}>{t('Try again')}</Button></div>
        </Alert>
      ) : status === 'unsupported' ? (
        <Alert tone="warning">{t('This browser does not support in-browser recording. Try a recent version of Chrome, Edge, Firefox or Safari.')}</Alert>
      ) : (
        <>
          <div className="rec-meter" aria-hidden="true">
            {Array.from({ length: bars }).map((_, i) => {
              const on = level * bars > i;
              return <span key={i} data-on={on} data-hot={i > bars * 0.8} />;
            })}
          </div>
          <div className="rec-controls">
            <span className="rec-status" role="status">
              {status === 'recording' ? (
                <>
                  <span className="rec-dot" /> {t('Recording')} · {String(Math.floor(elapsed / 60)).padStart(1, '0')}:{String(elapsed % 60).padStart(2, '0')}
                </>
              ) : level > 0.05 ? (
                <>
                  <Icon name="checkCircle" size={16} /> {t('Microphone is picking up sound')}
                </>
              ) : (
                t('Microphone ready — say something to test the level')
              )}
            </span>
            {status === 'recording' ? (
              <Button size="sm" variant="secondary" icon="square" onClick={stop}>
                {t('Stop')}
              </Button>
            ) : (
              <Button size="sm" icon="record" onClick={start}>
                {clip ? t('Re-record') : t('Start recording')}
              </Button>
            )}
          </div>
          {clip && status !== 'recording' && (
            <div className="rec-clip">
              <span className="xs subtle">{t('Your take · {s}s (kept on this device only)', { s: clip.seconds.toFixed(1) })}</span>
              <audio controls src={clip.url} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Reads text aloud with the browser's built-in speech synthesis — a stand-in for project audio files. */
export function SpeakButton({ text, lang = 'en-US' }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported]);
  if (!supported) return <p className="xs subtle">{t('Audio playback is not supported in this browser.')}</p>;
  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };
  return (
    <Button size="sm" variant="secondary" icon={speaking ? 'pause' : 'volume'} onClick={toggle}>
      {speaking ? t('Stop audio') : t('Play audio sample')}
    </Button>
  );
}
