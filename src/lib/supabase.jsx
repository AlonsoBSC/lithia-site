import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mnggqrkyysuonnomxuch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZ2dxcmt5eXN1b25ub214dWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTAyNzksImV4cCI6MjA3NzgyNjI3OX0.Xmj09Hj6vxxRlyCOAJQGNZMhcUB56hvOgKAPQ8XDww0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);