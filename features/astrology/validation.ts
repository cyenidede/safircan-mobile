import type { BirthChartFormErrors, BirthChartFormValues } from './types';

export function validateBirthChart(values: BirthChartFormValues): BirthChartFormErrors {
  const errors: BirthChartFormErrors = {};
  if (!values.firstName.trim()) errors.firstName = 'Adını yazmalısın.';
  if (!values.lastName.trim()) errors.lastName = 'Soyadını yazmalısın.';
  if (!values.birthDate) errors.birthDate = 'Doğum tarihini seçmelisin.';
  if (!values.unknownBirthTime && !values.birthTime) errors.birthTime = 'Doğum saatini seçmelisin.';
  if (!values.birthPlace.trim()) errors.birthPlace = 'Doğum yerini yazmalısın.';
  return errors;
}
