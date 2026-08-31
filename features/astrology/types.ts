export type BirthChartFormValues = {
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  birthTime: Date | null;
  birthPlace: string;
  unknownBirthTime: boolean;
};

export type BirthChartFormErrors = Partial<Record<keyof BirthChartFormValues, string>>;
