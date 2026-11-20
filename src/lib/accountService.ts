import { supabase, isSupabaseClientConfigured } from './supabaseClient';
import type { Account } from '../types';

export const accountService = {
  async getAll(): Promise<Account[]> {
    if (isSupabaseClientConfigured && supabase) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('target_date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar contas no Supabase:', error);
        throw error;
      }

      return (data || []).map((acc: any) => ({
        id: acc.id,
        email: acc.email,
        link: acc.link || '',
        targetDate: acc.target_date,
        reminder10MinSent: acc.reminder_10_min_sent ?? false,
        readySent: acc.ready_sent ?? false,
        createdAt: acc.created_at,
      }));
    }

    // Fallback para API REST (/api/accounts)
    const res = await fetch('/api/accounts');
    if (!res.ok) throw new Error('Falha ao carregar contas da API');
    return res.json();
  },

  async create(email: string, targetDate: string, link?: string): Promise<Account> {
    const payload = {
      email: email.trim(),
      link: link ? link.trim() : null,
      target_date: targetDate,
      reminder_10_min_sent: false,
      ready_sent: false,
    };

    if (isSupabaseClientConfigured && supabase) {
      const { data, error } = await supabase
        .from('accounts')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar conta no Supabase:', error);
        throw error;
      }

      return {
        id: data.id,
        email: data.email,
        link: data.link || '',
        targetDate: data.target_date,
        reminder10MinSent: data.reminder_10_min_sent ?? false,
        readySent: data.ready_sent ?? false,
        createdAt: data.created_at,
      };
    }

    // Fallback para API REST (/api/accounts)
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        link,
        targetDate,
      }),
    });
    if (!res.ok) throw new Error('Falha ao adicionar conta');
    return res.json();
  },

  async update(id: string, updates: { targetDate?: string; link?: string; email?: string }): Promise<Account> {
    const dbPayload: Record<string, any> = {};
    if (updates.targetDate !== undefined) {
      dbPayload.target_date = updates.targetDate;
      dbPayload.reminder_10_min_sent = false;
      dbPayload.ready_sent = false;
    }
    if (updates.link !== undefined) {
      dbPayload.link = updates.link ? updates.link.trim() : null;
    }
    if (updates.email !== undefined) {
      dbPayload.email = updates.email.trim();
    }

    if (isSupabaseClientConfigured && supabase) {
      const { data, error } = await supabase
        .from('accounts')
        .update(dbPayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar conta no Supabase:', error);
        throw error;
      }

      return {
        id: data.id,
        email: data.email,
        link: data.link || '',
        targetDate: data.target_date,
        reminder10MinSent: data.reminder_10_min_sent ?? false,
        readySent: data.ready_sent ?? false,
        createdAt: data.created_at,
      };
    }

    // Fallback para API REST
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Falha ao atualizar conta');
    return res.json();
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseClientConfigured && supabase) {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) {
        console.error('Erro ao deletar conta no Supabase:', error);
        throw error;
      }
      return;
    }

    const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao deletar conta');
  },

  async clearAll(): Promise<void> {
    if (isSupabaseClientConfigured && supabase) {
      const { error } = await supabase.from('accounts').delete().filter('id', 'not.is', null);
      if (error) {
        console.error('Erro ao limpar contas no Supabase:', error);
        throw error;
      }
      return;
    }

    const res = await fetch('/api/accounts', { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao limpar contas');
  },

  async restore(accounts: Account[]): Promise<void> {
    if (isSupabaseClientConfigured && supabase) {
      const payload = accounts.map((acc) => ({
        id: acc.id,
        email: acc.email,
        link: acc.link ? acc.link.trim() : null,
        target_date: acc.targetDate,
        reminder_10_min_sent: acc.reminder10MinSent ?? false,
        ready_sent: acc.readySent ?? false,
      }));

      const { error } = await supabase.from('accounts').upsert(payload);
      if (error) {
        console.error('Erro ao restaurar no Supabase:', error);
        throw error;
      }
      return;
    }

    const res = await fetch('/api/accounts/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts }),
    });
    if (!res.ok) throw new Error('Falha ao restaurar backup');
  },
};
