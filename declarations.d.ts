declare module 'react' {
    export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((curr: T) => T)) => void];
    export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    export function useMemo<T>(factory: () => T, deps: any[]): T;
    export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    export function useRef<T>(initialValue: T): { current: T };
    export const Fragment: any;
    export default any;
}

declare module 'react-dom';
declare module 'lucide-react';
declare module 'react-hot-toast';
declare module 'next/navigation' {
    export function useRouter(): any;
    export function usePathname(): string;
}
declare module 'next/link';
declare module 'next/image';
declare module 'framer-motion';
declare module 'clsx';
declare module 'tailwind-merge';

declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}

declare var process: {
    env: {
        [key: string]: string | undefined;
    };
    cwd(): string;
};
