// File: src/app/api/upsert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateStudentServer } from "@/lib/firestore-operations-server";


// Este endpoint solo se llama desde el backend (después de login)
export async function POST(req: NextRequest) {
  try {
    const user = await req.json();

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { error: "Faltan datos del usuario (id o email)." },
        { status: 400 }
      );
    }

    // 🔹 Crea o actualiza el estudiante en Firestore usando Admin SDK
    await createOrUpdateStudentServer(user);

    return NextResponse.json({ ok: true, message: "Usuario creado/actualizado." });
  } catch (error: any) {
    console.error("Error en upsert.ts:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}
