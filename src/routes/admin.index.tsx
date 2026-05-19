import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LogOut,
  Search,
  Check,
  X,
  TrendingUp,
  Inbox,
  Clock3,
  CheckCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { format, startOfMonth, subMonths, parseISO, startOfWeek, addDays, isSameWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { EquimedLogo } from "@/components/EquimedLogo";
import { EstadoBadge } from "./index";
import {
  getReservas, isAdminAuth, setAdminAuth, updateEstado, type Reserva,
} from "@/lib/equimed";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Panel administrativo — EQUIMED" },
      { name: "description", content: "Dashboard interno de EQUIMED." },
    ],
  }),
  component: AdminDashboard,
});

type Vista = "Semanal" | "Mensual" | "Anual";

function AdminDashboard() {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState<"dashboard" | "reservas" | "calendario">("dashboard");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [vista, setVista] = useState<Vista>("Mensual");

  useEffect(() => {
    if (!isAdminAuth()) {
      navigate({ to: "/admin/login" });
      return;
    }
    setReservas(getReservas());
    const h = () => setReservas(getReservas());
    window.addEventListener("equimed:reservas", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("equimed:reservas", h);
      window.removeEventListener("storage", h);
    };
  }, [navigate]);

  const logout = () => {
    setAdminAuth(false);
    navigate({ to: "/admin/login" });
  };

  const kpis = useMemo(() => {
    const total = reservas.length;
    const pendientes = reservas.filter((r) => r.estado === "Pendiente").length;
    const aceptadas = reservas.filter((r) => r.estado === "Aceptada").length;
    const semana = reservas.filter((r) =>
      isSameWeek(parseISO(r.fechaSolicitud), new Date(), { weekStartsOn: 1 }),
    ).length;
    return { total, pendientes, aceptadas, semana };
  }, [reservas]);

  const handleEstado = (numero: string, estado: "Aceptada" | "Rechazada") => {
    updateEstado(numero, estado);
    toast.success(`Reserva ${numero} ${estado.toLowerCase()}`);
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar seccion={seccion} setSeccion={setSeccion} />
      <div className="flex flex-1 flex-col">
        <TopBar onLogout={logout} />
        <main className="flex-1 p-4 md:p-8">
          {seccion === "dashboard" && (
            <DashboardSection kpis={kpis} reservas={reservas} vista={vista} setVista={setVista} onEstado={handleEstado} />
          )}
          {seccion === "reservas" && (
            <ReservasSection reservas={reservas} onEstado={handleEstado} />
          )}
          {seccion === "calendario" && <CalendarioSection reservas={reservas} />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  seccion, setSeccion,
}: { seccion: string; setSeccion: (s: "dashboard" | "reservas" | "calendario") => void }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "reservas", label: "Reservas", icon: ClipboardList },
    { id: "calendario", label: "Calendario", icon: CalendarDays },
  ] as const;
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="border-b border-sidebar-border bg-white/5 px-4 py-4">
        <div className="rounded-lg bg-white px-3 py-2">
          <EquimedLogo />
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = seccion === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setSeccion(it.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-sidebar-foreground/50">v1.0 · EQUIMED</div>
    </aside>
  );
}

function TopBar({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-8">
      <div>
        <div className="text-xs text-muted-foreground">Bienvenido</div>
        <div className="text-sm font-semibold">Administrador EQUIMED</div>
      </div>
      <div className="flex items-center gap-2 md:hidden">
        <EquimedLogo />
      </div>
      <Button variant="outline" size="sm" onClick={onLogout}>
        <LogOut className="mr-1 h-4 w-4" /> Cerrar sesión
      </Button>
    </header>
  );
}

function DashboardSection({
  kpis, reservas, vista, setVista, onEstado,
}: {
  kpis: { total: number; pendientes: number; aceptadas: number; semana: number };
  reservas: Reserva[];
  vista: Vista;
  setVista: (v: Vista) => void;
  onEstado: (n: string, e: "Aceptada" | "Rechazada") => void;
}) {
  const barData = useMemo(() => {
    const meses: { mes: string; total: number }[] = [];
    const base = startOfMonth(new Date());
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(base, i);
      const label = format(d, "MMM yy", { locale: es });
      const total = reservas.filter((r) => {
        const dr = parseISO(r.fechaSolicitud);
        return dr.getMonth() === d.getMonth() && dr.getFullYear() === d.getFullYear();
      }).length;
      meses.push({ mes: label, total });
    }
    return meses;
  }, [reservas]);

  const donaData = useMemo(() => {
    const c = reservas.filter((r) => r.equipo.tipoMantenimiento === "Correctivo").length;
    const p = reservas.filter((r) => r.equipo.tipoMantenimiento === "Preventivo").length;
    return [
      { name: "Correctivo", value: c },
      { name: "Preventivo", value: p },
    ];
  }, [reservas]);

  const lineaData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    return dias.map((d, i) => {
      const day = addDays(start, i);
      const total = reservas.filter((r) => {
        const dr = parseISO(r.fechaSolicitud);
        return dr.toDateString() === day.toDateString();
      }).length;
      return { dia: d, total };
    });
  }, [reservas]);

  // adjust based on vista
  const lineaFiltrada = useMemo(() => {
    if (vista === "Semanal") return lineaData;
    if (vista === "Mensual") return barData.slice(-6).map((b) => ({ dia: b.mes, total: b.total }));
    return barData.map((b) => ({ dia: b.mes, total: b.total }));
  }, [vista, lineaData, barData]);

  const colors = ["var(--primary)", "var(--primary-light)"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen general de reservas y actividad EQUIMED.
          </p>
        </div>
        <Select value={vista} onValueChange={(v) => setVista(v as Vista)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Semanal">Vista semanal</SelectItem>
            <SelectItem value="Mensual">Vista mensual</SelectItem>
            <SelectItem value="Anual">Vista anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total reservas" value={kpis.total} icon={Inbox} tone="primary" />
        <KpiCard label="Pendientes" value={kpis.pendientes} icon={Clock3} tone="warning" />
        <KpiCard label="Aceptadas" value={kpis.aceptadas} icon={CheckCheck} tone="success" />
        <KpiCard label="Esta semana" value={kpis.semana} icon={TrendingUp} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Reservas por mes (últimos 12 meses)</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 font-semibold">Tipo de mantenimiento</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donaData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                    {donaData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 font-semibold">Tendencia · {vista.toLowerCase()}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={lineaFiltrada}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <ReservasSection reservas={reservas} onEstado={onEstado} compact />
    </div>
  );
}

function KpiCard({
  label, value, icon: Icon, tone,
}: { label: string; value: number; icon: any; tone: "primary" | "warning" | "success" }) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/15 text-success",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", toneCls)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-extrabold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReservasSection({
  reservas, onEstado, compact = false,
}: { reservas: Reserva[]; onEstado: (n: string, e: "Aceptada" | "Rechazada") => void; compact?: boolean }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("todos");

  const filtered = reservas.filter((r) => {
    const matchQ = !q || r.cliente.nombre.toLowerCase().includes(q.toLowerCase()) || r.numero.toLowerCase().includes(q.toLowerCase());
    const matchE = estado === "todos" || r.estado === estado;
    return matchQ && matchE;
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{compact ? "Últimas reservas" : "Todas las reservas"}</h3>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Buscar por cliente o N°..." />
            </div>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Aceptada">Aceptada</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pr-3">N°</th>
                <th className="py-3 pr-3">Cliente</th>
                <th className="py-3 pr-3">Equipo</th>
                <th className="py-3 pr-3">Mantenimiento</th>
                <th className="py-3 pr-3">Fecha</th>
                <th className="py-3 pr-3">Estado</th>
                <th className="py-3 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Sin reservas que mostrar.</td></tr>
              )}
              {(compact ? filtered.slice(0, 5) : filtered).map((r) => (
                <tr key={r.numero} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="py-3 pr-3 font-semibold text-primary">#{r.numero}</td>
                  <td className="py-3 pr-3">
                    <div className="font-medium">{r.cliente.nombre}</div>
                    <div className="text-xs text-muted-foreground">{r.cliente.telefono}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div>{r.equipo.nombre}</div>
                    <div className="text-xs text-muted-foreground">{r.equipo.categoria}</div>
                  </td>
                  <td className="py-3 pr-3">{r.equipo.tipoMantenimiento}</td>
                  <td className="py-3 pr-3 whitespace-nowrap">{r.cita.fecha}</td>
                  <td className="py-3 pr-3"><EstadoBadge estado={r.estado} /></td>
                  <td className="py-3 pr-3">
                    {r.estado === "Pendiente" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => onEstado(r.numero, "Aceptada")}>
                          <Check className="mr-1 h-3.5 w-3.5" /> Aceptar
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => onEstado(r.numero, "Rechazada")}>
                          <X className="mr-1 h-3.5 w-3.5" /> Rechazar
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarioSection({ reservas }: { reservas: Reserva[] }) {
  // Simple month grid showing reservations by day
  const [cursor, setCursor] = useState(new Date());
  const start = startOfMonth(cursor);
  const startDay = (getDay(start) + 6) % 7; // Lun=0
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  const reservasPorDia: Record<string, Reserva[]> = {};
  reservas.forEach((r) => {
    const key = format(parseISO(r.fechaSolicitud), "yyyy-MM-dd");
    (reservasPorDia[key] ||= []).push(r);
  });

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario de reservas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(subMonths(cursor, 1))}>‹</Button>
          <div className="min-w-40 text-center font-semibold capitalize">
            {format(cursor, "MMMM yyyy", { locale: es })}
          </div>
          <Button variant="outline" size="sm" onClick={() => setCursor(subMonths(cursor, -1))}>›</Button>
        </div>
      </div>
      <Card><CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
          {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((c, i) => {
            const key = c ? format(c, "yyyy-MM-dd") : `e${i}`;
            const list = c ? reservasPorDia[key] || [] : [];
            return (
              <div key={key} className={cn(
                "min-h-24 rounded-lg border p-2 text-left text-xs",
                c ? "bg-card border-border" : "border-transparent",
              )}>
                {c && <div className="mb-1 font-semibold">{c.getDate()}</div>}
                <div className="space-y-1">
                  {list.slice(0, 3).map((r) => (
                    <div key={r.numero} className={cn(
                      "truncate rounded px-1.5 py-0.5 text-[11px]",
                      r.estado === "Pendiente" && "bg-warning/20 text-warning-foreground",
                      r.estado === "Aceptada" && "bg-success/15 text-success",
                      r.estado === "Rechazada" && "bg-destructive/15 text-destructive",
                    )}>
                      #{r.numero.replace("EQ-", "")} · {r.cliente.nombre.split(" ")[0]}
                    </div>
                  ))}
                  {list.length > 3 && <div className="text-[10px] text-muted-foreground">+{list.length - 3} más</div>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent></Card>
    </div>
  );
}
