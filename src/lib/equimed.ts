export type ReservaEstado = "Pendiente" | "Aceptada" | "Rechazada";

export interface Reserva {
  numero: string; // EQ-00001
  fechaSolicitud: string; // ISO
  cliente: {
    nombre: string;
    dui: string;
    telefono: string;
    correo: string;
    direccion: string;
    municipio: string;
    departamento: string;
  };
  equipo: {
    categoria: string;
    categoriaOtro?: string;
    nombre: string;
    marca: string;
    tipoMantenimiento: "Correctivo" | "Preventivo";
    descripcion: string;
    cantidadEquipos: string;
    tipoCliente: string;
  };

  cita: {
    fecha: string; // YYYY-MM-DD
    horario: string;
  };
  estado: ReservaEstado;
}

const KEY = "equimed_reservas_v1";
const COUNTER_KEY = "equimed_counter_v1";

export function getReservas(): Reserva[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveReservas(list: Reserva[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("equimed:reservas"));
}

export function addReserva(r: Omit<Reserva, "numero" | "fechaSolicitud" | "estado">): Reserva {
  const list = getReservas();
  const counter = Number(localStorage.getItem(COUNTER_KEY) || "0") + 1;
  localStorage.setItem(COUNTER_KEY, String(counter));
  const numero = `EQ-${String(counter).padStart(5, "0")}`;
  const reserva: Reserva = {
    ...r,
    numero,
    fechaSolicitud: new Date().toISOString(),
    estado: "Pendiente",
  };
  saveReservas([reserva, ...list]);
  return reserva;
}

export function updateEstado(numero: string, estado: ReservaEstado) {
  const list = getReservas().map((r) => (r.numero === numero ? { ...r, estado } : r));
  saveReservas(list);
}

export function findReserva(numero: string): Reserva | undefined {
  return getReservas().find((r) => r.numero.toLowerCase() === numero.toLowerCase());
}

export const WHATSAPP_NUMBER = "50375365983";
export const EQUIMED_DIRECCION =
  "Calle las Flores, #1110, Ciudad Jardín, 9ª Av. Sur y 5ª Calle Pte. #602, San Miguel — Sucursal Casa Matriz";


export function buildWhatsappMessage(r: Reserva): string {
  const fechaSolicitud = new Date(r.fechaSolicitud).toLocaleDateString("es-SV", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const categoria = r.equipo.categoria === "Otro" ? `Otro (${r.equipo.categoriaOtro})` : r.equipo.categoria;
  return [
    "━━━━━━━━━━━━━━━━━━━━━━━",
    "🔧 NUEVA SOLICITUD DE MANTENIMIENTO — EQUIMED",
    "━━━━━━━━━━━━━━━━━━━━━━━",
    `📋 N° Reserva: #${r.numero}`,
    `📅 Fecha de solicitud: ${fechaSolicitud}`,
    "",
    "👤 DATOS DEL CLIENTE:",
    `• Nombre: ${r.cliente.nombre}`,
    `• DUI: ${r.cliente.dui}`,
    `• Teléfono: ${r.cliente.telefono}`,
    `• Correo: ${r.cliente.correo}`,
    `• Dirección: ${r.cliente.direccion}, ${r.cliente.municipio}, ${r.cliente.departamento}`,
    "",
    "🏥 DATOS DEL EQUIPO:",
    `• Categoría: ${categoria}`,
    `• Nombre del equipo: ${r.equipo.nombre}`,
    `• Marca: ${r.equipo.marca}`,
    `• Cantidad de equipos: ${r.equipo.cantidadEquipos}`,
    `• Tipo de cliente: ${r.equipo.tipoCliente}`,
    `• Tipo de mantenimiento: ${r.equipo.tipoMantenimiento}`,
    `• Descripción: ${r.equipo.descripcion}`,

    "",
    "🗓️ CITA AGENDADA:",
    `• Fecha: ${r.cita.fecha}`,
    `• Horario: ${r.cita.horario}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━",
    "Enviado desde el sistema web EQUIMED",
    "━━━━━━━━━━━━━━━━━━━━━━━",
  ].join("\n");
}

export function buildWhatsappUrl(r: Reserva): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsappMessage(r))}`;
}

// --- Auth admin (sólo localStorage, demo) ---
const AUTH_KEY = "equimed_admin_auth";
export const ADMIN_USER = "equipmed_admin";
export const ADMIN_PASS = "Equimed2025$";

export function isAdminAuth(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "1";
}
export function setAdminAuth(v: boolean) {
  if (v) localStorage.setItem(AUTH_KEY, "1");
  else localStorage.removeItem(AUTH_KEY);
}

// --- Categorías y horarios ---
export const CATEGORIAS = [
  {
    value: "Diagnóstico y monitoreo",
    ejemplos: "tensiómetros, oxímetros, electrocardiógrafos",
  },
  { value: "Cuidado en el hogar", ejemplos: "nebulizadores, camas hospitalarias, sillas de ruedas" },
  { value: "Equipo hospitalario", ejemplos: "camas de UCI, lámparas quirúrgicas, bisturís eléctricos" },
  { value: "Equipo de laboratorio", ejemplos: "centrífugas, microscopios, analizadores" },
  { value: "Otro", ejemplos: "" },
];

export const HORARIOS = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM",
];

export const TIPOS_CLIENTE = [
  "Consumidor final",
  "Institución",
  "Hospital",
  "Clínica",
  "Laboratorio",
];

export const CANTIDADES_EQUIPO = ["1 equipo", "2 equipos", "3 equipos", "4 o más equipos"];


export const DEPARTAMENTOS = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad", "La Paz",
  "La Unión", "Morazán", "San Miguel", "San Salvador", "San Vicente", "Santa Ana",
  "Sonsonate", "Usulután",
];

// Validaciones
export const DUI_REGEX = /^\d{8}-\d$/;
export const TEL_REGEX = /^\+503 \d{4}-\d{4}$/;
