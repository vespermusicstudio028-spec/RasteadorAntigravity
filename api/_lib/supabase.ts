import { createClient } from '@supabase/supabase-js';

// Polyfill para Node.js quando rodar em ambientes sem WebSocket nativo
if (typeof globalThis.WebSocket === 'undefined') {
    (globalThis as any).WebSocket = class {};
}

export const getSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://piyzjodvmejqxvpwzohp.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase Environment Variables não configuradas! Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
    }
    return createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    });
};
