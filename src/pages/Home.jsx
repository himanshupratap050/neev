import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
    { name: 'Fabrication', hint: 'Gate, grill, railing, shed' },
    { name: 'Cement', hint: 'Sabhi brands' },
    { name: 'TMT / Steel', hint: 'Sariya, structural steel' },
    { name: 'Sand', hint: 'Balu / reta' },
    { name: 'Gitti / Aggregate', hint: 'Rodi, gitti' },
]

const STEPS = [
    { n: '1', t: 'Requirement daalein', d: 'Kya chahiye, kitna chahiye, photo ke saath' },
    { n: '2', t: 'Quotes paayein', d: 'Paas ke verified providers apna rate bhejenge' },
    { n: '3', t: 'Compare karke chunein', d: 'Sabse achha rate accept karein, WhatsApp pe baat karein' },
]

export default function Home() {
    const { user, profile, loading } = useAuth()
    if (loading) return <p className="p-6">Loading...</p>

    const cta =
        !user ? { to: '/signup', label: 'Shuru karein / Get started' }
            : profile?.role === 'provider' ? { to: '/leads', label: 'Naye leads dekhein' }
                : profile?.role === 'admin' ? { to: '/admin', label: 'Admin panel' }
                    : { to: '/post', label: 'Requirement daalein / Post' }

    return (
        <div className="bg-slate-50">
            <section className="bg-slate-brand px-4 py-12 text-center text-white">
                <h1 className="text-4xl font-bold text-amber-brand">NEEV (नींव)</h1>
                <p className="mt-2 text-lg font-semibold">Har Nirman Ki Shuruat</p>
                <p className="mx-auto mt-3 max-w-md text-slate-300">
                    Ghar ya dukaan banana hai? Paas ke verified hardware dukaan aur fabricators se rate mangwayein, compare karein, aur chunein.
                </p>
                <Link to={cta.to} className="mt-6 inline-block rounded-xl bg-amber-brand px-6 py-4 text-lg font-bold text-white">
                    {cta.label}
                </Link>
                {!user && (
                    <p className="mt-3 text-sm text-slate-300">
                        Pehle se account hai? <Link to="/login" className="font-semibold text-white underline">Login</Link>
                    </p>
                )}
            </section>

            <section className="mx-auto max-w-md px-4 py-8">
                <h2 className="mb-4 text-xl font-bold text-slate-brand">Kaise kaam karta hai / How it works</h2>
                <div className="space-y-3">
                    {STEPS.map((s) => (
                        <div key={s.n} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-brand font-bold text-white">{s.n}</div>
                            <div>
                                <p className="font-semibold text-slate-brand">{s.t}</p>
                                <p className="text-sm text-slate-500">{s.d}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-md px-4 pb-8">
                <h2 className="mb-4 text-xl font-bold text-slate-brand">Categories</h2>
                <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map((c) => (
                        <div key={c.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="font-semibold text-slate-brand">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.hint}</p>
                        </div>
                    ))}
                </div>
            </section>

            {!user && (
                <section className="mx-auto max-w-md px-4 pb-12">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
                        <p className="font-semibold text-slate-brand">Dukaan ya fabrication ka kaam hai?</p>
                        <p className="mt-1 text-sm text-slate-500">Provider ban kar naye customers se jude. Abhi free.</p>
                        <Link to="/signup" className="mt-3 inline-block rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-brand">
                            Provider ke roop mein judein
                        </Link>
                    </div>
                </section>
            )}
        </div>
    )
}