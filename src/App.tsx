import React, { useState, useEffect } from 'react';
import { db } from './lib/supabase';
import type { Order, OrderItem } from './types';
import {
  Printer,
  Trash2,
  RefreshCw,
  LogOut,
  Lock,
  User as UserIcon,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShoppingBag
} from 'lucide-react';

export default function App() {
  // Helper to get local YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const session = sessionStorage.getItem('maison_viii_admin_session');
      return !!session;
    }
    return false;
  });
  const [authLoading] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const session = sessionStorage.getItem('maison_viii_admin_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          return parsed.user || 'Administrador';
        } catch (e) {
          console.error(e);
        }
      }
    }
    return '';
  });

  // Orders and dashboard states
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [filterDate, setFilterDate] = useState<string>(() => getLocalDateString());
  const [refreshCountdown, setRefreshCountdown] = useState<number>(10);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('maison_monitor_dismissed_orders');
      if (dismissed) {
        try {
          return JSON.parse(dismissed);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  // Printing state
  const [printPayload, setPrintPayload] = useState<{
    order: Order;
    mode: 'comanda' | 'ticket';
  } | null>(null);

  // Fetch Orders
  const loadOrders = async () => {
    try {
      const allOrders = await db.getOrders();
      setOrders(allOrders);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
    // Auto-refresh interval
    const interval = setInterval(() => {
      loadOrders();
      setRefreshCountdown(10);
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Countdown timer effect
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => (prev > 1 ? prev - 1 : 10));
    }, 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  // Handle Login Submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUser = usernameInput.trim();

    const credentials: Record<string, string> = {
      'Angel Pineda': 'AP.maison.5575',
      'Mario Bernard': 'MB.maison.2504',
    };

    if (
      credentials[normalizedUser] &&
      credentials[normalizedUser] === passwordInput
    ) {
      const sessionData = { user: normalizedUser, token: 'authenticated' };
      sessionStorage.setItem(
        'maison_viii_admin_session',
        JSON.stringify(sessionData)
      );
      setIsAuthenticated(true);
      setCurrentUser(normalizedUser);
      setLoginError('');
      setUsernameInput('');
      setPasswordInput('');
      loadOrders();
    } else {
      setLoginError('Credenciales incorrectas para el sistema de Maison VIII.');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('maison_viii_admin_session');
    setIsAuthenticated(false);
    setCurrentUser('');
  };

  // Handle Print Action
  const triggerPrint = (order: Order, mode: 'comanda' | 'ticket') => {
    setPrintPayload({ order, mode });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Handle Delete Order (Dismiss from screen only)
  const handleDeleteOrder = (id: string) => {
    if (window.confirm('¿Desea quitar este pedido del monitor? Seguirá guardado en el CRM.')) {
      const updated = [...dismissedIds, id];
      setDismissedIds(updated);
      localStorage.setItem('maison_monitor_dismissed_orders', JSON.stringify(updated));
    }
  };

  // Filter orders for the active date and exclude dismissed ones
  const filteredOrders = orders.filter(
    (o) => o.delivery_date === filterDate && !dismissedIds.includes(o.id)
  );

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0A0F0A]">
        <div className="animate-pulse text-center">
          <h2 className="editorial-title text-4xl text-gold">MAISON VIII</h2>
          <p className="text-[10px] text-crema/40 tracking-widest mt-2 uppercase">Iniciando Monitor...</p>
        </div>
      </div>
    );
  }

  // LOGIN INTERFACE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0F0A] relative overflow-hidden">
        {/* Glow Effects (Multiple colors for ambient lighting) */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#1a331a]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full glass-panel border border-gold/20 p-10 rounded-2xl space-y-8 shadow-2xl relative z-10 transition-all duration-500">
          <div className="text-center space-y-4">
            <img
              src="/logos/logo_headersinfondo_500x200.png"
              alt="Maison VIII Logo"
              className="max-w-[220px] mx-auto filter brightness-95 hover:scale-[1.02] transition-transform duration-500"
            />
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-gold/45 to-transparent mx-auto mt-2" />
            <div className="space-y-1">
              <h1 className="editorial-title text-xl tracking-[0.2em] text-gold-bright uppercase pt-1">
                Monitor de Pedidos
              </h1>
              <p className="text-xs text-crema/40 font-light tracking-wider">
                Ingrese sus credenciales de administración
              </p>
            </div>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center gap-3 animate-fade-in shadow-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span className="font-medium">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-[0.15em] block">
                Usuario Autorizado
              </label>
              <div className="group relative flex items-center bg-[#111A11] border border-gold/15 rounded-xl px-4 py-3.5 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/15 transition-all duration-300 shadow-inner">
                <span className="text-crema/30 group-focus-within:text-gold transition-colors pr-3">
                  <UserIcon className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs text-crema placeholder-crema/20 focus:outline-none focus:ring-0 font-medium"
                  placeholder="Ej. Mario Bernard"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-[0.15em] block">
                Contraseña
              </label>
              <div className="group relative flex items-center bg-[#111A11] border border-gold/15 rounded-xl px-4 py-3.5 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/15 transition-all duration-300 shadow-inner">
                <span className="text-crema/30 group-focus-within:text-gold transition-colors pr-3">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs text-crema placeholder-crema/20 focus:outline-none focus:ring-0 font-mono tracking-widest"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-gold to-[#d4af37] text-[#0A0F0A] hover:from-[#d4af37] hover:to-gold font-bold py-4 px-6 rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(197,168,128,0.2)] hover:shadow-[0_8px_30px_rgba(197,168,128,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer mt-4"
            >
              Acceder al Monitor
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MONITOR INTERFACE (no-print)
  return (
    <>
      <div className="no-print min-h-screen flex flex-col bg-[#0A0F0A]">
        {/* Header Bar */}
        <header className="sticky top-0 z-50 bg-[#0A0F0A]/90 backdrop-blur-md border-b border-gold/15 py-4 px-6 sm:px-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Brand Title */}
            <div className="flex items-center gap-4.5 group">
              <img
                src="/logos/logo_sinfondo_500x500.png"
                alt="Maison VIII Icon"
                className="w-14 h-14 object-contain filter brightness-95 group-hover:rotate-6 transition-transform duration-500"
              />
              <div className="space-y-0.5">
                <h1 className="editorial-title text-2xl tracking-[0.12em] text-gold-bright font-bold">
                  MAISON VIII
                </h1>
                <span className="text-[9px] text-crema/40 tracking-[0.25em] uppercase block font-light">
                  Monitor de Pedidos al Instante
                </span>
              </div>
            </div>

            {/* Connection and AutoRefresh Status */}
            <div className="flex items-center flex-wrap gap-3 justify-center">
              <div className="bg-[#111A11]/80 border border-gold/10 px-4 py-2 rounded-xl text-xs flex items-center gap-2.5 shadow-sm hover:border-gold/20 transition-all duration-300">
                <span className="relative flex h-2 w-2">
                  {!db.isMock && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${db.isMock ? 'bg-amber-500' : 'bg-green-500'}`} />
                </span>
                <span className="text-crema/70 text-[11px] font-medium tracking-wide">
                  Base: <strong className="text-gold-bright font-semibold">{db.isMock ? 'Local (Mock)' : 'Supabase (Real)'}</strong>
                </span>
              </div>

              <div className="bg-[#111A11]/80 border border-gold/10 px-4 py-2 rounded-xl text-xs flex items-center gap-2.5 shadow-sm hover:border-gold/20 transition-all duration-300">
                <RefreshCw className="w-3.5 h-3.5 text-gold-bright animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-crema/70 text-[11px] font-medium tracking-wide">
                  Recarga en: <strong className="text-gold-bright font-mono font-semibold">{refreshCountdown}s</strong>
                </span>
              </div>

              <button
                onClick={loadOrders}
                disabled={loadingOrders}
                className="bg-gradient-to-r from-gold to-[#d4af37] text-[#0A0F0A] hover:from-[#d4af37] hover:to-gold disabled:opacity-50 p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center justify-center"
                title="Refrescar ahora"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''} text-[#0A0F0A]`} />
              </button>
            </div>

            {/* User Session & Logout */}
            <div className="flex items-center gap-5">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-semibold text-crema/90 block">
                  {currentUser}
                </span>
                <span className="text-[9px] text-gold-bright/80 uppercase tracking-[0.15em] block font-medium">
                  Administrador
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 p-2.5 px-4 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-sm"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Actions / Date Selector */}
        <div className="bg-[#0D150D]/50 border-b border-gold/10 py-5 px-6 sm:px-8 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gold-bright" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-crema/40 tracking-wider">Viendo pedidos de:</span>
                <div className="relative flex items-center bg-[#0C140C] border border-gold/15 rounded-xl p-2 px-3.5 text-xs text-crema focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/10 transition-all duration-300 font-mono">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-transparent border-none text-crema focus:outline-none focus:ring-0 p-0 text-xs cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-crema/60">
              {dismissedIds.length > 0 && (
                <button
                  onClick={() => {
                    setDismissedIds([]);
                    localStorage.removeItem('maison_monitor_dismissed_orders');
                  }}
                  className="bg-transparent border border-gold/25 hover:border-gold text-gold hover:text-gold-bright hover:bg-gold/5 text-[10px] px-3.5 py-1.5 rounded-xl tracking-wider uppercase font-bold transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                >
                  Restaurar Ocultos ({dismissedIds.length})
                </button>
              )}
              <div className="bg-[#111A11]/60 border border-gold/10 px-4 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-[11px] text-crema/50">Pedidos del día:</span>
                <strong className="text-gold-bright font-mono text-base font-extrabold">{filteredOrders.length}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Listing Grid */}
        <main className="flex-grow p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {loadingOrders && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="w-8 h-8 text-gold animate-spin" />
              <p className="text-sm text-crema/50">Cargando pedidos de la base de datos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-[#111A11]/30 border border-dashed border-gold/10 rounded-lg">
              <ShoppingBag className="w-12 h-12 text-gold/30" />
              <h3 className="editorial-title text-xl text-crema/80 font-light">Sin pedidos programados</h3>
              <p className="text-xs text-crema/40 max-w-sm">
                No hay pedidos programados para la fecha seleccionada ({filterDate}).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredOrders.map((order) => {
                // Status badge styling map
                const statusColors: Record<string, string> = {
                  pendiente: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                  confirmado: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
                  preparacion: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
                  camino: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
                  entregado: 'bg-green-500/10 border-green-500/20 text-green-400',
                  cancelado: 'bg-red-500/10 border-red-500/20 text-red-400',
                };
                const statusClass = statusColors[order.status.toLowerCase()] || 'bg-gold/5 border-gold/25 text-gold';

                return (
                  <div
                    key={order.id}
                    className="bg-gradient-to-b from-[#121E12] to-[#0E170E] border border-gold/15 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden hover:border-gold/30 hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="p-5 bg-gradient-to-r from-[#172517] to-[#121F12] border-b border-gold/10 flex justify-between items-center gap-2">
                      <div>
                        <span className="font-mono text-gold-bright font-extrabold text-base tracking-wide">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] text-crema/45 uppercase tracking-wider block mt-0.5">
                          Fecha: {order.delivery_date}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${statusClass}`}>
                          {order.status}
                        </span>
                        <span className="text-[10px] text-crema/50 block mt-1.5 flex items-center gap-1.5 justify-end font-mono">
                          <Clock className="w-3.5 h-3.5 text-gold-bright/75" />
                          {order.delivery_time_slot}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-5 flex-grow text-xs leading-relaxed">
                      {/* Client Info */}
                      <div className="space-y-1 border-b border-crema/5 pb-3.5">
                        <span className="text-[9px] text-gold/75 uppercase tracking-[0.15em] font-semibold block">
                          Cliente
                        </span>
                        <p className="font-bold text-crema text-base tracking-wide">
                          {order.client_name}
                        </p>
                        <p className="text-crema/70 flex items-center gap-2 mt-1 font-medium">
                          <Phone className="w-4 h-4 text-gold-bright/60" />
                          {order.client_phone}
                        </p>
                      </div>

                      {/* Delivery Address */}
                      <div className="space-y-1 border-b border-crema/5 pb-3.5">
                        <span className="text-[9px] text-gold/75 uppercase tracking-[0.15em] font-semibold block">
                          Dirección de Entrega
                        </span>
                        <p className="text-crema/80 flex items-start gap-2 text-[12px] leading-relaxed">
                          <MapPin className="w-4 h-4 text-gold-bright/60 mt-0.5 flex-shrink-0" />
                          <span>{order.delivery_address}</span>
                        </p>
                        {order.delivery_instructions && (
                          <div className="mt-2.5 bg-[#172517]/80 p-3 rounded-xl border border-gold/5 text-[10px] text-crema/60 italic flex gap-2 items-start shadow-inner">
                            <AlertCircle className="w-4 h-4 text-gold-bright/50 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong className="text-gold-bright/80 font-bold block mb-0.5 not-italic uppercase tracking-wider text-[8px]">Indicaciones:</strong>
                              {order.delivery_instructions}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-2 border-b border-crema/5 pb-3.5">
                        <span className="text-[9px] text-gold/75 uppercase tracking-[0.15em] font-semibold block">
                          Productos
                        </span>
                        <div className="bg-[#0C140C]/65 p-3.5 rounded-xl border border-gold/5 space-y-2 max-h-[135px] overflow-y-auto pr-1 shadow-inner">
                          {order.items?.map((item: OrderItem, idx: number) => {
                            const variantsText = Object.keys(item.variant_choices || {}).length > 0
                              ? ` (${Object.entries(item.variant_choices).map(([, v]) => v).join(', ')})`
                              : '';
                            return (
                              <div key={idx} className="flex justify-between items-start text-[11px] leading-relaxed border-b border-crema/[0.02] last:border-b-0 pb-1.5 last:pb-0">
                                <span className="text-crema/90 font-medium">
                                  <strong className="text-gold-bright bg-gold/10 border border-gold/20 px-1.5 py-0.2 rounded text-[10px] mr-1.5 font-extrabold">{item.quantity}x</strong> 
                                  {item.product_name}
                                  {variantsText && (
                                    <span className="block text-[9.5px] text-gold-bright/60 font-sans italic mt-0.5 pl-[32px]">{variantsText}</span>
                                  )}
                                </span>
                                <span className="text-crema/50 font-mono font-medium ml-2">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes / Comments */}
                      {order.notes && (
                        <div className="bg-red-950/20 border border-red-500/20 p-3.5 rounded-xl text-[11px] text-red-200/90 shadow-sm flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <strong className="text-red-400 text-[9px] uppercase tracking-[0.15em] block mb-0.5">Notas de Cocina:</strong>
                            <p className="italic font-light">{order.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Payment & Totals */}
                      <div className="pt-1.5 text-[11px] space-y-1.5">
                        <div className="flex justify-between items-center text-crema/55">
                          <span>Pago: <strong className="text-crema/80 capitalize">{order.payment_method}</strong></span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            order.payment_status === 'pagado'
                              ? 'bg-green-500/10 border-green-500/20 text-green-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          } uppercase tracking-wider`}>
                            {order.payment_status}
                          </span>
                        </div>
                        {order.loyalty_discount !== undefined && order.loyalty_discount > 0 && (
                          <div className="flex justify-between text-green-400 font-medium">
                            <span>Descuento LE CLUB 8</span>
                            <span>-${order.loyalty_discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm pt-2.5 border-t border-crema/5 font-semibold text-crema">
                          <span>Total Neto</span>
                          <span className="text-gold-bright font-mono text-base font-extrabold bg-gold/5 border border-gold/20 px-2.5 py-1 rounded-lg">${order.total.toFixed(2)} MXN</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 bg-[#0D150D] border-t border-gold/10 grid grid-cols-3 gap-3">
                      <button
                        onClick={() => triggerPrint(order, 'comanda')}
                        className="bg-transparent border border-gold/30 hover:border-gold hover:bg-gold/5 text-gold hover:text-gold-bright py-3 rounded-xl text-xs tracking-wider font-semibold uppercase flex items-center justify-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer shadow-sm"
                        title="Imprimir comanda de cocina"
                      >
                        <Printer className="w-4 h-4" />
                        Comanda
                      </button>

                      <button
                        onClick={() => triggerPrint(order, 'ticket')}
                        className="bg-gradient-to-r from-gold to-[#d4af37] text-[#0A0F0A] hover:from-[#d4af37] hover:to-gold py-3 rounded-xl text-xs tracking-wider font-bold uppercase flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_4px_12px_rgba(197,168,128,0.15)] hover:shadow-[0_6px_18px_rgba(197,168,128,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
                        title="Imprimir ticket de cliente"
                      >
                        <Printer className="w-4 h-4" />
                        Ticket
                      </button>

                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-transparent border border-red-500/25 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300 py-3 rounded-xl text-xs tracking-wider font-semibold uppercase flex items-center justify-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Borrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* PRINT TICKET AREA (only displayed when printing) */}
      {printPayload && (
        <div className={`print-section ${printPayload.mode === 'comanda' ? 'comanda-mode-container' : 'ticket-mode-container'}`}>
          {printPayload.mode === 'comanda' ? (
            /* COMANDA DE COCINA (Monospaced kitchen layout, large quantities, notes, instructions) */
            <div className="space-y-4">
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '2px', marginBottom: '3px' }}>
                <h2 className="editorial-title" style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase' }}>MAISON VIII</h2>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '1px' }}>*** COMANDA DE COCINA ***</div>
              </div>

              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <p><strong>FOLIO:</strong> {printPayload.order.order_number}</p>
                <p><strong>ENTREGA:</strong> {printPayload.order.delivery_date} ({printPayload.order.delivery_time_slot})</p>
                <p><strong>CLIENTE:</strong> {printPayload.order.client_name} ({printPayload.order.client_phone})</p>
                <p><strong>DIRECCIÓN:</strong> {printPayload.order.delivery_address}</p>
                {printPayload.order.delivery_instructions && (
                  <p style={{ marginTop: '1px', fontStyle: 'italic' }}>
                    <strong>INDICACIONES:</strong> {printPayload.order.delivery_instructions}
                  </p>
                )}
              </div>

              <div className="ticket-divider-dashed" />

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ width: '20%', textAlign: 'left', fontSize: '11px', paddingBottom: '1px' }}>CANT</th>
                    <th style={{ width: '80%', textAlign: 'left', fontSize: '11px', paddingBottom: '1px' }}>ARTÍCULO / VARIANTE</th>
                  </tr>
                </thead>
                <tbody>
                  {printPayload.order.items?.map((item: OrderItem, idx: number) => {
                    const variantsText = Object.keys(item.variant_choices || {}).length > 0
                      ? Object.entries(item.variant_choices).map(([k, v]) => `${k}:${v}`).join(', ')
                      : '';

                    return (
                      <tr key={idx} className="item-row">
                        <td style={{ verticalAlign: 'top', padding: '3px 0' }}>
                          <span className="qty-badge">x{item.quantity}</span>
                        </td>
                        <td style={{ verticalAlign: 'top', padding: '3px 0', fontSize: '12px' }}>
                          <strong>{item.product_name}</strong>
                          {variantsText && (
                            <div className="item-variants" style={{ color: '#333', fontStyle: 'italic', marginTop: '1px' }}>
                              {variantsText}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Kitchen notes (in comanda mode, displayed prominently) */}
              {printPayload.order.notes && (
                <div className="comanda-notes" style={{ border: '2px solid #000', padding: '1.5mm', marginTop: '3mm', fontSize: '11px' }}>
                  <strong>OBSERVACIONES (CLIENTE):</strong>
                  <p style={{ marginTop: '1px', fontStyle: 'italic', fontWeight: 'bold' }}>{printPayload.order.notes}</p>
                </div>
              )}

              <div style={{ marginTop: '5mm', textAlign: 'center', fontSize: '9px', opacity: 0.6 }}>
                <p>Maison VIII - Cocina Interna</p>
                <p style={{ marginTop: '1px' }}>Impreso el: {new Date().toLocaleString()}</p>
              </div>
            </div>
          ) : (
            /* TICKET DE VENTA (Elegant client ticket, matching checkout success) */
            <div className="space-y-4">
              {/* Elegant header banner */}
              <div className="text-center pb-2 space-y-1">
                <img
                  src="/logos/logo_headersinfondo_500x200.png"
                  className="ticket-logo"
                  alt="Maison VIII Logo"
                  style={{ maxWidth: '40mm', margin: '0 auto 1mm auto', display: 'block', filter: 'grayscale(1) brightness(0)' }}
                />
          
                <p style={{ fontSize: '8px', letterSpacing: '0.12em', opacity: 0.8, textTransform: 'uppercase' }}>
                  EL ARTE DE CELEBRAR LO EXTRAORDINARIO
                </p>
                <p style={{ fontSize: '9px', fontFamily: 'Courier Prime, monospace', marginTop: '1mm' }}>
                  FOLIO: {printPayload.order.order_number}
                </p>
              </div>

              <div className="ticket-divider-dashed" />

              {/* Delivery & Schedule Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', gap: '4px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Cliente</span>
                  <span style={{ fontWeight: 'bold', display: 'block' }}>{printPayload.order.client_name}</span>
                  <span style={{ display: 'block', opacity: 0.7 }}>{printPayload.order.client_phone}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Pago</span>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>
                    {printPayload.order.payment_method === 'efectivo' && 'Efectivo'}
                    {printPayload.order.payment_method === 'transferencia' && 'Transferencia'}
                    {printPayload.order.payment_method === 'link_pago' && 'Tarjeta (Link)'}
                  </span>
                  <span style={{ display: 'block', fontSize: '8px', opacity: 0.8 }}>
                    ({printPayload.order.payment_status.toUpperCase()})
                  </span>
                </div>
              </div>

              <div className="ticket-divider-solid" />

              {/* Delivery Details */}
              <div style={{ fontSize: '9.5px' }} className="space-y-1">
                <div>
                  <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Entrega a Domicilio</span>
                  <span style={{ display: 'block' }}>{printPayload.order.delivery_address}</span>
                </div>
                {printPayload.order.delivery_instructions && (
                  <div style={{ marginTop: '2px' }}>
                    <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Referencias</span>
                    <span style={{ fontStyle: 'italic', opacity: 0.8, display: 'block' }}>{printPayload.order.delivery_instructions}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: 'bold', borderTop: '1px solid #f0f0f0', paddingTop: '2px' }}>
                  <span>Fecha: {printPayload.order.delivery_date}</span>
                  <span style={{ marginLeft: 'auto' }}>Horario: {printPayload.order.delivery_time_slot}</span>
                </div>
              </div>

              <div className="ticket-divider-dashed" />

              {/* Items Summary Table */}
              <div>
                <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>Detalle del Pedido</span>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {printPayload.order.items?.map((item: OrderItem, idx: number) => {
                      const variantsText = Object.keys(item.variant_choices || {}).length > 0
                        ? Object.entries(item.variant_choices).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : '';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f2f2f2' }}>
                          <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                            <strong>{item.quantity}x</strong> {item.product_name}
                            {variantsText && <span style={{ display: 'block', fontSize: '8px', opacity: 0.6, fontStyle: 'italic', marginTop: '0.5px' }}>{variantsText}</span>}
                          </td>
                          <td style={{ padding: '3px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ticket-divider-solid" />

              {/* Pricing Totals */}
              <div style={{ fontSize: '10px' }} className="space-y-1">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span style={{ marginLeft: 'auto' }}>${printPayload.order.subtotal.toFixed(2)}</span>
                </div>
                {printPayload.order.loyalty_discount !== undefined && printPayload.order.loyalty_discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#000000', fontWeight: 'bold' }}>
                    <span>Descuento LE CLUB 8</span>
                    <span style={{ marginLeft: 'auto' }}>-${printPayload.order.loyalty_discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Envío ({printPayload.order.distance_km || 0} km)</span>
                  <span style={{ marginLeft: 'auto' }}>${printPayload.order.delivery_fee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', borderTop: '1px solid #000000', paddingTop: '3px', marginTop: '2px' }}>
                  <span style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>TOTAL NETO</span>
                  <span style={{ marginLeft: 'auto' }}>${printPayload.order.total.toFixed(2)} MXN</span>
                </div>
              </div>

              {printPayload.order.notes && (
                <div style={{ border: '1px solid #dddddd', padding: '3px', fontSize: '9px', fontStyle: 'italic', marginTop: '3px' }}>
                  <strong>Observaciones:</strong> {printPayload.order.notes}
                </div>
              )}

              {printPayload.order.loyalty_earned !== undefined && printPayload.order.loyalty_earned > 0 && (
                <div style={{ marginTop: '2px', fontSize: '8.5px', textAlign: 'center', fontStyle: 'italic', opacity: 0.85 }}>
                  ¡Acumulaste +${printPayload.order.loyalty_earned.toFixed(2)} MXN en LE CLUB 8!
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '5mm', opacity: 0.85 }}>
                <p>¡Muchas gracias por elegir la distinción de Maison VIII! 🥐</p>
                <p style={{ fontSize: '8px', opacity: 0.5, marginTop: '0.5mm' }}>Impreso el: {new Date().toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
