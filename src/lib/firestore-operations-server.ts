import { adminDb } from "@/lib/firebase-admin";

export const createOrUpdateStudentServer = async (user: any) => {
  const studentRef = adminDb.collection("Estudiantes").doc(user.id);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) {
    await studentRef.set({
      uid: user.id,
      nombre: user.name || "",
      correo: user.email || "",
      rol: "estudiante",
      grupo: "",
      carrera: "turismo",
      fotoPerfil: user.image || "",
      createdAt: new Date(),
      lastLogin: new Date(),
    });
  } else {
    await studentRef.update({ lastLogin: new Date() });
  }
};
