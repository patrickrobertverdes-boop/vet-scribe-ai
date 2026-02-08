import { ShieldCheck, Lock, Database, EyeOff } from 'lucide-react';

export const metadata = {
    title: 'Veterinary Data Protection & Security - VetScribe',
};

export default function SecurityPage() {
    return (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-xl">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black font-serif tracking-tight mb-0">Data Protection & Security</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Veterinary Clinical Safeguards</p>
                </div>
            </div>

            <section className="mt-12 space-y-12">
                <p className="lead text-lg text-zinc-600 dark:text-zinc-400 font-medium">
                    VetScribe is designed for use by veterinary clinics and animal healthcare professionals and is built with strong data protection practices.
                </p>

                <div className="grid gap-6 sm:grid-cols-2 mt-8">
                    {[
                        { title: 'Encryption', desc: 'Administrative, technical, and physical safeguards protect all clinical information.', icon: Lock },
                        { title: 'Access Control', desc: 'Strict identity verification ensures only authorized personnel access records.', icon: EyeOff },
                        { title: 'Data Ownership', desc: 'Clinics remain the sole data owners and are responsible for their entries.', icon: Database },
                        { title: 'Monitoring', desc: 'Continuous system monitoring prevents unauthorized egress of clinical data.', icon: ShieldCheck }
                    ].map((feature, i) => (
                        <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl space-y-3">
                            <feature.icon className="h-5 w-5 text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-widest leading-none">{feature.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-medium">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold font-serif tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 uppercase text-[12px] tracking-[0.1em]">Clinical Responsibility</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                            VetScribe processes data only on behalf of veterinary clinics. Clinics remain the data owners and are responsible for the accuracy and appropriate use of information entered into the application.
                        </p>
                    </div>

                    <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-2xl">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                            VetScribe does not function as a legal medical record system and does not provide diagnoses or treatment decisions.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold font-serif tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 uppercase text-[12px] tracking-[0.1em]">Infrastructure Standards</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                            Our infrastructure is architected to minimize downtime and maximize clinical continuity. We use industry-standard cloud providers with documented security certifications.
                        </p>
                    </div>
                </div>

                <div className="pt-8 mt-12 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest">Security Inquiries</h3>
                        <p className="text-sm text-zinc-500">For questions regarding data protection or security practices.</p>
                    </div>
                    <a href="mailto:support@vetscribe.app" className="h-10 px-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded font-bold text-[10px] uppercase tracking-widest flex items-center transition-opacity hover:opacity-90">
                        Contact Support
                    </a>
                </div>
            </section>
        </article>
    );
}
