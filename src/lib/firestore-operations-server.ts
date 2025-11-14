
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// --- JSON de servicio hardcodeado (SIN CAMBIOS) ---
const serviceAccount = {
  type: "service_account",
  project_id: "bdsql-9416f",
  clientEmail: "firebase-adminsdk-fbsvc@bdsql-9416f.iam.gserviceaccount.com",
  private_key_id: "801f194a0f09d4eea7daf1e8f7c3b8c10f3410a7",
    privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/r88klYA4rKeB\nw3iFmQ7FScjpO5BciLSuiIqr8DbV5Z85pR1hrDQH4QwVxqSkcBrTNPdK3s1J9Fvo\nwfjX+UxKrfl84Zz/oGmbsaLdugrcQvM3pIzvfkrhcw2IMXiMs4GTglMOpkaGEpMi\nhfy5CAwH71/i38e9HxLauiYNhEUwPM1K/ciaKkpAMOzIzHchZwd39085++Yd5RYz\n7ClPLS9bz+pW0pqh76TnvaSxAoGnmIpy4uGtbFmzqVy/Zyup54kGiV38iQkyYA/p\nPPcKJU11nXUJVC85TRo5m/tjcHuKg3shpUjvVvuvLT9weTl9ggyuTOpzrTCkuZOO\nu1A7TcFXAgMBAAECggEAHcnL9oL3HJeUJmHCknxhI76eJsSXYBHshiz449ReKSpY\nbqRepwWURl8uOhoXDujO+mCCR5PNMj9zov211pZKyVY07be/5qe+ka/uv+c/9c+/\nrTd4oWUubM+s3CvX8IGa0toPXzjuv7oWPGi3B+gcuoT0ETU2fIjeLLh93l7eQ6sC\nTfT9fMx6LpQ0GXftFTU8pRT2MoRdSJcfDpBwE1OCgPJUx3tQ7BbQnD33QACLKzbJ\ny/uY3ohvZaGbu/eDILGl3Zyxl3KPdg9yBINgDMWigicmQb3n2etz8TNhtfUk77o9\nMTsNp6vz0N09VkL1OtMKV2MHsMhyjH42XkQqFezZjQKBgQDn7Qsb5zF0ivPZ5+lG\nyjJlQrEG1NnPFfUd4eID54Q7eedqyG+sksAChghy4CHxaxEvjxXP7Qr1qsHx0XWG\ndh0g14SSFMn/tpO6c7kcVavZ9ne/03Ku3/qTDkFiyr8D4XoLwiEyxODxTx8SzG8J\nSLImEYXou85fdRuGMBc+Q++y7QKBgQDTlX3a97hy5WCZbazEgLj9/2Rwcz7gP2pa\nyXl/AkvDrBh9f+5DMrkGIiYejMAolKhO8X2KwQn0xH7d7QUvtdnm5saURnSsfTIS\nHr9Zpt7+l+cLpOdONN3/+GHMwhikSvw3JORfsj6Ndx3RDo9MJpQFq4kbVjZvB86+\nnk9nCaFo0wKBgQDb6HKZIY1OIRb47iHOApjoVOVAQgDIj9xcWjsRUquaLYuVP7pL\n2tX/TpGiQw1MOSYRf03CWtQCfsfo/5+9QC98XX4ReW7TbY4DxAioaj9Jq55+IANk\n93FDkMfE4dNe3aP4lDkgR3e2tzwSeg9qsShiWkkrlTAoaQURJnZTjt0wPQKBgQCl\n9L9+nIbkN94I+ellR8HSGBvjx8EtixAUnaraYCalF7st1MhBluthUC+uDqA6ND+/\ni9L4nmj8v5Ly5xIGVhDP93sSmiCxmpFHfS6BV03ZS7RBgdqbkQP/3gZ34FYLp3Uk\nm581IE3IEAInE9B53liECgPEmV6gv/L9uJZ3LyqXWQKBgAhFLxJy3ijk4nXj8WJQ\ntEyy3SVFVPDeKAnhSkD+x/jFI3iyffOf90ur7msA1BtIV19lmBqaP7GAcNhrqSpw\nfvbHdbHEZKhzpULMbPb3Y+QS4ckQPNOAxMy9+vFNs5AGCeb0+bTTA4DvNo80aMj8\ndmJC9opEer5lqw9ICaJB8Tgj\n-----END PRIVATE KEY-----\n`,
};
// --- INICIALIZACIÓN DE FIREBASE ADMIN (SIN CAMBIOS) ---
function initializeAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
  return admin;
}

export function getDb() {
  return initializeAdmin().firestore();
}

// ✅ --- NUEVA FUNCIÓN PARA LEER UN ESTUDIANTE POR ID ---
// La usaremos en la configuración de NextAuth para mantener la sesión sincronizada.
export async function getStudentById(id: string) {
  const db = getDb();
  const studentSnap = await db.collection("Estudiantes").doc(id).get();
  if (!studentSnap.exists) {
    return null;
  }
  return studentSnap.data();
}


// --- TIPADO PARA EL OBJETO DE USUARIO (SIN CAMBIOS) ---
export interface StudentData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  rol: string;
  grupo: string | null;
}

// --- FUNCIÓN AUXILIAR PARA ASEGURAR SUBCOLECCIONES ---
async function ensureSubcollectionsExist(studentRef: admin.firestore.DocumentReference) {
  console.log(`Verificando subcolecciones para ${studentRef.id}...`);
  const subcollections = ["Prestamos", "Adeudos", "Pagados", "Completados", "Formularios", "Notificaciones"];
  
  // ✅ CORRECCIÓN DEFINITIVA: Un placeholder simple y limpio.
  const placeholder = {
    info: "Colección inicializada.",
  };

  for (const subcollectionName of subcollections) {
    const subcollectionRef = studentRef.collection(subcollectionName);
    const snapshot = await subcollectionRef.limit(1).get();
    
    // Si la subcolección está vacía, crea el documento placeholder.
    if (snapshot.empty) {
      console.log(`Inicializando subcolección faltante: '${subcollectionName}' para ${studentRef.id}`);
      await subcollectionRef.doc("_placeholder").set(placeholder);
    }
  }
}

// --- FUNCIÓN PRINCIPAL (LÓGICA INTERNA SIN CAMBIOS) ---
export const createOrUpdateStudentServer = async (user: StudentData) => {
  const db = getDb();

  if (!user.id) {
    throw new Error("Se requiere un ID de usuario para crear o actualizar el estudiante.");
  }

  const studentRef = db.collection("Estudiantes").doc(user.id);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) {
    console.log(`Creando nuevo estudiante con id: ${user.id}`);
    await studentRef.set({
      uid: user.id,
      nombre: user.name ?? "",
      correo: user.email ?? "",
      rol: user.rol,
      grupo: user.grupo, // Será null si no se pudo extraer del email
      carrera: "turismo",
      fotoPerfil: user.image ?? "",
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
      prestamos: [],
      adeudos: [],
      pagos: [],
      completados: [],
    });
  } else {
    console.log(`Actualizando datos para el estudiante existente: ${user.id}`);
    await studentRef.update({
      nombre: user.name ?? "",
      fotoPerfil: user.image ?? "",
      lastLogin: FieldValue.serverTimestamp(),
    });
  }
  
  // La verificación de subcolecciones se ejecuta siempre.
  await ensureSubcollectionsExist(studentRef);
};
