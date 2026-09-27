// Ô chữ điền tự (田字格) — ô tập viết chữ Hán, là họa tiết nhận diện của app.
export function Tianzige({ char, size = 64 }: { char: string; size?: number }) {
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center border border-seal/50 bg-surface"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0 h-full w-full text-seal/25"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <g
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        >
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
          <line x1="0" y1="0" x2="100" y2="100" />
          <line x1="100" y1="0" x2="0" y2="100" />
        </g>
      </svg>
      <span
        className="relative font-hanzi font-medium leading-none"
        style={{ fontSize: size * 0.62 }}
      >
        {char}
      </span>
    </span>
  );
}

export function HanziWord({ text, size = 56 }: { text: string; size?: number }) {
  const chars = Array.from(text.replace(/\s/g, ''));
  return (
    <span className="inline-flex flex-wrap" lang="zh-CN" aria-label={text}>
      {chars.map((c, i) => (
        <span key={i} className={i > 0 ? '-ml-px' : ''}>
          <Tianzige char={c} size={size} />
        </span>
      ))}
    </span>
  );
}
