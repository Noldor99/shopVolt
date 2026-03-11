import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const path = request.nextUrl.searchParams.get('path')
    const secret = request.nextUrl.searchParams.get('secret')

    const expectedSecret = process.env.NEXT_PUBLIC_TOKEN_REVALIDATE;

    if (secret !== expectedSecret) {
        return new Response(JSON.stringify({ message: 'Invalid secret token' }), { status: 401 });
    }

    if (path) {
        revalidatePath(path);
        return new Response(JSON.stringify({ revalidated: true, now: Date.now() }));
    }

    return new Response(JSON.stringify({ revalidated: false, now: Date.now(), message: 'Missing path to revalidate' }));
}
