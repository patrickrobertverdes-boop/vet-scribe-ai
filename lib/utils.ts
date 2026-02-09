import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * html2canvas fails when it encounters modern CSS color functions like lab(), oklch(), etc.
 * We have safely overridden these colors in globals.css, so this runtime stripper is no longer
 * needed and is effectively disabled to prevent layout breakage.
 */
export function fixHtml2CanvasCSS() {
    // Disabled to prevent destructive CSS removal from the live session.
    // relying on globals.css overrides instead.
    return;
}
