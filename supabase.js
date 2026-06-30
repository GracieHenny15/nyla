import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cukjrnbqroyonhszlwxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2pybmJxcm95b25oc3psd3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDgyNzEsImV4cCI6MjA5NjAyNDI3MX0.ntABZT44aUeKYhKmVwZLA6ED0kY9laKIc1N2-AHjWME';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);