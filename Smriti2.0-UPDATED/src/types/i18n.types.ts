export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // Hindi
  | 'as' // Assamese (অসমীয়া)
  | 'bn' // Bengali (বাংলা)
  | 'kha' // Khasi
  | 'lus' // Mizo
  | 'mni' // Meitei / Manipuri (মৈতৈলোন্)
  | 'nag'; // Nagamese

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: string;
}

export type TranslationDict = Record<string, string>;
