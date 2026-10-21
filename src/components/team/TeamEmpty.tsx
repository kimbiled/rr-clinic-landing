const GHOSTS = 6;

/** Empty tab: the card row as soft "ghost" frames with a centred note — same 375 px footprint as the doctors row. */
export function TeamEmpty({ label }: { label: string }) {
  return (
    <div className="team-empty relative h-[375px] overflow-hidden">
      <ul aria-hidden="true" className="flex w-max gap-5">
        {Array.from({ length: GHOSTS }, (_, i) => (
          <li key={i} className="team-card h-[375px] w-[296px] shrink-0 rounded-[20px] bg-[#f5f2ef]" style={{ ['--i' as string]: i }} />
        ))}
      </ul>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/10 via-white/60 to-white" />

      <div
        role="status"
        className="absolute inset-x-0 top-[150px] flex flex-col items-center text-center"
      >
        <p className="font-display text-[24px] leading-8 tracking-[-0.01em] text-neutral-900">Скоро здесь появится команда</p>
        <p className="mt-2 font-text text-[16px] leading-6 tracking-[-0.02em] text-[#97897d]">{label} — раздел в подготовке</p>
      </div>
    </div>
  );
}
