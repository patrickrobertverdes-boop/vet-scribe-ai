import { FileText, Gavel, Scale, AlertTriangle } from 'lucide-react';

export const metadata = {
    title: 'Terms of Service (Veterinary) - VetScribe',
};

export default function TermsPage() {
    return (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black font-serif tracking-tight mb-0">Terms of Service</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Clinical Agreement</p>
                </div>
            </div>

            <section className="mt-12 space-y-10">
                <p className="lead text-lg text-zinc-600 dark:text-zinc-400 font-medium">
                    By using VetScribe, you agree to these Terms of Service. Please read them carefully to understand your clinical obligations.
                </p>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Scale className="h-4 w-4 text-primary" />
                            <h2 className="text-base font-bold uppercase tracking-widest m-0">1. Scope of Service</h2>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                            VetScribe is a veterinary clinical productivity tool intended to assist licensed veterinary professionals. It does not replace professional judgment or establish a veterinarian-client-patient relationship.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Gavel className="h-4 w-4 text-primary" />
                            <h2 className="text-base font-bold uppercase tracking-widest m-0">2. Professional Responsibility</h2>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm font-semibold">
                            Users are responsible for ensuring that information entered into the application complies with applicable laws and professional standards.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-primary" />
                            <h2 className="text-base font-bold uppercase tracking-widest m-0">3. Disclaimer of Warranties</h2>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                            VetScribe is provided <span className="text-black dark:text-white font-black italic">"as is"</span> without warranties of any kind. To the maximum extent permitted by law, VetScribe disclaims liability for clinical decisions or outcomes.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
                            <h2 className="text-base font-bold uppercase tracking-widest m-0">4. Termination</h2>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                            VetScribe reserves the right to suspend or terminate access for misuse or violation of these terms. We maintain strict adherence to our professional code of conduct.
                        </p>
                    </div>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-900/80 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 mt-12">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-3">Governance</h3>
                    <p className="text-sm text-zinc-500 mb-6">
                        These terms are governed by applicable law. For questions, contact support@vetscribe.app.
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Version 2.1</span>
                    </div>
                </div>
            </section>
        </article>
    );
}
