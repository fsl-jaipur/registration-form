import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseOptionalNumber, toNumberInputValue } from "@shared/utils/number";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export { parseOptionalNumber, toNumberInputValue };
