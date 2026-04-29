// =============================================
// FinControl — Supabase Client
// =============================================
// INSTRUÇÕES: Substitua os valores abaixo pelas suas credenciais do Supabase.
// Para encontrar:
//   1. Acesse https://supabase.com/dashboard
//   2. Clique no seu projeto
//   3. Vá em "Settings" (ícone de engrenagem) → "API"
//   4. Copie "Project URL" → cole em SUPABASE_URL
//   5. Copie "anon public" (em Project API keys) → cole em SUPABASE_ANON_KEY

const SUPABASE_URL = 'https://xoubzoabmckjkgdyivoc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdWJ6b2FibWNramtnZHlpdm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODk4ODgsImV4cCI6MjA5MzA2NTg4OH0.wW1N_fm4BLhhW1H7wUhtFsOPrLW5lwIOxEH7bfbW-0g';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
