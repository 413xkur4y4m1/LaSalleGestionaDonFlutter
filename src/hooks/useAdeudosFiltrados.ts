import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-config";

export interface Adeudo {
  id: string;
  codigo: string;
  nombreMaterial: string;
  cantidad: number;
  precio_unitario: number;
  precio_ajustado: number;
  moneda: string;
  estado: string;
  tipo: string;
  fechaVencimiento: Timestamp | null;
  grupo: string;
  prestamoOriginal: string | null;
}

export interface Pagado {
  id: string;
  codigoPago: string;
  nombreMaterial: string;
  precio: number;
  metodo: string;
  estado: string;
  fechaPago: Timestamp;
  adeudoOriginal?: string;
  grupo: string;
  transaccionId?: string;
}

export interface Completado {
  id: string;
  codigo: string;
  nombreMaterial: string;
  cantidad: number;
  estado: string;
  tipo: string;
  fechaCumplido: Timestamp;
  fechaInicio?: Timestamp;
  fechaDevolucion?: Timestamp;
  grupo: string;
}

export interface AllTransactions {
  adeudos: Adeudo[];
  pagados: Pagado[];
  completados: Completado[];
}

export function useAdeudosFiltrados(studentUid: string | null) {
  const [adeudos, setAdeudos] = useState<Adeudo[]>([]);
  const [pagados, setPagados] = useState<Pagado[]>([]);
  const [completados, setCompletados] = useState<Completado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentUid) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Adeudos
        const adeudosRef = collection(db, `Estudiantes/${studentUid}/Adeudos`);
        const qAdeudos = query(adeudosRef, orderBy("fechaVencimiento", "desc"));
        const snapshotAdeudos = await getDocs(qAdeudos);
        const adeudosData = snapshotAdeudos.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Adeudo[];

        // Fetch Pagados
        const pagadosRef = collection(db, `Estudiantes/${studentUid}/Pagados`);
        const qPagados = query(pagadosRef, orderBy("fechaPago", "desc"));
        const snapshotPagados = await getDocs(qPagados);
        const pagadosData = snapshotPagados.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pagado[];

        // Fetch Completados
        const completadosRef = collection(db, `Estudiantes/${studentUid}/Completados`);
        const qCompletados = query(completadosRef, orderBy("fechaCumplido", "desc"));
        const snapshotCompletados = await getDocs(qCompletados);
        const completadosData = snapshotCompletados.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Completado[];

        setAdeudos(adeudosData);
        setPagados(pagadosData);
        setCompletados(completadosData);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentUid]);

  return { adeudos, pagados, completados, loading, error };
}