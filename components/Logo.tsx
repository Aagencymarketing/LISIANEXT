import { cn } from "@/lib/utils";

/**
 * Logo placeholder LisiaNext. Sostituire con il logo ufficiale
 * (basta rimpiazzare l'SVG o usare un <Image src="/logo.svg" />).
 */
export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2f5cf0] to-[#1e3fae] shadow-sm">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V16H6.5"
            stroke="white"
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.08)"
          />
          <text
            x="12"
            y="13.5"
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill="white"
            fontFamily="Georgia, serif"
          >
            §
          </text>
        </svg>
      </div>
      {showText && (
        <div className="leading-none">
          <div className="text-[19px] font-extrabold tracking-tight">
            <span className="text-[#2f5cf0] dark:text-[#7c9bff]">lisia</span>
            <span className="text-accent">Next</span>
          </div>
          <div className="mt-0.5 text-[9px] font-semibold tracking-[0.22em] text-muted-2">
            LEGAL AI
          </div>
        </div>
      )}
    </div>
  );
}
