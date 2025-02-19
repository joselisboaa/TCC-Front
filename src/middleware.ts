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

    const user = payload.user as {
      id: number;
      phone_number: string;
      email: string;
      password: string;
      user_groups: { id: number; text: string; description: string }[];
    };

    if (!user || !user.user_groups) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const isAdmin = user.user_groups.some(group => 
      group.text.toLowerCase() === "administrador"
    );

    if (!isAdmin && req.nextUrl.pathname.startsWith('/home')) {
      return NextResponse.redirect(new URL('/form', req.url));
    }

    if (adminRoutes.some(route => req.nextUrl.pathname.startsWith(route)) && !isAdmin) {
      return NextResponse.redirect(new URL('/form', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Erro ao validar JWT:", error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export const config = {
  matcher: ['/home/:path*'],
};
