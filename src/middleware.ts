import { NextRequest, NextResponse } from 'next/server';
import fetchRequest from './utils/fetchRequest';

export async function middleware(req: NextRequest) {
  const jwt = req.cookies.get('jwt')?.value;

  const protectedRoutes = ['/home', '/dashboard', '/answers', '/user-group'];

  
  if (protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    if (!jwt) {
      const loginUrl = new URL('/', req.url);
      return NextResponse.redirect(loginUrl);
    }

    const response = await fetchRequest<null, { redirectURL: string, message: string }>(
      `/oauth2/login/verify?jwt=${jwt}`,
      { method: "GET" }
    );

    if (response.body.message === "Sessão expirada!") {
      const loginUrl = new URL('/', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/dashboard/:path*', '/answers/:path*', '/user-group/:path*'],
};
