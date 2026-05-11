import logoUrl from "@/assets/equimed-logo.png";

export function EquimedLogo({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoUrl}
        alt="EQUIMED — Excellence and Quality"
        width={size}
        height={size}
        className="rounded-full object-contain"
        style={{ width: size, height: size }}
      />
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">EQUIMED</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Equipos médicos
        </span>
      </div>
    </div>
  );
}
