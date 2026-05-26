import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { format, addDays, isWeekend, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Search,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { EquimedLogo } from "@/components/EquimedLogo";
import {
  CATEGORIAS,
  CANTIDADES_EQUIPO,
  DEPARTAMENTOS,
  DUI_REGEX,
  EQUIMED_DIRECCION,
  HORARIOS,
  TEL_REGEX,
  TIPOS_CLIENTE,
  addReserva,
  buildWhatsappUrl,
  findReserva,
  type Reserva,
} from "@/lib/equimed";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EQUIMED — Solicita mantenimiento de equipos médicos" },
      {
        name: "description",
        content:
          "Agenda en línea el mantenimiento correctivo o preventivo de tu equipo médico en El Salvador con EQUIMED.",
      },
    ],
  }),
  component: ClientePortal,
});

type FormData = {
  tipoMantenimiento: "Correctivo" | "Preventivo" | "";
  categoria: string;
  categoriaOtro?: string;
  nombre: string;
  marca: string;
  descripcion: string;
  cantidadEquipos: string;
  tipoCliente: string;
  fecha?: Date;
  horario: string;
  cliente_nombre: string;
  dui: string;
  telefono: string;
  correo: string;
  direccion: string;
  municipio: string;
  departamento: string;
};


const PASOS = [
  { n: 1, titulo: "Tipo y equipo", icon: Wrench },
  { n: 2, titulo: "Especificaciones", icon: Stethoscope },
  { n: 3, titulo: "Fecha y hora", icon: CalendarIcon },
  { n: 4, titulo: "Tus datos", icon: ClipboardList },
  { n: 5, titulo: "Confirmación", icon: CheckCircle2 },
];

function ClientePortal() {
  const [view, setView] = useState<"home" | "wizard" | "exito" | "consulta">("home");
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header onConsulta={() => setView("consulta")} />
      {view === "home" && (
        <Home onIniciar={() => setView("wizard")} onConsulta={() => setView("consulta")} />
      )}
      {view === "wizard" && (
        <Wizard
          onCancel={() => setView("home")}
          onDone={(r) => {
            setReservaCreada(r);
            setView("exito");
          }}
        />
      )}
      {view === "exito" && reservaCreada && (
        <Exito reserva={reservaCreada} onHome={() => setView("home")} onConsulta={() => setView("consulta")} />
      )}
      {view === "consulta" && <Consulta onHome={() => setView("home")} />}
      <Footer />
    </div>
  );
}

function Header({ onConsulta }: { onConsulta: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <EquimedLogo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onConsulta} className="hidden sm:inline-flex">
            <Search className="mr-2 h-4 w-4" /> Consultar reserva
          </Button>
        </div>
      </div>
    </header>
  );
}


function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30 py-8 mt-16">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EQUIMED · Especialistas en venta y reparación de equipos
        médicos · El Salvador
        <div className="mt-3">
          <Link
            to="/admin/login"
            className="text-xs text-muted-foreground/60 hover:text-primary"
          >
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}


function Home({ onIniciar, onConsulta }: { onIniciar: () => void; onConsulta: () => void }) {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-primary-light/10" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-0">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Servicio técnico certificado
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
                Mantenimiento confiable para tus{" "}
                <span className="text-primary">equipos médicos</span>
              </h1>
              <p className="max-w-prose text-lg text-muted-foreground">
                Agenda en minutos el mantenimiento correctivo o preventivo de tus equipos.
                Atención profesional, repuestos originales y respuesta el mismo día.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={onIniciar} className="shadow-lg shadow-primary/20">
                  Solicitar mantenimiento <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={onConsulta}>
                  <Search className="mr-2 h-4 w-4" /> Consultar mi reserva
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sin crear cuenta</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Confirmación por WhatsApp</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Lun–Vie 8AM–5PM</div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/30 to-primary-light/20 blur-2xl" />
              <Card className="relative overflow-hidden border-border/60 shadow-2xl">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Stethoscope, t: "Diagnóstico", d: "Tensiómetros, oxímetros, ECG" },
                      { icon: Wrench, t: "Hospitalario", d: "Camas UCI, lámparas" },
                      { icon: ClipboardList, t: "Laboratorio", d: "Centrífugas, microscopios" },
                      { icon: ShieldCheck, t: "Hogar", d: "Nebulizadores, sillas" },
                    ].map((it) => (
                      <div key={it.t} className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <it.icon className="h-5 w-5" />
                        </div>
                        <div className="font-semibold">{it.t}</div>
                        <div className="text-xs text-muted-foreground">{it.d}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold">¿Cómo funciona?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Cuéntanos del equipo", d: "Selecciona la categoría y describe el problema o motivo." },
            { n: "02", t: "Agenda tu cita", d: "Elige una fecha y horario disponibles para entregarnos el equipo." },
            { n: "03", t: "Recibe seguimiento", d: "Te confirmamos por WhatsApp y puedes consultar el estado en línea." },
          ].map((s) => (
            <Card key={s.n} className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-3 text-3xl font-extrabold text-primary/30">{s.n}</div>
                <div className="mb-1 font-semibold">{s.t}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

// ----------------- WIZARD -----------------
function Wizard({ onCancel, onDone }: { onCancel: () => void; onDone: (r: Reserva) => void }) {
  const [paso, setPaso] = useState(1);
  const { control, register, handleSubmit, watch, formState: { errors }, trigger, setValue, getValues } =
    useForm<FormData>({
      mode: "onChange",
      defaultValues: {
        tipoMantenimiento: "",
        categoria: "",
        categoriaOtro: "",
        nombre: "",
        marca: "",
        descripcion: "",
        cantidadEquipos: "",
        tipoCliente: "",
        horario: "",
        cliente_nombre: "",
        dui: "",
        telefono: "+503 ",
        correo: "",
        direccion: "",
        municipio: "",
        departamento: "",
      },
    });

  const categoria = watch("categoria");
  const fecha = watch("fecha");
  const horario = watch("horario");

  const fieldsForStep: (keyof FormData)[][] = [
    [],
    ["tipoMantenimiento", "categoria", ...(categoria === "Otro" ? ["categoriaOtro" as keyof FormData] : [])],
    ["nombre", "marca", "cantidadEquipos", "tipoCliente", "descripcion"],
    ["fecha", "horario"],
    ["cliente_nombre", "dui", "telefono", "correo", "direccion", "municipio", "departamento"],
  ];


  const next = async () => {
    const ok = await trigger(fieldsForStep[paso]);
    if (!ok) {
      toast.error("Completa los campos requeridos");
      return;
    }
    setPaso((p) => Math.min(5, p + 1));
  };
  const prev = () => setPaso((p) => Math.max(1, p - 1));

  const onSubmit = (data: FormData) => {
    const reserva = addReserva({
      cliente: {
        nombre: data.cliente_nombre,
        dui: data.dui,
        telefono: data.telefono,
        correo: data.correo,
        direccion: data.direccion,
        municipio: data.municipio,
        departamento: data.departamento,
      },
      equipo: {
        categoria: data.categoria,
        categoriaOtro: data.categoriaOtro,
        nombre: data.nombre,
        marca: data.marca,
        tipoMantenimiento: data.tipoMantenimiento as "Correctivo" | "Preventivo",
        descripcion: data.descripcion,
        cantidadEquipos: data.cantidadEquipos,
        tipoCliente: data.tipoCliente,
      },

      cita: {
        fecha: data.fecha ? format(data.fecha, "EEEE d 'de' MMMM, yyyy", { locale: es }) : "",
        horario: data.horario,
      },
    });
    const url = buildWhatsappUrl(reserva);
    window.open(url, "_blank");
    toast.success(`Reserva ${reserva.numero} creada`);
    onDone(reserva);
  };

  const progress = (paso / 5) * 100;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
        <div className="text-sm text-muted-foreground">Paso {paso} de 5</div>
      </div>

      <Stepper paso={paso} />
      <Progress value={progress} className="mb-8 h-1.5" />

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {paso === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold">Tipo de mantenimiento y equipo</h2>
                  <p className="text-sm text-muted-foreground">Cuéntanos qué necesitas.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(["Correctivo", "Preventivo"] as const).map((tipo) => (
                    <label
                      key={tipo}
                      className={cn(
                        "cursor-pointer rounded-xl border-2 p-4 transition",
                        watch("tipoMantenimiento") === tipo
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <input
                        type="radio"
                        value={tipo}
                        className="sr-only"
                        {...register("tipoMantenimiento", { required: true })}
                      />
                      <div className="font-semibold">{tipo}</div>
                      <div className="text-xs text-muted-foreground">
                        {tipo === "Correctivo"
                          ? "El equipo presenta una falla o daño."
                          : "Mantenimiento de rutina para evitar fallas."}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.tipoMantenimiento && <p className="text-xs text-destructive">Selecciona un tipo</p>}

                <div className="space-y-2">
                  <Label>Categoría del equipo médico *</Label>
                  <Controller
                    control={control}
                    name="categoria"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.value}
                              {c.ejemplos && (
                                <span className="ml-1 text-xs text-muted-foreground">— {c.ejemplos}</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoria && <p className="text-xs text-destructive">Requerido</p>}
                </div>

                {categoria === "Otro" && (
                  <div className="space-y-2">
                    <Label>Especifica la categoría *</Label>
                    <Input {...register("categoriaOtro", { required: categoria === "Otro" })} />
                  </div>
                )}
              </div>
            )}

            {paso === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold">Especificaciones del equipo</h2>
                  <p className="text-sm text-muted-foreground">Información para preparar el servicio.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre del equipo *</Label>
                    <Input placeholder="Ej: Oxímetro de pulso" {...register("nombre", { required: true })} />
                    {errors.nombre && <p className="text-xs text-destructive">Requerido</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Marca del equipo *</Label>
                    <Input placeholder="Ej: Nonin Medical" {...register("marca", { required: true })} />
                    {errors.marca && <p className="text-xs text-destructive">Requerido</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cantidad de equipos *</Label>
                    <Controller
                      control={control}
                      name="cantidadEquipos"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="¿Es más de un equipo?" /></SelectTrigger>
                          <SelectContent>
                            {CANTIDADES_EQUIPO.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.cantidadEquipos && <p className="text-xs text-destructive">Requerido</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de cliente *</Label>
                    <Controller
                      control={control}
                      name="tipoCliente"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Selecciona tipo de cliente" /></SelectTrigger>
                          <SelectContent>
                            {TIPOS_CLIENTE.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.tipoCliente && <p className="text-xs text-destructive">Requerido</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción del problema o motivo *</Label>
                  <Textarea
                    rows={5}
                    placeholder="Describe brevemente el motivo del mantenimiento..."
                    {...register("descripcion", { required: true, minLength: 10 })}
                  />
                  {errors.descripcion && (
                    <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
                  )}
                </div>
              </div>
            )}

            {paso === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold">Selecciona fecha y horario</h2>
                  <p className="text-sm text-muted-foreground">
                    Atención de lunes a viernes, 8:00 AM – 5:00 PM.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label className="mb-2 block">Fecha *</Label>
                    <Controller
                      control={control}
                      name="fecha"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, "EEEE d 'de' MMMM, yyyy", { locale: es })
                                : "Elegir fecha disponible"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={es}
                              disabled={(d) => {
                                const today = startOfDay(new Date());
                                const max = addDays(today, 60);
                                return d < addDays(today, 1) || d > max || isWeekend(d);
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.fecha && <p className="mt-1 text-xs text-destructive">Selecciona una fecha</p>}
                  </div>

                  <div>
                    <Label className="mb-2 block">Horario *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {HORARIOS.map((h) => (
                        <button
                          type="button"
                          key={h}
                          onClick={() => setValue("horario", h, { shouldValidate: true })}
                          className={cn(
                            "rounded-lg border-2 p-3 text-sm transition",
                            horario === h
                              ? "border-primary bg-primary/5 font-semibold"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <Clock className="mr-1 inline h-3.5 w-3.5" />
                          {h}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" {...register("horario", { required: true })} />
                    {errors.horario && <p className="mt-1 text-xs text-destructive">Selecciona un horario</p>}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                    <MapPin className="h-4 w-4" /> Dirección de entrega EQUIMED
                  </div>
                  <p className="text-sm text-muted-foreground">{EQUIMED_DIRECCION}</p>
                </div>
              </div>
            )}

            {paso === 4 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold">Tus datos</h2>
                  <p className="text-sm text-muted-foreground">Necesitamos esta información para contactarte.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Nombre completo *</Label>
                    <Input {...register("cliente_nombre", { required: true, minLength: 3 })} />
                    {errors.cliente_nombre && <p className="text-xs text-destructive">Requerido</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>DUI *</Label>
                    <Input
                      placeholder="00000000-0"
                      {...register("dui", { required: true, pattern: DUI_REGEX })}
                    />
                    {errors.dui && <p className="text-xs text-destructive">Formato: 00000000-0</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono *</Label>
                    <Input
                      placeholder="+503 7777-7777"
                      {...register("telefono", { required: true, pattern: TEL_REGEX })}
                    />
                    {errors.telefono && (
                      <p className="text-xs text-destructive">Formato: +503 XXXX-XXXX</p>
                    )}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Correo electrónico *</Label>
                    <Input
                      type="email"
                      {...register("correo", { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                    />
                    {errors.correo && <p className="text-xs text-destructive">Correo inválido</p>}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Dirección de residencia *</Label>
                    <Input {...register("direccion", { required: true })} />
                    {errors.direccion && <p className="text-xs text-destructive">Requerido</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Municipio *</Label>
                    <Input {...register("municipio", { required: true })} />
                    {errors.municipio && <p className="text-xs text-destructive">Requerido</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Departamento *</Label>
                    <Controller
                      control={control}
                      name="departamento"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
                          <SelectContent>
                            {DEPARTAMENTOS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.departamento && <p className="text-xs text-destructive">Requerido</p>}
                  </div>
                </div>
              </div>
            )}

            {paso === 5 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold">Resumen y confirmación</h2>
                  <p className="text-sm text-muted-foreground">Verifica los datos antes de enviar.</p>
                </div>

                <Resumen data={getValues()} />

                <Button type="submit" size="lg" className="w-full shadow-lg shadow-primary/20">
                  Enviar solicitud de mantenimiento <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Se abrirá WhatsApp con tu solicitud lista para enviar.
                </p>
              </div>
            )}

            <div className="flex justify-between border-t border-border/60 pt-6">
              <Button type="button" variant="ghost" onClick={prev} disabled={paso === 1}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Anterior
              </Button>
              {paso < 5 ? (
                <Button type="button" onClick={next}>
                  Siguiente <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <span />
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function Stepper({ paso }: { paso: number }) {
  return (
    <ol className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
      {PASOS.map((p) => {
        const active = p.n === paso;
        const done = p.n < paso;
        return (
          <li key={p.n} className="flex items-center gap-2 whitespace-nowrap">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary bg-primary/10 text-primary scale-110",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : p.n}
            </div>
            <span className={cn("hidden text-xs sm:inline", active ? "font-semibold" : "text-muted-foreground")}>
              {p.titulo}
            </span>
            {p.n < 5 && <div className="h-px w-6 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Resumen({ data }: { data: FormData }) {
  const cat = data.categoria === "Otro" ? `Otro (${data.categoriaOtro})` : data.categoria;
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <Section title="🏥 Datos del equipo">
        <Row label="Categoría" value={cat} />
        <Row label="Tipo de mantenimiento" value={data.tipoMantenimiento} />
        <Row label="Equipo" value={data.nombre} />
        <Row label="Marca" value={data.marca} />
        <Row label="Descripción" value={data.descripcion} />
      </Section>
      <Section title="🗓️ Cita">
        <Row label="Fecha" value={data.fecha ? format(data.fecha, "EEEE d 'de' MMMM, yyyy", { locale: es }) : ""} />
        <Row label="Horario" value={data.horario} />
      </Section>
      <Section title="👤 Cliente">
        <Row label="Nombre" value={data.cliente_nombre} />
        <Row label="DUI" value={data.dui} />
        <Row label="Teléfono" value={data.telefono} />
        <Row label="Correo" value={data.correo} />
        <Row
          label="Dirección"
          value={`${data.direccion}, ${data.municipio}, ${data.departamento}`}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 text-sm font-semibold text-primary">{title}</div>
      <dl className="grid gap-1 text-sm">{children}</dl>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">{value || "—"}</dd>
    </div>
  );
}

// --------- ÉXITO ---------
function Exito({
  reserva,
  onHome,
  onConsulta,
}: {
  reserva: Reserva;
  onHome: () => void;
  onConsulta: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <Card className="border-border/60 text-center shadow-lg">
        <CardContent className="p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">¡Solicitud enviada correctamente!</h2>
          <p className="mb-6 text-muted-foreground">
            El equipo de EQUIMED revisará tu reserva y te notificará pronto.
          </p>
          <div className="mb-6 inline-block rounded-2xl border-2 border-primary/30 bg-primary/5 px-8 py-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              N° de reserva
            </div>
            <div className="text-3xl font-extrabold text-primary">#{reserva.numero}</div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={onConsulta} variant="outline">
              <Search className="mr-2 h-4 w-4" /> Consultar estado
            </Button>
            <Button onClick={onHome}>Volver al inicio</Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Guarda tu número de reserva para consultar el estado más adelante.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

// --------- CONSULTA ---------
function Consulta({ onHome }: { onHome: () => void }) {
  const [num, setNum] = useState("");
  const [resultado, setResultado] = useState<Reserva | null | "no">(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("equimed:reservas", h);
    return () => window.removeEventListener("equimed:reservas", h);
  }, []);

  const buscar = () => {
    const n = num.trim().replace(/^#/, "");
    if (!n) return;
    const r = findReserva(n);
    setResultado(r ?? "no");
  };

  // re-fetch reserva on store changes
  useMemo(() => {
    if (resultado && resultado !== "no") {
      const r = findReserva(resultado.numero);
      if (r && r.estado !== resultado.estado) setResultado(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <Button variant="ghost" size="sm" onClick={onHome} className="mb-4">
        <ArrowLeft className="mr-1 h-4 w-4" /> Inicio
      </Button>
      <Card className="border-border/60">
        <CardContent className="p-6 md:p-8">
          <h2 className="mb-1 text-2xl font-bold">Estado de mi reserva</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Ingresa tu número de reserva (ej: <code>EQ-00001</code>) para consultar.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="EQ-00001"
              value={num}
              onChange={(e) => setNum(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <Button onClick={buscar}>
              <Search className="mr-1 h-4 w-4" /> Consultar
            </Button>
          </div>

          {resultado === "no" && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              No encontramos una reserva con ese número.
            </div>
          )}
          {resultado && resultado !== "no" && (
            <div className="mt-6 space-y-3 rounded-xl border border-border bg-muted/20 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Reserva</div>
                <div className="font-bold text-primary">#{resultado.numero}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Estado</div>
                <EstadoBadge estado={resultado.estado} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Cliente</div>
                <div className="font-medium">{resultado.cliente.nombre}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Equipo</div>
                <div className="font-medium">{resultado.equipo.nombre}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Cita</div>
                <div className="font-medium text-right">{resultado.cita.fecha} · {resultado.cita.horario}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export function EstadoBadge({ estado }: { estado: Reserva["estado"] }) {
  const map = {
    Pendiente: "bg-warning/20 text-warning-foreground border-warning/40",
    Aceptada: "bg-success/15 text-success border-success/40",
    Rechazada: "bg-destructive/15 text-destructive border-destructive/40",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", map[estado])}>
      {estado}
    </span>
  );
}
