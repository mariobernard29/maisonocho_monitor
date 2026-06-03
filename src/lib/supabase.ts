import { createClient } from '@supabase/supabase-js';
import { dbMock } from './db-mock';
import type { Order } from '../types';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project') &&
  supabaseUrl.startsWith('https://');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const db = {
  isMock: !isSupabaseConfigured,

  async getOrders(): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      return dbMock.getOrders();
    }
    try {
      const { data, error } = await supabase!
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      return (data || []).map((o: any) => {
        let delivery_instructions = o.delivery_instructions || '';
        let notes = o.notes || '';
        if (!delivery_instructions && notes.includes('[Referencias:')) {
          const match = notes.match(/\[Referencias:\s*([\s\S]*?)\]/);
          if (match) {
            delivery_instructions = match[1].trim();
            notes = notes.replace(/\[Referencias:\s*([\s\S]*?)\]/, '').trim();
          }
        }
        return {
          ...o,
          delivery_instructions,
          notes
        };
      });
    } catch (e) {
      console.warn('Supabase getOrders failed, falling back to LocalStorage:', e);
      return dbMock.getOrders();
    }
  },

  async deleteOrder(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      dbMock.deleteOrder(id);
      return;
    }
    try {
      // First delete associated order items to avoid foreign key errors
      await supabase!.from('order_items').delete().eq('order_id', id);
      // Then delete the order itself
      const { error } = await supabase!
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase deleteOrder failed, falling back to LocalStorage:', e);
      dbMock.deleteOrder(id);
    }
  }
};
