import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database';

const PUBLIC_PATHS = ['/login'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));
  // A fetch follows a redirect to /login silently and gets a 200 HTML page, so API calls get a
  // JSON error the page can show instead.
  const isApi = request.nextUrl.pathname.startsWith('/api/');

  if (!user) {
    if (isPublic) return response;
    if (isApi) {
      return NextResponse.json(
        { error: 'Your session has expired. Reload the page to sign in again.' },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // This app is for super admins only. Anyone else is signed out rather than
  // redirected, so a hotel account can't linger in a session here.
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (userRole?.role !== 'super-admin') {
    await supabase.auth.signOut();
    if (isApi) {
      const denied = NextResponse.json({ error: 'Super admins only.' }, { status: 403 });
      // Carry over the cookies signOut just cleared, so the session really ends.
      response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
      return denied;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('denied', '1');
    return NextResponse.redirect(url);
  }

  if (isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
