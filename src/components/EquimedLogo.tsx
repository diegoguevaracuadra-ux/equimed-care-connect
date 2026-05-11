import { Activity } from "lucide-react";

export function EquimedLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Activity className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">EQUIMED</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Equipos médicos
        </span>
      </div>
    </div>
  );
}
