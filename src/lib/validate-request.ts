import { NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

export async function validateRequest<T>(req: Request, schema: ZodSchema<T>) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      // Повертаємо форматовані помилки, які легко відрендерити на фронтенді
      return {
        errorResponse: NextResponse.json(
          {
            message: "Validation failed",
            errors: result.error.flatten().fieldErrors
          },
          { status: 400 }
        ),
        data: null,
      };
    }

    return { errorResponse: null, data: result.data as T };
  } catch (e) {
    return {
      errorResponse: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
      data: null,
    };
  }
}