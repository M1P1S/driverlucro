const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Cliente admin - backend (ignora RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente autenticado com token do usuário (respeita RLS)
const supabaseClient = (token) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });
};

module.exports = { supabaseAdmin, supabaseClient };