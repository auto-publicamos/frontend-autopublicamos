import { Injectable, inject } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private session = inject(SessionService);

  async generatePattern(text: string, mode: 'single' | 'double' = 'double'): Promise<number[]> {
    const apiKey = this.session.getGeminiApiKey();

    if (!apiKey) {
      throw new Error('API Key de Gemini no encontrada. Por favor configúrala primero.');
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const model = 'gemini-2.0-flash';
    let promptText = '';

    if (mode === 'double') {
      promptText = `
              Analiza el siguiente guion de diapositivas y extrae el patrón de personajes como un array JSON de números.

              Reglas:
              1. Identifica las diapositivas numeradas (ej: "1. (HER)", "2. (HIM)").
              2. Asigna el valor 0 para personajes MASCULINOS (ej: (HIM), Él, Hombre, Dash, Nombres de hombre).
              3. Asigna el valor 1 para personajes FEMENINOS (ej: (HER), Ella, Mujer, Iris, Nombres de mujer).
              4. Asigna el valor 2 si es (BOTH), narración neutra, o vacío.
              5. El texto puede tener múltiples versiones ("Scene 1 v.1", "Scene 1 v.2"). Si hay varias, SOLO procesa la primera versión completa que encuentres.
              6. El array final DEBE tener longitud 35. Si el guion tiene menos de 35 slides, completa los elementos restantes con el valor 2 (Vacío).
              7. Tu salida DEBE ser ÚNICAMENTE el array JSON. No escribas texto introductorio ni explicaciones.

              Ejemplo de salida válida:
              [0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]

              Texto a analizar:
              ${text}
            `;
    } else {
      // Prompt for SINGLE mode
      promptText = `
              Analiza el siguiente guion de diapositivas y cuenta cuántas hay para generar un patrón de visibilidad.

              Reglas:
              1. Identifica las diapositivas numeradas (1., 2., 3...).
              2. Para cada diapositiva encontrada, asigna el valor 0 (Mostrar Imagen).
              3. El array final DEBE tener longitud 35.
              4. Completa los espacios restantes (donde no hay slide) con el valor 2 (Vacío).
              5. Si encuentras múltiples versiones, procesa la primera.
              6. Tu salida DEBE ser ÚNICAMENTE el array JSON.

              Ejemplo: Si hay 5 slides.
              Salida: [0, 0, 0, 0, 0, 2, 2, 2, ... hasta 35]

              Texto a analizar:
              ${text}
            `;
    }

    const contents = [
      {
        role: 'user',
        parts: [{ text: promptText }],
      },
    ];

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });

      const responseText = response.text;
      console.log('[AiService] Raw Response:', responseText);

      // Usar Regex para extraer solo el array JSON del texto, ignorando ruido extra
      const jsonMatch =
        typeof responseText === 'string' ? responseText.match(/\[\s*(\d+\s*,\s*)*\d+\s*\]/) : null;

      if (jsonMatch && jsonMatch[0]) {
        try {
          const pattern = JSON.parse(jsonMatch[0]);
          if (Array.isArray(pattern)) {
            // Asegurar longitud 35 rellenando con 2 (Vacío) si hace falta
            if (pattern.length < 35) {
              const filled = [...pattern, ...Array(35 - pattern.length).fill(2)];
              return filled.slice(0, 35);
            }
            return pattern.slice(0, 35);
          }
        } catch (e) {
          console.error('[AiService] Error parsing JSON match', e);
        }
      }

      console.warn('[AiService] No valid JSON array found in response');
      return Array(35).fill(2); // Fallback to empty
    } catch (error) {
      console.error('[AiService] Error generating pattern with Gemini', error);
      throw error;
    }
  }
}
