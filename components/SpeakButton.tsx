'use client';

// Đọc chữ Hán bằng giọng tiếng Trung có sẵn của trình duyệt (miễn phí).
export function SpeakButton({ text }: { text: string }) {
  function speak() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }
  return (
    <button type="button" onClick={speak} className="btn-ghost px-2 py-1 text-xs" aria-label={`Nghe ${text}`}>
      ▶ Nghe
    </button>
  );
}
