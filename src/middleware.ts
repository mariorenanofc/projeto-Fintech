import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Inicializa a resposta padrão que será modificada se necessário
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Atualiza os cookies do request atual
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Recria o response com o request atualizado UMA ÚNICA VEZ antes de aplicar os cookies
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Aplica os novos cookies ao response final
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Dispara a chamada segura para pegar a sessão e validar os tokens
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Lista de rotas protegidas (acessíveis apenas por usuários autenticados)
  const protectedRoutes = ['/dashboard', '/profile', '/chat', '/transactions', '/onboarding']
  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))

  // REGRA 1: Usuário DESLOGADO tentando acessar rota protegida
  if (!user && isProtectedRoute) {
    url.pathname = '/' // Manda pro Login
    return NextResponse.redirect(url)
  }

  // REGRA 2: Usuário LOGADO tentando acessar o Login (/)
  if (user && url.pathname === '/') {
    url.pathname = '/dashboard' // Manda pra dentro do app
    return NextResponse.redirect(url)
  }

  // Retorna a resposta com os cookies atualizados
  return supabaseResponse
}

export const config = {
  matcher: [
    // Padrão oficial do Next.js/Supabase para ignorar estáticos, imagens e arquivos PWA
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|js|webmanifest)$).*)',
  ],
}
