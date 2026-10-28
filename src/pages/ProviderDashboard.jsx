/**
 * ProviderDashboard.jsx: PROVIDER HOME
 * ---------------------------------------------------------------
 * Purpose : First page a provider sees. Shows how the shop is doing:
 *           new leads, quotes sent, jobs won, earnings, rating, plus a
 *           "set up your shop" checklist.
 * Route   : /provider (provider role only, see App.jsx)
 * Tables  : providers, quotes (+ requests), reviews, provider_products,
 *           requests (open leads, already filtered by RLS)
 *
 * DEBUG: "New leads" is always 0? Check the provider's category and
 *        pincode on the Shop profile page match the requirements.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, CheckCircle2, Circle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Page, Card, Badge, StatusBadge, Empty, Spinner, timeAgo } from '../components/ui'

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

function Stat({ label, value, hint, to }) {
    const body = (
        <Card className={to ? 'transition hover:border-amber-brand' : ''}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold md:text-3xl">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </Card>
    )
    return to ? <Link to={to}>{body}</Link> : body
}

export default function ProviderDashboard() {
    const { user } = useAuth()
    const [d, setD] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [prov, qs, revs, prods, leads] = await Promise.all([
                supabase.from('providers').select('*').eq('id', user.id).maybeSingle(),
                supabase.from('quotes').select('*, requests(title, status, category)')
                    .eq('provider_id', user.id).order('created_at', { ascending: false }),
                supabase.from('reviews').select('rating').eq('provider_id', user.id),
                supabase.from('provider_products').select('id', { count: 'exact', head: true }).eq('provider_id', user.id),
                supabase.from('requests').select('id, title, quantity, city, created_at')
                    .eq('status', 'open').order('created_at', { ascending: false }),
            ])
            setD({
                provider: prov.data,
                quotes: qs.data ?? [],
                reviews: revs.data ?? [],
                productCount: prods.count ?? 0,
                leads: leads.data ?? [],
            })
            setLoading(false)
        }
        load()
    }, [user.id])

    if (loading) return <Spinner />
    const { provider, quotes, reviews, productCount, leads } = d
    if (!provider) return <Page title="Dashboard"><Empty text="Provider profile not found." /></Page>

    // ---- Numbers ----
    const quotedIds = new Set(quotes.map((q) => q.request_id))
    const newLeads = leads.filter((l) => !quotedIds.has(l.id))
    const won = quotes.filter((q) => q.status === 'accepted')
    const wonValue = won.reduce((s, q) => s + Number(q.price || 0), 0)
    const inProgress = won.filter((q) => q.requests?.status === 'accepted').length
    const waiting = quotes.filter((q) => q.status === 'sent' && q.requests?.status === 'open').length
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '-'

    // ---- Setup checklist ----
    const steps = [
        { done: !!provider.description, text: 'Write a short shop description', to: '/provider/profile' },
        { done: productCount > 0, text: 'Add your products with prices', to: '/provider/products' },
        { done: provider.verified, text: 'Get verified by the NEEV team (we will call you)', to: null },
    ]
    const allDone = steps.every((s) => s.done)

    return (
        <Page size="wide" title={provider.shop_name} subtitle={`${provider.category} · ${provider.city ?? ''} ${provider.pincode ?? ''}`}>
            <div className="flex flex-wrap items-center gap-2">
                <Badge tone={provider.verified ? 'green' : 'amber'}>{provider.verified ? 'Verified' : 'Verification pending'}</Badge>
                <Link to={`/shop/${user.id}`} className="text-sm font-semibold text-blue-brand">View my public shop page</Link>
            </div>

            {!allDone && (
                <Card className="border-amber-200 bg-amber-50">
                    <p className="font-semibold text-amber-800">Set up your shop</p>
                    <ul className="mt-2 space-y-2">
                        {steps.map((s) => (
                            <li key={s.text} className="flex items-center gap-2 text-sm">
                                {s.done
                                    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    : <Circle className="h-5 w-5 text-amber-700" />}
                                {s.to && !s.done
                                    ? <Link to={s.to} className="font-semibold text-blue-brand">{s.text}</Link>
                                    : <span className={s.done ? 'text-muted line-through' : ''}>{s.text}</span>}
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="New leads" value={newLeads.length} hint="Waiting for your quote" to="/leads" />
                <Stat label="Quotes sent" value={quotes.length} hint={`${waiting} waiting for customer`} to="/my-quotes" />
                <Stat label="Jobs won" value={won.length} hint={`${inProgress} in progress`} to="/my-quotes" />
                <Stat label="Won value" value={money(wonValue)} hint="Total of accepted quotes" />
                <Stat label="Products" value={productCount} hint="Listed in your shop" to="/provider/products" />
                <Stat label="Rating" value={avg} hint={`${reviews.length} review${reviews.length === 1 ? '' : 's'}`} />
                <Stat label="Win rate" value={quotes.length ? `${Math.round((won.length / quotes.length) * 100)}%` : '-'} hint="Accepted / sent" />
                <Stat label="Completed" value={won.filter((q) => q.requests?.status === 'completed').length} hint="Finished jobs" />
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-2">
                <Card>
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">New leads for you</h3>
                        <Link to="/leads" className="text-sm font-semibold text-blue-brand">See all</Link>
                    </div>
                    {newLeads.length === 0 && <Empty icon={Inbox} text="No new leads in your category and area right now." />}
                    <ul className="mt-2 divide-y divide-slate-100">
                        {newLeads.slice(0, 5).map((l) => (
                            <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <div className="min-w-0">
                                    <p className="truncate font-medium">{l.title}</p>
                                    <p className="text-xs text-muted">{l.quantity} · {l.city} · {timeAgo(l.created_at)}</p>
                                </div>
                                <Link to="/leads" className="shrink-0 rounded-lg bg-amber-brand px-3 py-1.5 text-xs font-semibold text-white">Quote</Link>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Recent quotes</h3>
                        <Link to="/my-quotes" className="text-sm font-semibold text-blue-brand">See all</Link>
                    </div>
                    {quotes.length === 0 && <p className="mt-3 text-sm text-muted">You have not sent any quote yet.</p>}
                    <ul className="mt-2 divide-y divide-slate-100">
                        {quotes.slice(0, 5).map((q) => (
                            <li key={q.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <div className="min-w-0">
                                    <p className="truncate font-medium">{q.requests?.title ?? 'Requirement'}</p>
                                    <p className="text-xs text-muted">{money(q.price)} · {timeAgo(q.created_at)}</p>
                                </div>
                                <StatusBadge status={q.status === 'accepted' ? q.requests?.status : q.status} />
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </Page>
    )
}