'use client';

import { useEffect, useRef, useState } from 'react';

// Ghi âm bằng MediaRecorder rồi gắn file vào <input type="file" name={name}>
// để gửi cùng form như một file bình thường.
export function AudioRecorder({ name, label = 'Ghi âm' }: { name: string; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [state, setState] = useState<'idle' | 'recording' | 'done' | 'error'>('idle');
  const [url, setUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (state !== 'recording') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = recorder.mimeType || 'audio/webm';
        const ext = type.includes('mp4') ? 'm4a' : 'webm';
        const file = new File(chunks, `ghi-am.${ext}`, { type });
        const dt = new DataTransfer();
        dt.items.add(file);
        if (inputRef.current) inputRef.current.files = dt.files;
        setUrl(URL.createObjectURL(file));
        setState('done');
      };
      recorderRef.current = recorder;
      setSeconds(0);
      recorder.start();
      setState('recording');
    } catch {
      setState('error');
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" name={name} accept="audio/*" className="hidden" />
      <div className="flex flex-wrap items-center gap-3">
        {state === 'recording' ? (
          <button
            type="button"
            onClick={stop}
            className="btn bg-seal text-on-accent hover:bg-seal/90"
          >
            ■ Dừng · {seconds}s
          </button>
        ) : (
          <button type="button" onClick={start} className="btn-ghost">
            ● {state === 'done' ? 'Ghi lại' : label}
          </button>
        )}
        {url && <audio src={url} controls className="h-9 max-w-full" />}
      </div>
      {state === 'error' && (
        <p className="text-sm text-seal">
          Trình duyệt chưa cho dùng micro. Cho phép micro trong cài đặt trang rồi thử lại.
        </p>
      )}
    </div>
  );
}
