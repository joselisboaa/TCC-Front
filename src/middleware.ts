import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

const adminRoutes = ['/home/answers', '/home/orientations', '/home/questions', '/home/user-group', '/home/users'];

export async function middleware(req: NextRequest) {
  const jwtToken = req.cookies.get('jwt')?.value;

  if (!jwtToken) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(jwtToken, secret);
    const currentTime = Math.floor(Date.now() / 1000);

    if (payload.exp && currentTime > payload.exp) {
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.set('jwt', '', { maxAge: 0 });
      return response;
    }

    const user = payload.user as {
      id: number;
      phone_number: string | null;
      email: string;
      user_groups: { id: number; text: string; description: string }[];
    };

    if (!user || !user.user_groups) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const isAdmin = user.user_groups.some(group => 
      group.text.toLowerCase() === "administrador"
    );

    const isUnregistered = user.user_groups.some(group =>
      group.text.toLowerCase() === "usuário sem cadastro"
    );

    const path = req.nextUrl.pathname;

    if (path.startsWith('/new-user') && !isUnregistered) {
      return NextResponse.redirect(new URL('/home', req.url));
    }

    if (isUnregistered) {
      if (!path.startsWith('/new-user')) {
        return NextResponse.redirect(new URL('/new-user', req.url));
      }
      return NextResponse.next();
    }

    if (isAdmin && path.startsWith('/form')) {
      return NextResponse.redirect(new URL('/home', req.url));
    }

    if (!isAdmin && path.startsWith('/home')) {
      return NextResponse.redirect(new URL('/form', req.url));
    }

    if (adminRoutes.some(route => path.startsWith(route)) && !isAdmin) {
      return NextResponse.redirect(new URL('/form', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Erro ao validar JWT:", error);

    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set('jwt', '', { maxAge: 0 });
    response.cookies.set('session_expired', '1', { maxAge: 10 });

    return response;
  }
}

export const config = {
  matcher: ['/home/:path*', '/form', '/new-user'], 
};
