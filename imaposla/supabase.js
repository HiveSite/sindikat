window.IMAPOSLA_SUPABASE = {
  url: 'https://fjfnnpgaveoonfmwztnr.supabase.co',
  publishableKey: 'sb_publishable_T9-5p7i98BdtBIa297qa3g_pnORsDvn'
};

window.imaposlaSupabase = null;

if (window.supabase && window.IMAPOSLA_SUPABASE.url && window.IMAPOSLA_SUPABASE.publishableKey) {
  window.imaposlaSupabase = window.supabase.createClient(
    window.IMAPOSLA_SUPABASE.url,
    window.IMAPOSLA_SUPABASE.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
}
