import { Shield } from 'lucide-react';

export const metadata = {
    title: 'Privacy Policy (Veterinary Clinics) - VetScribe',
};

export default function PrivacyPage() {
    return (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Shield className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black font-serif tracking-tight mb-0">Privacy Policy</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Veterinary Clinics</p>
                </div>
            </div>

            <section className="mt-12 space-y-8">
                <p className="lead text-lg text-zinc-600 dark:text-zinc-400 font-medium">
                    This Privacy Policy explains how VetScribe collects, uses, and protects information when used by veterinary clinics and animal healthcare professionals.
                </p>

                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl text-sm italic text-zinc-600 dark:text-zinc-400">
                    VetScribe is a clinical productivity tool designed to assist veterinary professionals with documentation, transcription, and workflow support. VetScribe does not diagnose animals and does not replace professional veterinary judgment.
                </div>

                <div>
                    <h2 className="text-xl font-bold font-serif tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 uppercase text-[12px] tracking-[0.1em]">Information We Collect</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        VetScribe may process information provided by authorized users, including:
                    </p>
                    <ul className="grid gap-2 list-none pl-0 mt-4">
                        {[
                            'Account information (such as email address and clinic name)',
                            'Veterinary clinical notes, transcripts, and audio recordings',
                            'Pet-related information entered by clinics',
                            'Usage and diagnostic data necessary to operate the service'
                        ].map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                <span className="text-primary font-bold">0{i + 1}.</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-bold font-serif tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 uppercase text-[12px] tracking-[0.1em]">How Information Is Used</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
                        Information is used solely to:
                    </p>
                    <ul className="space-y-2 mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                        <li>• Provide veterinary documentation and transcription features</li>
                        <li>• Support clinical workflows</li>
                        <li>• Maintain application security and reliability</li>
                    </ul>
                    <p className="mt-4 text-sm font-bold text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 inline-block px-3 py-1 rounded">
                        VetScribe does not sell data and does not use information for advertising.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-bold font-serif tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 uppercase text-[12px] tracking-[0.1em]">Data Security</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                        All data is encrypted in transit and at rest. Access is restricted to authorized users using appropriate technical and organizational safeguards.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-bold font-serif tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 uppercase text-[12px] tracking-[0.1em]">Data Sharing</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                        Information is not shared with third parties except infrastructure providers required to operate the service under contractual protections.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-bold font-serif tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 uppercase text-[12px] tracking-[0.1em]">Data Retention & Deletion</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                        Veterinary clinics control their data. Authorized users may request deletion of data at any time by contacting support.
                    </p>
                </div>

                <div className="pt-8 mt-12 border-t border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Contact Protocol</h3>
                    <p className="text-sm text-zinc-500">
                        For privacy questions or data deletion requests, contact:<br />
                        <span className="text-primary font-black tracking-tight">support@vetscribe.app</span>
                    </p>
                </div>
            </section>
        </article>
    );
}
