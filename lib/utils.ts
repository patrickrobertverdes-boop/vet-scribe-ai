import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * html2canvas fails when it encounters modern CSS color functions like lab(), oklch(), etc.
 * This helper aggressively scans the document's stylesheets and removes rules containing these functions
 * specifically for the duration of the PDF generation to prevent Android crashing.
 */
export function fixHtml2CanvasCSS() {
    if (typeof window === 'undefined') return;

    const problematicFunctions = ['lab(', 'oklch(', 'oklab(', 'lch(', 'color-mix('];

    // Scan all stylesheets
    const sheets = document.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
        try {
            const sheet = sheets[i];
            const rules = sheet.cssRules || (sheet as any).rules;
            if (!rules) continue;

            // We iterate backward to safely delete rules
            for (let j = rules.length - 1; j >= 0; j--) {
                const rule = rules[j];

                // Deep scan: check regular rules and nested rules (like @media, @supports)
                const shouldDelete = (r: CSSRule): boolean => {
                    const text = r.cssText.toLowerCase();
                    if (problematicFunctions.some(fn => text.includes(fn))) return true;

                    if ('cssRules' in r) {
                        const subRules = (r as any).cssRules as CSSRuleList;
                        for (let k = 0; k < subRules.length; k++) {
                            if (shouldDelete(subRules[k])) return true;
                        }
                    }
                    return false;
                };

                if (shouldDelete(rule)) {
                    try {
                        sheet.deleteRule(j);
                    } catch (err) {
                        // Fallback: if we can't delete the rule, we try to clear its content
                        try {
                            (rule as any).style.cssText = "";
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        } catch (e) {
            // Ignore cross-origin errors from external stylesheets
            console.debug('Skipping cross-origin stylesheet sterilization');
        }
    }
}
