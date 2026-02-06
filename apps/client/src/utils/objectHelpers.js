// src/utils/objectHelpers.js

/**
 * Compara dos objetos y devuelve solo las propiedades que han cambiado
 * @param {Object} original - Objeto original
 * @param {Object} updated - Objeto actualizado
 * @returns {Object} Objeto con solo las propiedades que cambiaron
 */
export function getChangedProperties(original, updated) {
  const changes = {};
  let hasChanges = false;

  for (const key in updated) {
    if (updated.hasOwnProperty(key)) {
      const originalValue = original[key];
      const updatedValue = updated[key];

      // Comparación profunda para valores primitivos y básicos
      if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
        changes[key] = updatedValue;
        hasChanges = true;
      }
    }
  }

  return hasChanges ? changes : null;
}

/**
 * Crea una copia profunda de un objeto
 * @param {Object} obj - Objeto a copiar
 * @returns {Object} Copia del objeto
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Valida si un objeto tiene al menos una propiedad con valor
 * @param {Object} obj - Objeto a validar
 * @returns {boolean} True si tiene al menos una propiedad con valor
 */
export function hasValidData(obj) {
  if (!obj || typeof obj !== 'object') return false;
  
  return Object.values(obj).some(value => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return hasValidData(value);
    return true;
  });
}

/**
 * Limpia un objeto removiendo propiedades vacías, null o undefined
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object} Objeto limpio
 */
export function cleanObject(obj) {
  const cleaned = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedNested = cleanObject(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
  }
  
  return cleaned;
}
