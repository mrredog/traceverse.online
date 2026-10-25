/** The TraceVerse logo mark on a black tile. */
export function LogoMark({ className = "size-11" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl bg-black ${className}`}>
      <img src="/logo-mark.png" alt="TraceVerse" className="size-[58%] object-contain" />
    </span>
  );
}
