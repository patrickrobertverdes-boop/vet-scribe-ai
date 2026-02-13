declare module 'react' {
    export type Dispatch<A> = (value: A) => void;
    export type SetStateAction<S> = S | ((prevState: S) => S);
    export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
    export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    export function useMemo<T>(factory: () => T, deps: any[] | undefined): T;
    export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    export function useRef<T>(initialValue: T): { current: T };
    export function useContext<T>(context: any): T;
    export const Fragment: any;
    export const createContext: any;
    export const memo: any;
    export default any;
}

declare module 'react/jsx-runtime' {
    export const jsx: any;
    export const jsxs: any;
    export const Fragment: any;
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
declare module 'recharts';
declare module 'firebase/app';
declare module 'firebase/auth';
declare module 'firebase/firestore';
declare module 'firebase-admin';

declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}

declare var process: {
    env: { [key: string]: string | undefined };
    cwd(): string;
};

declare var window: any;
declare var document: any;
declare var navigator: any;
declare var console: any;
