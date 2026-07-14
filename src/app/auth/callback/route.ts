import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // O método setAll pode lançar erro se chamado em Server Components/Routes
              // onde os cookies não podem ser modificados pós-envio de headers.
            }
          },
        },
      }
    )

    // Troca o código do OAuth do Google pela sessão do Supabase
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirecionamento seguro no mesmo domínio da requisição
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Se falhar ou não houver código de sessão, redireciona o usuário para a página de login raiz
  return NextResponse.redirect(new URL('/', request.url))
}
