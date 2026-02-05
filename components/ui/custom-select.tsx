'use client';

import * as React from "react"
import { Check, ChevronDown, Activity, Sparkles, Binary } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
    className?: string;
}

export function CustomSelect({ value, onChange, options, placeholder, className }: SelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div className={cn("relative group/select", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-14 bg-white/40 glass border border-slate-100 flex items-center justify-between px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl outline-none relative overflow-hidden group/btn",
                    isOpen
                        ? "bg-white ring-4 ring-primary/5 shadow-2xl border-primary/20"
                        : "text-slate-600 hover:bg-white hover:border-slate-200"
                )}
            >
                <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all duration-500",
                        value ? "bg-primary shadow-[0_0_8px_rgba(7,89,133,0.5)]" : "bg-slate-300"
                    )} />
                    <span className={cn("truncate", !value && "text-slate-400 font-bold normal-case italic")}>
                        {value ? selectedLabel : placeholder}
                    </span>
                </div>

                <div className={cn(
                    "h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center transition-all duration-500 relative z-10 border border-slate-100",
                    isOpen ? "rotate-180 bg-slate-900 text-white shadow-lg" : "text-slate-400 group-hover/btn:text-primary"
                )}>
                    <ChevronDown className="h-4 w-4" />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-3 w-full glass rounded-xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-100 overflow-hidden bg-white/80 backdrop-blur-3xl">
                    <div className="px-4 py-2.5 border-b border-slate-50 mb-2 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em]">Parameter Selector</span>
                        <Binary className="h-3 w-3 text-primary/40" />
                    </div>

                    <div className="relative z-10 max-h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                        {options.map((option) => (
                            <button
                                type="button"
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "relative flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-[9px] font-bold uppercase tracking-widest transition-all group/opt",
                                    option.value === value
                                        ? "bg-slate-900 text-white shadow-xl"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-1 w-1 rounded-full transition-all",
                                        option.value === value ? "bg-primary scale-125 shadow-[0_0_8px_rgba(var(--primary),1)]" : "bg-slate-200 group-hover/opt:bg-primary/40"
                                    )} />
                                    <span className="block truncate">{option.label}</span>
                                </div>
                                {option.value === value && (
                                    <Check className="h-3 w-3 text-primary animate-in zoom-in duration-300" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
