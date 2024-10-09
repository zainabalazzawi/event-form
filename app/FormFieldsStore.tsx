import { create } from "zustand";

export type FormFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
} | null;

export type FormFieldsStore = {
  formFields: FormFields;
  setFormFields: (fields: FormFields) => void;
};

export const useFormStore = create<FormFieldsStore>()((set) => ({
  formFields: null,
  setFormFields: (fields) => set({ formFields: fields }),
}));
