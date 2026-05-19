import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EquimedLogo } from "@/components/EquimedLogo";
import { ADMIN_PASS, ADMIN_USER, isAdminAuth, setAdminAuth } from "@/lib/equimed";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acceso administrador — EQUIMED" },
      { name: "description", content: "Panel administrativo de EQUIMED." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdminAuth()) navigate({ to: "/admin" });
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      setAdminAuth(true);
      toast.success("Bienvenido al panel EQUIMED");
      navigate({ to: "/admin" });
    } else {
      setError("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary via-primary to-primary-light">
      <div className="p-4">
        <Button asChild variant="ghost" size="sm" className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground">
          <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Volver al sitio</Link>
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-xl">
              <EquimedLogo />
            </div>
          </div>
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              <h1 className="mb-1 text-2xl font-bold">Acceso administrativo</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder al panel.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Usuario</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="user" autoFocus className="pl-9" value={user} onChange={(e) => setUser(e.target.value)} placeholder="equipmed_admin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass">Contraseña</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="pass" type="password" className="pl-9" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
                  </div>
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg">Iniciar sesión</Button>
              </form>
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-xs text-primary-foreground/80">
            © {new Date().getFullYear()} EQUIMED · Panel administrativo
          </p>
        </div>
      </div>
    </div>
  );
}
