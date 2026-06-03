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
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  // Orders and dashboard states
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [filterDate, setFilterDate] = useState<string>('');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(10);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Printing state
  const [printPayload, setPrintPayload] = useState<{
    order: Order;
    mode: 'comanda' | 'ticket';
  } | null>(null);

  // Helper to get local YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Authentication Check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = sessionStorage.getItem('maison_viii_admin_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          setIsAuthenticated(true);
          setCurrentUser(parsed.user || 'Administrador');
        } catch (e) {
          console.error(e);
        }
      }

      const dismissed = localStorage.getItem('maison_monitor_dismissed_orders');
      if (dismissed) {
        try {
          setDismissedIds(JSON.parse(dismissed));
        } catch (e) {
          console.error(e);
        }
      }

      setAuthLoading(false);
      setFilterDate(getLocalDateString());
    }
  }, []);

  // 2. Fetch Orders
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
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-md w-full glass-panel border border-gold/20 p-8 rounded-lg space-y-6 shadow-2xl relative z-10">
          <div className="text-center space-y-2">
            <img
              src="/logos/logo_headersinfondo_500x200.png"
              alt="Maison VIII Logo"
              className="max-w-[200px] mx-auto filter brightness-95"
            />
            <h1 className="editorial-title text-lg tracking-widest text-gold uppercase pt-2">
              Monitor de Pedidos
            </h1>
            <p className="text-xs text-crema/50 font-light">
              Ingrese sus credenciales de administración
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gold uppercase tracking-wider block">
                Usuario Autorizado
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-crema/40">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-[#162216] border border-gold/15 rounded p-3 pl-10 text-xs text-crema placeholder-crema/25 focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ej. Mario Bernard"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gold uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-crema/40">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#162216] border border-gold/15 rounded p-3 pl-10 text-xs text-crema placeholder-crema/25 focus:outline-none focus:border-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gold text-[#0A0F0A] hover:bg-gold-bright font-bold py-3.5 px-4 rounded text-xs tracking-widest uppercase transition-all duration-300 shadow-lg mt-2 cursor-pointer"
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
        <header className="bg-[#111A11] border-b border-gold/15 py-4 px-6 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Brand Title */}
            <div className="flex items-center gap-4">
              <img
                src="/logos/logo_sinfondo_500x500.png"
                alt="Maison VIII Icon"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="editorial-title text-xl tracking-wider text-gold font-medium">
                  MAISON VIII
                </h1>
                <span className="text-[10px] text-crema/50 tracking-widest uppercase block mt-0.5">
                  Monitor de Pedidos al Instante
                </span>
              </div>
            </div>

            {/* Connection and AutoRefresh Status */}
            <div className="flex items-center flex-wrap gap-3 justify-center">
              <div className="bg-[#192719] border border-gold/10 px-3 py-1.5 rounded text-[11px] flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${db.isMock ? 'bg-amber-500' : 'bg-green-500'}`} />
                <span className="text-crema/75">
                  Base: <strong className="text-gold">{db.isMock ? 'Local (Mock)' : 'Supabase (Real)'}</strong>
                </span>
              </div>

              <div className="bg-[#192719] border border-gold/10 px-3 py-1.5 rounded text-[11px] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-gold animate-spin" />
                <span className="text-crema/75">
                  Recargando en: <strong className="text-gold">{refreshCountdown}s</strong>
                </span>
              </div>

              <button
                onClick={loadOrders}
                disabled={loadingOrders}
                className="bg-gold text-[#0A0F0A] hover:bg-gold-bright disabled:opacity-50 p-2 rounded transition-colors cursor-pointer"
                title="Refrescar ahora"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* User Session & Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="text-xs text-crema/80 block font-medium">
                  {currentUser}
                </span>
                <span className="text-[9px] text-gold uppercase tracking-wider block">
                  Administrador
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="border border-red-500/30 text-red-400 hover:bg-red-500/10 p-2.5 rounded transition-all cursor-pointer flex items-center gap-2 text-xs"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Actions / Date Selector */}
        <div className="bg-[#0e160e] border-b border-gold/10 py-4 px-6 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gold" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-crema/50">Viendo pedidos de:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-[#121A12] border border-gold/20 rounded p-1.5 px-3 text-xs text-crema focus:outline-none focus:border-gold font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-crema/60">
              {dismissedIds.length > 0 && (
                <button
                  onClick={() => {
                    setDismissedIds([]);
                    localStorage.removeItem('maison_monitor_dismissed_orders');
                  }}
                  className="bg-transparent border border-gold/25 hover:border-gold text-gold hover:text-gold-bright text-[10px] px-2.5 py-1 rounded tracking-wider uppercase font-semibold transition-colors cursor-pointer"
                >
                  Restaurar Ocultos ({dismissedIds.length})
                </button>
              )}
              <span>
                Total de pedidos hoy: <strong className="text-gold font-mono text-sm">{filteredOrders.length}</strong>
              </span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => {
                return (
                  <div
                    key={order.id}
                    className="bg-[#111A11] border border-gold/15 rounded-lg shadow-xl flex flex-col justify-between overflow-hidden hover:border-gold/30 transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="p-4 bg-[#162216] border-b border-gold/10 flex justify-between items-center gap-2">
                      <div>
                        <span className="font-mono text-gold font-bold text-sm">
                          {order.order_number}
                        </span>
                        <span className="text-[9px] text-crema/40 uppercase tracking-wider block mt-0.5">
                          Fecha: {order.delivery_date}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-gold/25 bg-gold/5 text-gold capitalize">
                          {order.status}
                        </span>
                        <span className="text-[9px] text-crema/40 block mt-1 flex items-center gap-1 justify-end font-mono">
                          <Clock className="w-3 h-3 text-gold/75" />
                          {order.delivery_time_slot}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4 flex-grow text-xs leading-relaxed">
                      {/* Client Info */}
                      <div className="space-y-1.5 border-b border-crema/5 pb-3">
                        <span className="text-[9px] text-gold uppercase tracking-wider font-semibold block">
                          Cliente
                        </span>
                        <p className="font-medium text-crema text-sm">
                          {order.client_name}
                        </p>
                        <p className="text-crema/70 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gold/60" />
                          {order.client_phone}
                        </p>
                      </div>

                      {/* Delivery Address */}
                      <div className="space-y-1.5 border-b border-crema/5 pb-3">
                        <span className="text-[9px] text-gold uppercase tracking-wider font-semibold block">
                          Dirección de Entrega
                        </span>
                        <p className="text-crema/80 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gold/60 mt-0.5 flex-shrink-0" />
                          <span>{order.delivery_address}</span>
                        </p>
                        {order.delivery_instructions && (
                          <div className="mt-1.5 bg-[#172517]/50 p-2 rounded border border-gold/5 text-[10px] text-crema/60 italic">
                            <strong>Instrucciones:</strong> {order.delivery_instructions}
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-2 border-b border-crema/5 pb-3">
                        <span className="text-[9px] text-gold uppercase tracking-wider font-semibold block">
                          Productos
                        </span>
                        <div className="space-y-1.5 font-mono max-h-[120px] overflow-y-auto pr-1">
                          {order.items?.map((item: OrderItem, idx: number) => {
                            const variantsText = Object.keys(item.variant_choices || {}).length > 0
                              ? ` (${Object.entries(item.variant_choices).map(([, v]) => v).join(', ')})`
                              : '';
                            return (
                              <div key={idx} className="flex justify-between items-start text-[11px]">
                                <span className="text-crema/85">
                                  <strong className="text-gold mr-1">{item.quantity}x</strong> 
                                  {item.product_name}
                                  {variantsText && (
                                    <span className="block text-[9px] text-gold/60 font-sans italic">{variantsText}</span>
                                  )}
                                </span>
                                <span className="text-crema/60 ml-2">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes / Comments */}
                      {order.notes && (
                        <div className="space-y-1 bg-[#1a0f0f]/30 border border-red-500/10 p-2.5 rounded text-[11px] text-crema/70">
                          <strong className="text-red-400 block text-[9px] uppercase tracking-wider">Notas de Cocina:</strong>
                          <p className="italic font-light">{order.notes}</p>
                        </div>
                      )}

                      {/* Payment & Totals */}
                      <div className="pt-1 text-[11px] space-y-1">
                        <div className="flex justify-between text-crema/50">
                          <span>Pago: <strong className="text-crema/80 capitalize">{order.payment_method}</strong></span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
                            order.payment_status === 'pagado'
                              ? 'bg-green-500/10 border-green-500/20 text-green-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          } uppercase`}>
                            {order.payment_status}
                          </span>
                        </div>
                        {order.loyalty_discount !== undefined && order.loyalty_discount > 0 && (
                          <div className="flex justify-between text-green-400 font-medium">
                            <span>Descuento LE CLUB 8</span>
                            <span>-${order.loyalty_discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-1 border-t border-crema/5 font-semibold text-crema">
                          <span>Total Neto</span>
                          <span className="text-gold font-mono font-bold">${order.total.toFixed(2)} MXN</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 bg-[#141f14] border-t border-gold/10 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => triggerPrint(order, 'comanda')}
                        className="bg-transparent border border-gold/25 hover:border-gold text-gold hover:text-gold-bright py-2 rounded text-[10px] tracking-wider font-semibold uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Imprimir comanda de cocina"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Comanda
                      </button>

                      <button
                        onClick={() => triggerPrint(order, 'ticket')}
                        className="bg-gold text-[#0A0F0A] hover:bg-gold-bright py-2 rounded text-[10px] tracking-wider font-bold uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Imprimir ticket de cliente"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Ticket
                      </button>

                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="border border-red-500/20 hover:border-red-500/50 text-red-400 hover:bg-red-500/5 py-2 rounded text-[10px] tracking-wider font-semibold uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                <h2 className="editorial-title text-base font-bold tracking-widest text-[#000000]">
                  M A I S O N  V I I I
                </h2>
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
