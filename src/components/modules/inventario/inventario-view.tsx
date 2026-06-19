"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Package, AlertTriangle, Plus, TrendingDown, TrendingUp,
  Edit2, Search, ArrowUpDown, Check, LayoutGrid, List, Euro, CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatFecha } from "@/lib/utils";
import { crearProducto, actualizarProducto, registrarMovimientoStock } from "@/app/actions/inventario";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Producto = Database["public"]["Tables"]["inventory_products"]["Row"];
type StockBajo = Database["public"]["Views"]["v_stock_bajo"]["Row"];

function esCaducando(fecha: string): boolean {
  return new Date(fecha) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

interface Props {
  productos: Producto[];
  productosBajos: StockBajo[];
}

const CATEGORIAS_INV = ["Farmacológico", "Filler", "Fungible", "Cosmética", "Equipamiento", "Otro"];

const emptyProducto = {
  nombre: "", categoria: "", proveedor: "", unidades: "0",
  umbral_alerta: "5", coste: "", lote: "", caducidad: "",
};

export function InventarioView({ productos, productosBajos }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [vista, setVista] = useState<"tabla" | "tarjetas">("tabla");
  const [dialogProducto, setDialogProducto] = useState(false);
  const [dialogMovimiento, setDialogMovimiento] = useState<{ tipo: "entrada" | "salida" | "ajuste"; producto?: Producto } | null>(null);
  const [editandoProducto, setEditandoProducto] = useState<Producto | null>(null);
  const [formProducto, setFormProducto] = useState(emptyProducto);
  const [formMov, setFormMov] = useState({ cantidad: "1", motivo: "" });
  const [isPending, startTransition] = useTransition();

  // Filtrar productos
  const filtrados = productos.filter(p => {
    const matchBusq = !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.proveedor ?? "").toLowerCase().includes(busqueda.toLowerCase());
    const matchFiltro = filtro === "todos" ? true :
      filtro === "bajo" ? p.unidades <= p.umbral_alerta :
      p.categoria.toLowerCase() === filtro.toLowerCase();
    return matchBusq && matchFiltro;
  });

  function abrirNuevoProducto() {
    setEditandoProducto(null);
    setFormProducto(emptyProducto);
    setDialogProducto(true);
  }

  function abrirEditarProducto(p: Producto) {
    setEditandoProducto(p);
    setFormProducto({
      nombre: p.nombre, categoria: p.categoria, proveedor: p.proveedor ?? "",
      unidades: String(p.unidades), umbral_alerta: String(p.umbral_alerta),
      coste: p.coste != null ? String(p.coste) : "",
      lote: p.lote ?? "", caducidad: p.caducidad ?? "",
    });
    setDialogProducto(true);
  }

  function handleGuardarProducto(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      nombre: formProducto.nombre, categoria: formProducto.categoria,
      proveedor: formProducto.proveedor || undefined,
      unidades: Number(formProducto.unidades),
      umbral_alerta: Number(formProducto.umbral_alerta),
      coste: formProducto.coste ? Number(formProducto.coste) : null,
      lote: formProducto.lote || undefined,
      caducidad: formProducto.caducidad || null,
      activo: true,
    };
    startTransition(async () => {
      const result = editandoProducto
        ? await actualizarProducto(editandoProducto.id, data)
        : await crearProducto(data);
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Error al guardar el producto");
        return;
      }
      toast.success(editandoProducto ? "Producto actualizado" : "Producto añadido al inventario");
      setDialogProducto(false);
      router.refresh();
    });
  }

  function handleMovimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!dialogMovimiento?.producto) return;
    startTransition(async () => {
      const result = await registrarMovimientoStock({
        product_id: dialogMovimiento.producto!.id,
        tipo: dialogMovimiento.tipo,
        cantidad: Number(formMov.cantidad),
        motivo: formMov.motivo || undefined,
      });
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Error al registrar el movimiento");
        return;
      }
      const accion = dialogMovimiento.tipo === "entrada" ? "añadidas" : "retiradas";
      toast.success(`${formMov.cantidad} unidades ${accion} de ${dialogMovimiento.producto?.nombre}`);
      setDialogMovimiento(null);
      setFormMov({ cantidad: "1", motivo: "" });
      router.refresh();
    });
  }

  const cats = [...new Set(productos.map(p => p.categoria))];

  const activos = productos.filter(p => p.activo);
  const valorStock = activos.reduce((s, p) => s + p.unidades * (p.coste ?? 0), 0);
  const caducanPronto = activos.filter(p => p.caducidad && esCaducando(p.caducidad)).length;
  const eurFmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400">

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Package, label: "Productos activos", value: String(activos.length), color: "var(--oliva)" },
          { icon: Euro, label: "Valor del stock", value: eurFmt(valorStock), color: "var(--oliva)" },
          { icon: AlertTriangle, label: "Stock bajo", value: String(productosBajos.length), color: productosBajos.length > 0 ? "var(--error)" : "var(--oliva)" },
          { icon: CalendarClock, label: "Caducan en 30 días", value: String(caducanPronto), color: caducanPronto > 0 ? "var(--aviso)" : "var(--oliva)" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] px-4 py-3 shadow-[var(--shadow-card)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color }}>
                <Icon size={16} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10.5px] font-bold uppercase tracking-wide text-[var(--tinta-suave)]">{s.label}</p>
                <p className="font-display text-lg font-bold tabular-nums text-[var(--tinta)]">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alertas */}
      {productosBajos.length > 0 && (
        <div className="flex items-start gap-3 rounded-[14px] border border-[var(--error)]/30 bg-[var(--error-tint)] px-4 py-3">
          <AlertTriangle size={16} strokeWidth={1.75} className="text-[var(--error)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--error)]">
              {productosBajos.length} producto{productosBajos.length !== 1 ? "s" : ""} con stock bajo
            </p>
            <p className="text-xs text-[var(--error)]/80 mt-0.5">{productosBajos.map(p => p.nombre).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tinta-suave)]" />
          <Input
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-8 h-9 w-52"
          />
        </div>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los productos</SelectItem>
            <SelectItem value="bajo">⚠ Stock bajo ({productosBajos.length})</SelectItem>
            {cats.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-[10px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-0.5">
          <button
            onClick={() => setVista("tabla")}
            className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors ${vista === "tabla" ? "bg-[var(--oliva)] text-white" : "text-[var(--tinta-suave)] hover:bg-[var(--arena)]"}`}
            title="Vista tabla" aria-label="Vista tabla"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setVista("tarjetas")}
            className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors ${vista === "tarjetas" ? "bg-[var(--oliva)] text-white" : "text-[var(--tinta-suave)] hover:bg-[var(--arena)]"}`}
            title="Vista tarjetas" aria-label="Vista tarjetas"
          >
            <LayoutGrid size={15} />
          </button>
        </div>
        <div className="flex-1" />
        <Button size="sm" className="gap-1.5" onClick={abrirNuevoProducto}>
          <Plus size={13} strokeWidth={2} /> Nuevo producto
        </Button>
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--salvia-tint)] mb-3">
            <Package size={24} strokeWidth={1.5} className="text-[var(--salvia)]" />
          </div>
          <h3 className="font-display text-base font-semibold text-[var(--tinta)]">Sin productos</h3>
          <p className="mt-1 text-sm text-[var(--tinta-suave)]">
            {busqueda ? `Sin resultados para "${busqueda}"` : "Añade los productos del inventario de la clínica."}
          </p>
          {!busqueda && <Button size="sm" className="mt-4 gap-1.5" onClick={abrirNuevoProducto}><Plus size={13} /> Añadir producto</Button>}
        </div>
      ) : vista === "tabla" ? (
        <div className="rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] overflow-hidden shadow-[var(--shadow-card)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--lino)]">
                {["Producto", "Categoría", "Stock", "Alerta", "Caducidad", "Proveedor", ""].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--tinta-suave)] ${["Alerta", "Caducidad", "Proveedor"].includes(h) ? "hidden lg:table-cell" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p, i) => {
                const bajo = p.unidades <= p.umbral_alerta;
                const caduca = p.caducidad && esCaducando(p.caducidad);
                return (
                  <tr key={p.id} style={{ animationDelay: `${i * 30}ms` }}
                    className={`group border-b border-[var(--lino)] last:border-0 transition-colors animate-in fade-in-0 ${bajo ? "bg-[var(--error-tint)]/30 hover:bg-[var(--error-tint)]/50" : "hover:bg-[var(--arena)]"}`}>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={13} strokeWidth={1.75} className={bajo ? "text-[var(--error)]" : "text-[var(--tinta-suave)]"} />
                        <div>
                          <p className="text-sm font-semibold text-[var(--tinta)]">{p.nombre}</p>
                          {p.lote && <p className="text-[11px] text-[var(--tinta-suave)]">Lote: {p.lote}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted" className="capitalize text-[11px]">{p.categoria}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-lg font-display font-bold tabular-nums ${bajo ? "text-[var(--error)]" : "text-[var(--tinta)]"}`}>{p.unidades}</span>
                        <span className="text-xs text-[var(--tinta-suave)]">ud.</span>
                        {bajo && <AlertTriangle size={12} className="text-[var(--error)]" />}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-sm text-[var(--tinta-suave)] tabular-nums">
                      mín. {p.umbral_alerta}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      {p.caducidad ? (
                        <span className={`text-sm tabular-nums ${caduca ? "text-[var(--aviso)] font-semibold" : "text-[var(--tinta-suave)]"}`}>
                          {formatFecha(p.caducidad)}
                          {caduca && " ⚠"}
                        </span>
                      ) : <span className="text-[var(--tinta-suave)] text-sm">—</span>}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-sm text-[var(--tinta-suave)]">{p.proveedor ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon-sm" variant="ghost" title="Registrar entrada"
                          onClick={() => { setFormMov({ cantidad: "1", motivo: "" }); setDialogMovimiento({ tipo: "entrada", producto: p }); }}>
                          <TrendingUp size={13} strokeWidth={1.75} className="text-[var(--exito)]" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" title="Registrar salida"
                          onClick={() => { setFormMov({ cantidad: "1", motivo: "" }); setDialogMovimiento({ tipo: "salida", producto: p }); }}>
                          <TrendingDown size={13} strokeWidth={1.75} className="text-[var(--error)]" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" title="Ajustar stock"
                          onClick={() => { setFormMov({ cantidad: "1", motivo: "" }); setDialogMovimiento({ tipo: "ajuste", producto: p }); }}>
                          <ArrowUpDown size={13} strokeWidth={1.75} className="text-[var(--tinta-suave)]" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" title="Editar" onClick={() => abrirEditarProducto(p)}>
                          <Edit2 size={12} strokeWidth={1.75} className="text-[var(--tinta-suave)]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((p, i) => {
            const bajo = p.unidades <= p.umbral_alerta;
            const caduca = p.caducidad && esCaducando(p.caducidad);
            return (
              <div
                key={p.id}
                style={{ animationDelay: `${i * 25}ms` }}
                className={`group flex flex-col rounded-[16px] border bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] animate-in fade-in-0 ${bajo ? "border-[var(--error)]/40" : "border-[var(--lino)]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${bajo ? "bg-[var(--error-tint)] text-[var(--error)]" : "bg-[var(--salvia-tint)] text-[var(--oliva)]"}`}>
                    <Package size={16} strokeWidth={1.75} />
                  </span>
                  <Badge variant="muted" className="capitalize text-[10px]">{p.categoria}</Badge>
                </div>
                <p className="mt-2.5 text-sm font-semibold leading-tight text-[var(--tinta)]">{p.nombre}</p>
                <p className="mt-0.5 text-[11px] text-[var(--tinta-suave)]">{p.proveedor ?? "Sin proveedor"}{p.lote ? ` · Lote ${p.lote}` : ""}</p>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className={`font-display text-2xl font-bold tabular-nums leading-none ${bajo ? "text-[var(--error)]" : "text-[var(--tinta)]"}`}>
                      {p.unidades}
                      <span className="ml-1 text-xs font-normal text-[var(--tinta-suave)]">ud.</span>
                    </p>
                    <p className="mt-1 text-[10.5px] text-[var(--tinta-suave)]">mín. {p.umbral_alerta}{bajo ? " · ¡reponer!" : ""}</p>
                  </div>
                  {p.caducidad && (
                    <p className={`text-[10.5px] tabular-nums ${caduca ? "font-bold text-[var(--aviso)]" : "text-[var(--tinta-suave)]"}`}>
                      Cad. {formatFecha(p.caducidad)}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1 border-t border-[var(--lino)] pt-2.5">
                  <Button size="icon-sm" variant="ghost" title="Registrar entrada"
                    onClick={() => { setFormMov({ cantidad: "1", motivo: "" }); setDialogMovimiento({ tipo: "entrada", producto: p }); }}>
                    <TrendingUp size={13} strokeWidth={1.75} className="text-[var(--exito)]" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" title="Registrar salida"
                    onClick={() => { setFormMov({ cantidad: "1", motivo: "" }); setDialogMovimiento({ tipo: "salida", producto: p }); }}>
                    <TrendingDown size={13} strokeWidth={1.75} className="text-[var(--error)]" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" title="Ajustar stock"
                    onClick={() => { setFormMov({ cantidad: "1", motivo: "" }); setDialogMovimiento({ tipo: "ajuste", producto: p }); }}>
                    <ArrowUpDown size={13} strokeWidth={1.75} className="text-[var(--tinta-suave)]" />
                  </Button>
                  <div className="flex-1" />
                  <Button size="icon-sm" variant="ghost" title="Editar" onClick={() => abrirEditarProducto(p)}>
                    <Edit2 size={12} strokeWidth={1.75} className="text-[var(--tinta-suave)]" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog nuevo/editar producto */}
      <Dialog open={dialogProducto} onOpenChange={setDialogProducto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editandoProducto ? `Editar: ${editandoProducto.nombre}` : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardarProducto} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input required placeholder="Ej. Toxina Botulínica Azzalure 125U" value={formProducto.nombre}
                onChange={e => setFormProducto(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría *</Label>
                <Select value={formProducto.categoria} onValueChange={v => setFormProducto(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_INV.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Proveedor</Label>
                <Input placeholder="Ej. Galderma" value={formProducto.proveedor}
                  onChange={e => setFormProducto(f => ({ ...f, proveedor: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidades iniciales</Label>
                <Input type="number" min="0" value={formProducto.unidades}
                  onChange={e => setFormProducto(f => ({ ...f, unidades: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Alerta cuando baje de</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" value={formProducto.umbral_alerta}
                    onChange={e => setFormProducto(f => ({ ...f, umbral_alerta: e.target.value }))} />
                  <span className="text-xs text-[var(--tinta-suave)] shrink-0">unidades</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Coste unitario (€)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={formProducto.coste}
                  onChange={e => setFormProducto(f => ({ ...f, coste: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de caducidad</Label>
                <DatePicker value={formProducto.caducidad}
                  onChange={v => setFormProducto(f => ({ ...f, caducidad: v }))}
                  clearable
                  placeholder="Sin caducidad" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Número de lote</Label>
              <Input placeholder="Ej. AZZ2024001" value={formProducto.lote}
                onChange={e => setFormProducto(f => ({ ...f, lote: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogProducto(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando…" : editandoProducto ? "Guardar cambios" : "Añadir al inventario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog movimiento de stock */}
      <Dialog open={!!dialogMovimiento} onOpenChange={() => setDialogMovimiento(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMovimiento?.tipo === "entrada" && <TrendingUp size={18} className="text-[var(--exito)]" />}
              {dialogMovimiento?.tipo === "salida" && <TrendingDown size={18} className="text-[var(--error)]" />}
              {dialogMovimiento?.tipo === "ajuste" && <ArrowUpDown size={18} className="text-[var(--tinta-suave)]" />}
              {dialogMovimiento?.tipo === "entrada" ? "Registrar entrada" :
               dialogMovimiento?.tipo === "salida" ? "Registrar salida" : "Ajustar stock"}
            </DialogTitle>
          </DialogHeader>
          {dialogMovimiento?.producto && (
            <div className="rounded-[10px] bg-[var(--arena)] px-3 py-2.5 -mt-1">
              <p className="text-sm font-semibold text-[var(--tinta)]">{dialogMovimiento.producto.nombre}</p>
              <p className="text-xs text-[var(--tinta-suave)]">
                Stock actual: <strong className="text-[var(--tinta)]">{dialogMovimiento.producto.unidades} unidades</strong>
              </p>
            </div>
          )}
          <form onSubmit={handleMovimiento} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>
                {dialogMovimiento?.tipo === "entrada" ? "Unidades que entran" :
                 dialogMovimiento?.tipo === "salida" ? "Unidades que salen" : "Ajuste (+ añadir / - retirar)"}
              </Label>
              <Input required type="number"
                min={dialogMovimiento?.tipo === "ajuste" ? undefined : "1"}
                value={formMov.cantidad}
                onChange={e => setFormMov(f => ({ ...f, cantidad: e.target.value }))} />
              {dialogMovimiento?.producto && Number(formMov.cantidad) > 0 && (
                <p className="text-xs text-[var(--tinta-suave)]">
                  Stock resultante: <strong className={`${
                    dialogMovimiento.tipo === "entrada"
                      ? "text-[var(--exito)]"
                      : (dialogMovimiento.producto.unidades - Number(formMov.cantidad)) <= dialogMovimiento.producto.umbral_alerta
                        ? "text-[var(--error)]"
                        : "text-[var(--tinta)]"
                  }`}>
                    {dialogMovimiento.tipo === "entrada"
                      ? dialogMovimiento.producto.unidades + Number(formMov.cantidad)
                      : Math.max(0, dialogMovimiento.producto.unidades + Number(formMov.cantidad))} unidades
                  </strong>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Input placeholder={
                dialogMovimiento?.tipo === "entrada" ? "Ej. Pedido mensual Galderma" :
                dialogMovimiento?.tipo === "salida" ? "Ej. Tratamiento Botox — María G." : "Ej. Corrección de inventario"
              } value={formMov.motivo}
                onChange={e => setFormMov(f => ({ ...f, motivo: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogMovimiento(null)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}
                variant={dialogMovimiento?.tipo === "salida" ? "destructive" : "default"}
                className="gap-1.5">
                {isPending ? "Guardando…" : <><Check size={13} strokeWidth={2} /> Confirmar</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
