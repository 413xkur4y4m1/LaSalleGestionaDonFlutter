// hooks/useAdeudosFiltrados.ts
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-config.ts";

export interface Adeudo {
  id: string;
  codigo: string;
  nombreMaterial: string;
  cantidad: number;
  precio_unitario: number;
  precio_ajustado: number;
  moneda: string;
  estado: "pendiente" | "pagado" | "devuelto";
  tipo: "rotura" | "perdida" | "vencimiento";
  fechaVencimiento: Timestamp;
  grupo: string;
  prestamoOriginal?: string;
}

interface FiltrosAdeudos {
  estado?: string;
  tipo?: string;
  desde?: Date;
  hasta?: Date;
  orden?: "asc" | "desc";
}

export function useAdeudosFiltrados(uid: string, filtros: FiltrosAdeudos = {}) {
  const [adeudos, setAdeudos] = useState<Adeudo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!uid) return;

    let ref = collection(db, "Estudiantes", uid, "Adeudos");

    const criterios: any[] = [];

    if (filtros.estado) {
      criterios.push(where("estado", "==", filtros.estado));
    }

    if (filtros.tipo) {
      criterios.push(where("tipo", "==", filtros.tipo));
    }

    if (filtros.desde) {
      criterios.push(where("fechaVencimiento", ">=", Timestamp.fromDate(filtros.desde)));
    }

    if (filtros.hasta) {
      criterios.push(where("fechaVencimiento", "<=", Timestamp.fromDate(filtros.hasta)));
    }

    const orden = filtros.orden || "desc";
    criterios.push(orderBy("fechaVencimiento", orden));

    const q = query(ref, ...criterios);

    const unsub = onSnapshot(q, (snapshot) => {
      const docs: Adeudo[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Adeudo[];

      setAdeudos(docs);
      setCargando(false);
    });

    return () => unsub();
  }, [uid, filtros]);

  return { adeudos, cargando };
}
