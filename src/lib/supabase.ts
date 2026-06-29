import { createClient } from '@supabase/supabase-js'

// .env.local に保存した鍵を呼び出します
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 鍵を使って、Supabaseと通信するための専用クライアント（トンネル）を作ります
export const supabase = createClient(supabaseUrl, supabaseAnonKey)