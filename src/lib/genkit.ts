// lib/gemini-direct.ts
// ALTERNATIVA: Usar directamente Google Gemini API sin Genkit

export async function generateStatisticalAnalysis(data: {
    prestamos: any[];
    adeudos: any[];
    completados: any[];
    pagados: any[];
  }) {
    const prompt = `
    Eres un analista de datos experto en gestión de inventarios educativos.
    
    Analiza los siguientes datos y genera un reporte estadístico detallado en español:
    
    **PRÉSTAMOS:**
    ${JSON.stringify(data.prestamos.slice(0, 20), null, 2)}
    
    **ADEUDOS:**
    ${JSON.stringify(data.adeudos.slice(0, 20), null, 2)}
    
    **COMPLETADOS:**
    ${JSON.stringify(data.completados.slice(0, 20), null, 2)}
    
    **PAGADOS:**
    ${JSON.stringify(data.pagados.slice(0, 20), null, 2)}
    
    Genera un análisis que incluya:
    1. **Insights principales**: 3-5 hallazgos clave sobre el comportamiento
    2. **Predicciones**: Qué materiales podrían tener problemas próximamente
    3. **Recomendaciones**: Acciones específicas para mejorar la gestión
    4. **Alertas**: Estudiantes o materiales que requieren atención inmediata
    5. **Tendencias**: Patrones temporales observados
    
    IMPORTANTE: Responde ÚNICAMENTE con un JSON válido (sin markdown, sin backticks):
    {
      "resumen_ejecutivo": "string",
      "insights": ["string"],
      "predicciones": ["string"],
      "recomendaciones": ["string"],
      "alertas": [{"tipo": "string", "mensaje": "string", "prioridad": "alta|media|baja"}],
      "tendencias": ["string"]
    }
    `;
  
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_GENAI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );
  
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
  
    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
  
    // Limpiar el texto para extraer solo el JSON
    let cleanText = text.trim();
    
    // Remover markdown backticks si existen
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Intentar parsear el JSON
    try {
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Error parsing JSON:', cleanText);
      // Fallback si el JSON no es válido
      return {
        resumen_ejecutivo: cleanText,
        insights: ['Análisis generado correctamente'],
        predicciones: ['Se requiere más datos para predicciones'],
        recomendaciones: ['Mantener el monitoreo constante'],
        alertas: [],
        tendencias: ['Datos en análisis'],
      };
    }
  }