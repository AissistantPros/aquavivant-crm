import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function submitReferido({ codigo, name, phone, email, modelo, notas }) {
  const { data, error } = await supabase.rpc('submit_referido', {
    p_codigo: codigo,
    p_name: name,
    p_phone: phone,
    p_email: email || null,
    p_modelo: modelo || null,
    p_notas: notas || null,
  });
  if (error) throw error;
  return data;
}
