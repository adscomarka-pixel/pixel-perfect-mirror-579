import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function parseToNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  let str = String(val).trim();
  if (!str || str.toLowerCase() === 'nan' || str === 'undefined' || str === 'null') {
    return 0;
  }
  
  // Remove currency symbols and other characters, keeping only digits, commas, dots and minus sign
  str = str.replace(/[^\d,.-]/g, '');
  
  if (str.includes(',')) {
    // Brazilian format: 3.89,75 or 3.890,75
    // We remove all dots (thousands separator) and then replace comma with dot
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  
  return parseFloat(str) || 0;
}

export function formatBRL(value: any): string {
  const amount = parseToNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}
