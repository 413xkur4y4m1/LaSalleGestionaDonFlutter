
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// --- JSON de servicio hardcodeado (SIN CAMBIOS) ---
const serviceAccount = {
  type: "service_account",
  project_id: "bdsql-9416f",
  clientEmail: "firebase-adminsdk-fbsvc@bdsql-9416f.iam.gserviceaccount.com",
  private_key_id: "801f194a0f09d4eea7daf1e8f7c3b8c10f3410a7",
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/r88klYA4rKeB
w3iFmQ7FScjpO5BciLSuiIqr8DbV5Z85pR1hrDQH4QwVxqSkcBrTNPdK3s1J9Fvo
wfjX+UxKrfl84Zz/oGmbsaLdugrcQvM3pIzvfkrhcw2IMXiMs4GTglMOpkaGEpMi
hfy5CAwH71/i38e9HxLauiYNhEUwPM1K/ciaKkpAMOzIzHchZwd39085++Yd5RYz
7ClPLS9bz+pW0pqh76TnvaSxAoGnmIpy4uGtbFmzqVy/Zyup54kGiV38iQkyYA/p
PPcKJU11nXUJVC85TRo5m/tjcHuKg3shpUjvVvuvLT9weTl9ggyuTOpzrTCkuZOO
u1A7TcFXAgMBAAECggEAHcnL9oL3HJeUJmHCknxhI76eJsSXYBHshiz449ReKSpY
bqRepwWURl8uOhoXDujO+mCCR5PNMj9zov211pZKyVY07be/5qe+ka/uv+c/9c+/
rTd4oWUubM+s3CvX8IGa0toPXzjuv7oWPGi3B+gcuoT0ETU2fIjeLLh93l7eQ6sC
TfT9fMx6LpQ0GXftFTU8pRT2MoRdSJcfDpBwE1OCgPJUx3tQ7BbQnD33QACLKzbJ
y/uY3ohvZaGbu/eDILGl3Zyxl3KPdg9yBINgDMWigicmQb3n2etz8TNhtfUk77o9
MTsNp6vz0N09VkL1OtMKV2MHsMhyjH42XkQqFezZjQKBgQDn7Qsb5zF0ivPZ5+lG
yjJlQrEG1NnPFfUd4eID54Q7eedqyG+sksAChghy4CHxaxEvjxXP7Qr1qsHx0XWG
dh0g14SSFMn/tpO6c7kcVavZ9ne/03Ku3/qTDkFiyr8D4XoLwiEyxODxTx8SzG8J
SLImEYXou85fdRuGMBc+Q++y7QKBgQDTlX3a97hy5WCZbazEgLj9/2Rwcz7gP2pa
yXl/AkvDrBh9f+5DMrkGIiYejMAolKhO8X2KwQn0xH7d7QUvtdnm5saURnSsfTIS
Hr9Zpt7+l+cLpOdONN3/+GHMwhikSvw3JORfsj6Ndx3RDo9MJpQFq4kbVjZvB86+
nk9nCaFo0wKBgQDb6HKZIY1OIRb47iHOApjoVOVAQgDIj9xcWjsRUquaLYuVP7pL
2tX/TpGiQw1MOSYRf03CWtQCfsfo/5+9QC98XX4ReW7TbY4DxAioaj9Jq55+IANk
93FDkMfE4dNe3aP4lDkgR3e2tzwSeg9qsShiWkkrlTAoaQURJnZTjt0wPQKBgQCl
9L9+nIbkN94I+ellR8HSGBvjx8EtixAUnaraYCalF7st1MZBluthUC+uDqA6ND+/
i9L4nmj8v5Ly5xIGVhDP93sSmiCxmpFHfS6BV03ZS7RBgdqbkQP/3gZ34FYLp3Uk
m581IE3IEAInE9B53liECgPEmV6gv/L9uJZ3LyqXWQKBgAhFLxJy3ijk4nXj8WJQ
tEyy3SVFVPDeKAnhSkD+x/jFI3iyffOf90ur7msA1BtIV19lmBqaP7GAcNhrqSpw
fvbHdbHEZKhzpULMbPb3Y+QS4ckQPNOAxMy9+vFNs5AGCeb0+bTTA4DvNo80aMj8
dmJC9opEer5lqw9ICaJB8Tgj
-----END PRIVATE KEY-----\n`,
};
// --
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

// --- TIPADO PARA EL OBJETO DE USUARIO (SIN CAMBIOS) ---
export interface StudentData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  rol: string;
  grupo: string | null;
}

// ✅ --- NUEVA FUNCIÓN AUXILIAR ---
/**
 * Se asegura de que todas las subcolecciones requeridas existan para un estudiante.
 * Si una subcolección no existe o está vacía, crea un documento placeholder.
 */
async function ensureSubcollectionsExist(studentRef: admin.firestore.DocumentReference) {
  console.log(`Verificando subcolecciones para ${studentRef.id}...`);
  const subcollections = ["Prestamos", "Adeudos", "Pagados", "Completados", "Formularios", "Notificaciones"];
  const placeholder = {
    initializedAt: FieldValue.serverTimestamp(),
    _info: "Documento placeholder para inicializar la colección.",
  };

  for (const subcollectionName of subcollections) {
    const subcollectionRef = studentRef.collection(subcollectionName);
    const snapshot = await subcollectionRef.limit(1).get();
    
    // Si la subcolección está vacía (no tiene ni un solo documento), la inicializamos.
    if (snapshot.empty) {
      console.log(`Inicializando subcolección faltante: '${subcollectionName}' para ${studentRef.id}`);
      await subcollectionRef.doc("_placeholder").set(placeholder);
    }
  }
}

// --- FUNCIÓN PRINCIPAL MODIFICADA ---
export const createOrUpdateStudentServer = async (user: StudentData) => {
  const db = getDb();

  if (!user.id) {
    throw new Error("Se requiere un ID de usuario para crear o actualizar el estudiante.");
  }

  const studentRef = db.collection("Estudiantes").doc(user.id);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) {
    // --- CREAR NUEVO ESTUDIANTE (Lógica sin cambios) ---
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
    // --- ACTUALIZAR ESTUDIANTE EXISTENTE (Lógica sin cambios) ---
    console.log(`Actualizando datos para el estudiante existente: ${user.id}`);
    await studentRef.update({
      nombre: user.name ?? "",
      fotoPerfil: user.image ?? "",
      lastLogin: FieldValue.serverTimestamp(),
    });
  }
  
  // ✅ --- LLAMADA A LA FUNCIÓN DE VERIFICACIÓN ---
  // Se ejecuta SIEMPRE, garantizando que las subcolecciones existan
  // tanto para usuarios nuevos como para los ya existentes.
  await ensureSubcollectionsExist(studentRef);
};
