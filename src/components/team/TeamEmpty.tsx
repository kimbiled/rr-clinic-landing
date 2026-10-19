const GHOSTS = 6;

/** Empty tab: the card row as soft "ghost" frames with a centred note — same 504 px footprint as the doctors row. */
export function TeamEmpty({ label }: { label: string }) {
  return (
    <div className="team-empty relative h-[504px] overflow-hidden">
      <ul aria-hidden="true" className="flex w-max gap-5">
        {Array.from({ length: GHOSTS }, (_, i) => (
          <li key={i} className="team-card w-[232px] shrink-0" style={{ ['--i' as string]: i }}>
            <div className="h-[300px] rounded-[24px] bg-[#e9e4df]/55" />
            <div className="mt-[22px] h-3.5 w-[150px] rounded-full bg-[#e9e4df]/70" />
            <div className="mt-[52px] h-2.5 w-[190px] rounded-full bg-[#e9e4df]/50" />
            <div className="mt-3 h-2.5 w-[130px] rounded-full bg-[#e9e4df]/50" />
          </li>
        ))}
      </ul>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/10 via-white/60 to-white" />

      <div
        role="status"
        className="absolute top-[150px] left-[max(132px,calc((100%-1440px)/2+132px))] flex w-[1176px] flex-col items-center text-center"
      >
        <p className="font-display text-[24px] leading-8 tracking-[-0.01em] text-neutral-900">Скоро здесь появится команда</p>
        <p className="mt-2 font-text text-[16px] leading-6 tracking-[-0.02em] text-[#97897d]">{label} — раздел в подготовке</p>
      </div>
    </div>
  );
}
