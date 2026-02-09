import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * html2canvas fails when it encounters modern CSS color functions like lab(), oklch(), etc.
 * This helper scans the document's stylesheets and removes rules containing these functions
 * specifically for the duration of the PDF generation.
 */
export function fixHtml2CanvasCSS() {
    if (typeof window === 'undefined') return;

    // We scan all stylesheets and remove rules that html2canvas cannot parse
    const sheets = document.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
        try {
            const sheet = sheets[i];
            const rules = sheet.cssRules;
            if (!rules) continue;

            for (let j = rules.length - 1; j >= 0; j--) {
                const rule = rules[j];
                const cssText = rule.cssText.toLowerCase();

                if (
                    cssText.includes('lab(') ||
                    cssText.includes('oklch(') ||
                    cssText.includes('oklab(') ||
                    cssText.includes('lch(') ||
                    cssText.includes('color-mix(') // html2canvas also chokes on color-mix
                ) {
                    try {
                        sheet.deleteRule(j);
                    } catch (err) {
                        console.warn('Could not delete problematic CSS rule:', err);
                    }
                }
            }
        } catch (e) {
            // Ignore cross-origin errors from external stylesheets
            console.debug('Skipping cross-origin stylesheet sterilization');
        }
    }
}
