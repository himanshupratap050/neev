import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'

const CATEGORIES = [
    { name: 'Fabrication', hint: 'Gates, grills, railings, sheds' },
    { name: 'Cement', hint: 'All major brands' },
    { name: 'TMT / Steel', hint: 'Rebar and structural steel' },
    { name: 'Sand', hint: 'Construction and plaster sand' },
    { name: 'Gitti / Aggregate', hint: 'Crushed stone and aggregate' },
]

const STEPS = [
    { n: '1', t: 'Post your requirement', d: 'Describe what you need, the quantity, and add a photo.' },
    { n: '2', t: 'Receive quotes', d: 'Verified providers near you send their best price.' },
    { n: '3', t: 'Compare and choose', d: 'Accept the best quote and connect with the provider on WhatsApp.' },
]

export default function Home() {
    const { user, profile, loading } = useAuth()
    if (loading) return <Spinner />

    const cta =
        !user ? { to: '/signup', label: 'Get started' }
            : profile?.role === 'provider' ? { to: '/leads', label: 'View new leads' }
                : profile?.role === 'admin' ? { to: '/admin', label: 'Open admin panel' }
                    : { to: '/post', label: 'Post a requirement' }

    return (
        <div>
            <section className="bg-slate-brand px-4 py-12 text-center text-white md:py-20">
                <h1 className="text-4xl font-bold text-amber-brand md:text-6xl">NEEV (नींव)</h1>
                <p className="mt-2 text-lg font-semibold md:text-2xl">The Solid Foundation for Every Build</p>
                <p className="mx-auto mt-3 max-w-xl text-slate-300 md:text-lg">
                    Building a home or a shop? Get quotes from verified local hardware stores and fabricators, compare them, and choose with confidence.
                </p>
                <Link to={cta.to} className="mt-6 inline-block rounded-xl bg-amber-brand px-6 py-4 text-lg font-bold text-white">
                    {cta.label}
                </Link>
                {!user && (
                    <p className="mt-3 text-sm text-slate-300">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-white underline">Log in</Link>
                    </p>
                )}
            </section>

            <section className="mx-auto max-w-6xl px-4 py-10">
                <h2 className="mb-4 text-xl font-bold md:text-2xl">How it works</h2>
                <div className="grid gap-3 md:grid-cols-3">
                    {STEPS.map((s) => (
                        <div key={s.n} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-brand font-bold text-white">{s.n}</div>
                            <div>
                                <p className="font-semibold">{s.t}</p>
                                <p className="text-sm text-muted">{s.d}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-10">
                <h2 className="mb-4 text-xl font-bold md:text-2xl">Categories</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {CATEGORIES.map((c) => (
                        <div key={c.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-xs text-muted">{c.hint}</p>
                        </div>
                    ))}
                </div>
            </section>

            {!user && (
                <section className="mx-auto max-w-6xl px-4 pb-12">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
                        <p className="font-semibold">Run a hardware store or fabrication workshop?</p>
                        <p className="mt-1 text-sm text-muted">Join as a provider and reach new customers nearby. Free during the pilot.</p>
                        <Link to="/signup" className="mt-3 inline-block rounded-xl border border-slate-300 px-5 py-3 font-semibold">
                            Join as a provider
                        </Link>
                    </div>
                </section>
            )}
        </div>
    )
}