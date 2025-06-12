import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggkfidfojiyrgraeywfv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna2ZpZGZvaml5cmdyYWV5d2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTc2MjEsImV4cCI6MjA2NTEzMzYyMX0.tmvIpCqqsClYxDkxHkouxWrLfT3RNUePi2uRxEhzaus'

export const supabase = createClient(supabaseUrl, supabaseKey)
