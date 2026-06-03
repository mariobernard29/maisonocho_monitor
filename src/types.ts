export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  variant_choices: Record<string, string>;
}

export type OrderStatus = 'pendiente' | 'confirmado' | 'preparacion' | 'camino' | 'entregado' | 'cancelado';

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  client_name: string;
  client_phone: string;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  distance_km?: number;
  delivery_instructions?: string;
  delivery_fee: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  delivery_date: string;
  delivery_time_slot: string;
  payment_method: 'efectivo' | 'transferencia' | 'link_pago';
  payment_status: 'pendiente' | 'pagado';
  notes?: string;
  items?: OrderItem[];
  loyalty_discount?: number;
  loyalty_earned?: number;
  created_at?: string;
}

export interface Settings {
  whatsapp_number_admin?: string;
  google_maps_origin_link?: string;
  show_prep_time?: boolean;
}
