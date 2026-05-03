import i18n from '../i18n';

export function getLocalizedString(entity: any, fieldName: 'name' | 'displayName' | 'description' | 'category' | 'inputPlaceholder') {
  if (!entity) return '';

  const currentLang = i18n.language || 'pt';

  if (currentLang.startsWith('en')) {
    const enValue = entity[`${fieldName}En`];
    if (enValue !== undefined && enValue !== null && enValue !== '') {
      return enValue;
    }
  }

  if (currentLang.startsWith('es')) {
    const esValue = entity[`${fieldName}Es`];
    if (esValue !== undefined && esValue !== null && esValue !== '') {
      return esValue;
    }
  }

  // Fallback to portuguese (base schema field)
  return entity[fieldName] || '';
}
