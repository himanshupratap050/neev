/**
 * Admin.jsx: ADMIN PANEL
 * ---------------------------------------------------------------
 * Purpose : One place for the admin to see and manage everything.
 * Route   : /admin (admin role only, see App.jsx)
 * Tabs    : Overview   numbers, deal value, categories, recent activity
 *           Providers  verify / remove verification, ratings, deals won
 *           Users      customers (and admins) with their request count
 *           Requests   all requirements, filter by status, cancel open ones
 *           Quotes     every quote with provider, price and status
 *           Reviews    all ratings, delete abusive reviews
 * Tables  : profiles, providers, requests, quotes, reviews (read all)
 * Actions : providers.update (verify), requests.update (cancel),
 *           reviews.delete. The last two need the admin policies from the
 *           setup SQL ("requests admin update", "reviews admin delete").
 *
 * DEBUG: "Nothing changed" message = the admin policy is missing in
 *        Supabase. Empty tables although data exists = this user's
 *        profiles.role is not 'admin'.
 */
import { useEffect, useMemo, useState } from 'react'
import {
    LayoutDashboard, ShieldCheck, Users, ClipboardList, IndianRupee, Star,
    Search, RefreshCw,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { Page, Grid, Card, Button, Input, Badge, StatusBadge, Facts, Empty, Spinner, timeAgo } from '../components/ui'

// ---------- small helpers ----------
const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const fmtMoney = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const countBy = (rows, key) => rows.reduce((m, r) => ({ ...m, [r[key]]: (m[r[key]] || 0) + 1 }), {})

function RequestBadge({ status }) {
    if (status === 'cancelled') return <Badge tone="gray">Cancelled</Badge>
    return <StatusBadge status={status} />
}

function QuoteBadge({ status }) {
    if (status === 'accepted') return <Badge tone="green">Accepted</Badge>
    if (status === 'rejected') return <Badge tone="gray">Not selected</Badge>
    return <Badge tone="blue">Sent</Badge>
}

function StatCard({ label, value, hint, tone = '' }) {
    return (
        <Card className={tone}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold md:text-3xl">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </Card>
    )
}

function Table({ head, children }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted">
                    <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{children}</tbody>
            </table>
        </div>
    )
}
const Td = ({ children, className = '' }) => <td className={`px-4 py-3 align-top ${className}`}>{children}</td>

function Pills({ items, value, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((t) => (
                <button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${value === t.key ? 'bg-slate-brand text-white' : 'border border-slate-300 bg-white'}`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    )
}

// ---------- the page ----------
export default function Admin() {
    const [tab, setTab] = useState('overview')
    const [data, setData] = useState({ profiles: [], providers: [], requests: [], quotes: [], reviews: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [q, setQ] = useState('')
    const [provFilter, setProvFilter] = useState('pending')
    const [reqFilter, setReqFilter] = useState('all')

    // ---- Load everything (RLS lets an admin read all rows) ----
    async function load() {
        const newest = { ascending: false }
        const res = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', newest),
            supabase.from('providers').select('*').order('created_at', newest),
            supabase.from('requests').select('*').order('created_at', newest),
            supabase.from('quotes').select('*').order('created_at', newest),
            supabase.from('reviews').select('*').order('created_at', newest),
        ])
        const failed = res.find((r) => r.error)
        if (failed) { setError(friendlyError(failed.error)); setLoading(false); return }
        setData({
            profiles: res[0].data ?? [], providers: res[1].data ?? [], requests: res[2].data ?? [],
            quotes: res[3].data ?? [], reviews: res[4].data ?? [],
        })
        setLoading(false)
    }
    useEffect(() => { load() }, [])

    // ---- Lookups (id -> row) ----
    const { profiles, providers, requests, quotes, reviews } = data
    const profileById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles])
    const providerById = useMemo(() => Object.fromEntries(providers.map((p) => [p.id, p])), [providers])
    const requestById = useMemo(() => Object.fromEntries(requests.map((r) => [r.id, r])), [requests])
    const quoteCountByRequest = useMemo(() => countBy(quotes, 'request_id'), [quotes])
    const requestCountByCustomer = useMemo(() => countBy(requests, 'customer_id'), [requests])
    const quoteCountByProvider = useMemo(() => countBy(quotes, 'provider_id'), [quotes])
    const wonByProvider = useMemo(() => countBy(quotes.filter((x) => x.status === 'accepted'), 'provider_id'), [quotes])
    const ratingByProvider = useMemo(() => {
        const m = {}
        reviews.forEach((r) => {
            m[r.provider_id] = m[r.provider_id] || { sum: 0, count: 0 }
            m[r.provider_id].sum += r.rating
            m[r.provider_id].count += 1
        })
        return m
    }, [reviews])
    const acceptedQuoteByRequest = useMemo(
        () => Object.fromEntries(quotes.filter((x) => x.status === 'accepted').map((x) => [x.request_id, x])), [quotes])

    // ---- Search helper ----
    const term = q.trim().toLowerCase()
    const match = (...fields) => !term || fields.filter(Boolean).join(' ').toLowerCase().includes(term)

    function changeTab(key) { setTab(key); setQ(''); setNotice(''); setError('') }

    // ---- Run a write and tell the admin what happened ----
    // RLS silently ignores blocked updates and deletes, so we ask for the
    // changed rows back with .select() and treat "no rows" as a failure.
    async function act(run, okMessage) {
        setError(''); setNotice('')
        const { data: rows, error: err } = await run()
        if (err) { setError(friendlyError(err)); return }
        if (!rows || rows.length === 0) {
            setError('Nothing changed. The database blocked this action. Run the admin policies SQL in Supabase.')
            return
        }
        setNotice(okMessage)
        load()
    }

    const toggleVerify = (p) => act(
        () => supabase.from('providers').update({ verified: !p.verified }).eq('id', p.id).select(),
        p.verified ? 'Verification removed.' : 'Provider verified.')

    const cancelRequest = (r) => {
        if (!window.confirm(`Cancel the requirement "${r.title}"? Providers will no longer see it.`)) return
        act(() => supabase.from('requests').update({ status: 'cancelled' }).eq('id', r.id).select(), 'Requirement cancelled.')
    }

    const deleteReview = (rv) => {
        if (!window.confirm('Delete this review permanently?')) return
        act(() => supabase.from('reviews').delete().eq('id', rv.id).select(), 'Review deleted.')
    }

    if (loading) return <Spinner />

    // ---- Numbers for the overview ----
    const customers = profiles.filter((p) => p.role === 'customer')
    const pendingProviders = providers.filter((p) => !p.verified).length
    const status = countBy(requests, 'status')
    const dealValue = quotes.filter((x) => x.status === 'accepted').reduce((s, x) => s + Number(x.price || 0), 0)
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '-'
    const byCategory = Object.entries(countBy(requests, 'category')).sort((a, b) => b[1] - a[1])
    const maxCategory = byCategory[0]?.[1] || 1

    const tabs = [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard },
        { key: 'providers', label: 'Providers', icon: ShieldCheck, badge: pendingProviders },
        { key: 'users', label: 'Users', icon: Users },
        { key: 'requests', label: 'Requests', icon: ClipboardList },
        { key: 'quotes', label: 'Quotes', icon: IndianRupee },
        { key: 'reviews', label: 'Reviews', icon: Star },
    ]

    const searchBox = (placeholder) => (
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <div className="[&_input]:pl-12">
                <Input placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
        </div>
    )

    return (
        <Page size="wide" title="Admin panel" subtitle="Everything happening on NEEV, in one place.">

            {/* Tab bar + refresh */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {tabs.map(({ key, label, icon: Icon, badge }) => (
                        <button
                            key={key}
                            onClick={() => changeTab(key)}
                            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-slate-brand text-white' : 'border border-slate-300 bg-white'}`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                            {badge > 0 && <span className="rounded-full bg-amber-brand px-2 text-xs text-white">{badge}</span>}
                        </button>
                    ))}
                </div>
                <button
                    onClick={load}
                    aria-label="Refresh data"
                    className="shrink-0 rounded-full border border-slate-300 bg-white p-2.5 hover:bg-slate-50"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {notice && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p>}

            {/* ============ OVERVIEW ============ */}
            {tab === 'overview' && (
                <>
                    {pendingProviders > 0 && (
                        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50">
                            <p className="text-sm font-semibold text-amber-800">
                                {pendingProviders} provider{pendingProviders > 1 ? 's' : ''} waiting for verification
                            </p>
                            <button
                                onClick={() => { changeTab('providers'); setProvFilter('pending') }}
                                className="rounded-lg bg-amber-brand px-4 py-2 text-sm font-semibold text-white"
                            >
                                Review now
                            </button>
                        </Card>
                    )}

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard label="Customers" value={customers.length} />
                        <StatCard label="Providers" value={providers.length} hint={`${providers.length - pendingProviders} verified`} />
                        <StatCard label="Requirements" value={requests.length} hint={`${status.open || 0} open now`} />
                        <StatCard label="Quotes" value={quotes.length} hint={`${quotes.filter((x) => x.status === 'accepted').length} accepted`} />
                        <StatCard label="Open" value={status.open || 0} />
                        <StatCard label="In progress" value={status.accepted || 0} />
                        <StatCard label="Completed" value={status.completed || 0} />
                        <StatCard label="Cancelled" value={status.cancelled || 0} />
                        <StatCard label="Deal value" value={fmtMoney(dealValue)} hint="Total of accepted quotes" />
                        <StatCard label="Reviews" value={reviews.length} />
                        <StatCard label="Average rating" value={avgRating} hint="Out of 5" />
                        <StatCard label="Pending verification" value={pendingProviders} />
                    </div>

                    <div className="grid items-start gap-4 lg:grid-cols-2">
                        <Card>
                            <h3 className="font-semibold">Requirements by category</h3>
                            {byCategory.length === 0 && <p className="mt-3 text-sm text-muted">No requirements yet.</p>}
                            <div className="mt-3 space-y-3">
                                {byCategory.map(([name, n]) => (
                                    <div key={name}>
                                        <div className="flex justify-between text-sm"><span>{name}</span><span className="font-semibold">{n}</span></div>
                                        <div className="mt-1 h-2 rounded-full bg-slate-100">
                                            <div className="h-2 rounded-full bg-amber-brand" style={{ width: `${(n / maxCategory) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card>
                            <h3 className="font-semibold">Latest requirements</h3>
                            {requests.length === 0 && <p className="mt-3 text-sm text-muted">No requirements yet.</p>}
                            <ul className="mt-3 divide-y divide-slate-100">
                                {requests.slice(0, 6).map((r) => (
                                    <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{r.title}</p>
                                            <p className="text-xs text-muted">{profileById[r.customer_id]?.name ?? 'Unknown'} · {timeAgo(r.created_at)}</p>
                                        </div>
                                        <RequestBadge status={r.status} />
                                    </li>
                                ))}
                            </ul>
                        </Card>

                        <Card>
                            <h3 className="font-semibold">Newest sign-ups</h3>
                            {profiles.length === 0 && <p className="mt-3 text-sm text-muted">No users yet.</p>}
                            <ul className="mt-3 divide-y divide-slate-100">
                                {profiles.slice(0, 6).map((p) => (
                                    <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{p.name || 'No name'}</p>
                                            <p className="text-xs text-muted">{p.city} · {timeAgo(p.created_at)}</p>
                                        </div>
                                        <Badge tone={p.role === 'provider' ? 'amber' : p.role === 'admin' ? 'green' : 'blue'}>{p.role}</Badge>
                                    </li>
                                ))}
                            </ul>
                        </Card>

                        <Card>
                            <h3 className="font-semibold">Latest reviews</h3>
                            {reviews.length === 0 && <p className="mt-3 text-sm text-muted">No reviews yet.</p>}
                            <ul className="mt-3 divide-y divide-slate-100">
                                {reviews.slice(0, 5).map((rv) => (
                                    <li key={rv.id} className="py-2 text-sm">
                                        <p className="font-medium">
                                            {providerById[rv.provider_id]?.shop_name ?? 'Provider'} · {rv.rating}/5
                                        </p>
                                        {rv.comment && <p className="text-xs text-muted">{rv.comment}</p>}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </>
            )}

            {/* ============ PROVIDERS ============ */}
            {tab === 'providers' && (
                <>
                    <Pills
                        value={provFilter}
                        onChange={setProvFilter}
                        items={[
                            { key: 'pending', label: `Pending (${pendingProviders})` },
                            { key: 'verified', label: `Verified (${providers.length - pendingProviders})` },
                            { key: 'all', label: `All (${providers.length})` },
                        ]}
                    />
                    {searchBox('Search by shop, owner, phone, city or category')}
                    {(() => {
                        const shown = providers.filter((p) =>
                            (provFilter === 'all' || (provFilter === 'pending' ? !p.verified : p.verified)) &&
                            match(p.shop_name, p.category, p.city, p.pincode, profileById[p.id]?.name, profileById[p.id]?.phone))
                        if (shown.length === 0) return <Empty icon={ShieldCheck} text="No providers in this list." />
                        return (
                            <Grid>
                                {shown.map((p) => {
                                    const rating = ratingByProvider[p.id]
                                    return (
                                        <Card key={p.id}>
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="text-lg font-semibold">{p.shop_name}</h3>
                                                <Badge tone={p.verified ? 'green' : 'amber'}>{p.verified ? 'Verified' : 'Pending'}</Badge>
                                            </div>
                                            <Facts items={[
                                                { label: 'Category', value: p.category },
                                                { label: 'Location', value: `${p.city ?? ''} ${p.pincode ?? ''}` },
                                                { label: 'Owner', value: profileById[p.id]?.name },
                                                { label: 'Phone', value: profileById[p.id]?.phone },
                                                { label: 'Quotes sent', value: String(quoteCountByProvider[p.id] || 0) },
                                                { label: 'Deals won', value: String(wonByProvider[p.id] || 0) },
                                                { label: 'Rating', value: rating ? `${(rating.sum / rating.count).toFixed(1)} (${rating.count})` : 'No reviews' },
                                                { label: 'Joined', value: fmtDate(p.created_at) },
                                            ]} />
                                            <Button variant={p.verified ? 'outline' : 'primary'} className="mt-3" onClick={() => toggleVerify(p)}>
                                                {p.verified ? 'Remove verification' : 'Verify provider'}
                                            </Button>
                                        </Card>
                                    )
                                })}
                            </Grid>
                        )
                    })()}
                </>
            )}

            {/* ============ USERS ============ */}
            {tab === 'users' && (
                <>
                    {searchBox('Search by name, phone or city')}
                    {(() => {
                        const shown = profiles.filter((p) => p.role !== 'provider' && match(p.name, p.phone, p.city))
                        if (shown.length === 0) return <Empty icon={Users} text="No users found." />
                        return (
                            <Table head={['Name', 'Phone', 'City', 'Role', 'Requirements', 'Joined']}>
                                {shown.map((p) => (
                                    <tr key={p.id}>
                                        <Td className="font-medium">{p.name || '-'}</Td>
                                        <Td>{p.phone || '-'}</Td>
                                        <Td>{p.city || '-'}</Td>
                                        <Td><Badge tone={p.role === 'admin' ? 'green' : 'blue'}>{p.role}</Badge></Td>
                                        <Td>{requestCountByCustomer[p.id] || 0}</Td>
                                        <Td>{fmtDate(p.created_at)}</Td>
                                    </tr>
                                ))}
                            </Table>
                        )
                    })()}
                    <p className="text-xs text-muted">Providers are listed in the Providers tab. Email addresses are private to Supabase Auth.</p>
                </>
            )}

            {/* ============ REQUESTS ============ */}
            {tab === 'requests' && (
                <>
                    <Pills
                        value={reqFilter}
                        onChange={setReqFilter}
                        items={[
                            { key: 'all', label: `All (${requests.length})` },
                            { key: 'open', label: `Open (${status.open || 0})` },
                            { key: 'accepted', label: `In progress (${status.accepted || 0})` },
                            { key: 'completed', label: `Completed (${status.completed || 0})` },
                            { key: 'cancelled', label: `Cancelled (${status.cancelled || 0})` },
                        ]}
                    />
                    {searchBox('Search by title, category, city, pincode or customer')}
                    {(() => {
                        const shown = requests.filter((r) =>
                            (reqFilter === 'all' || r.status === reqFilter) &&
                            match(r.title, r.category, r.city, r.pincode, r.details, profileById[r.customer_id]?.name))
                        if (shown.length === 0) return <Empty icon={ClipboardList} text="No requirements in this list." />
                        return (
                            <Grid>
                                {shown.map((r) => {
                                    const customer = profileById[r.customer_id]
                                    const won = acceptedQuoteByRequest[r.id]
                                    return (
                                        <Card key={r.id}>
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
                                                <RequestBadge status={r.status} />
                                            </div>
                                            <Facts items={[
                                                { label: 'Category', value: r.category },
                                                { label: 'Quantity', value: r.quantity },
                                                { label: 'Location', value: `${r.city ?? ''} ${r.pincode ?? ''}` },
                                                { label: 'Posted', value: fmtDate(r.created_at) },
                                                { label: 'Customer', value: customer?.name },
                                                { label: 'Phone', value: customer?.phone },
                                                { label: 'Quotes received', value: String(quoteCountByRequest[r.id] || 0) },
                                                { label: 'Won by', value: won ? `${providerById[won.provider_id]?.shop_name ?? 'Provider'} (${fmtMoney(won.price)})` : '' },
                                            ]} />
                                            {r.details && <p className="mt-3 text-sm text-muted">{r.details}</p>}
                                            {r.photo_url && (
                                                <a href={r.photo_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-brand">
                                                    View photo
                                                </a>
                                            )}
                                            {r.status === 'open' && (
                                                <Button variant="outline" className="mt-3" onClick={() => cancelRequest(r)}>
                                                    Cancel requirement
                                                </Button>
                                            )}
                                        </Card>
                                    )
                                })}
                            </Grid>
                        )
                    })()}
                </>
            )}

            {/* ============ QUOTES ============ */}
            {tab === 'quotes' && (
                <>
                    {searchBox('Search by requirement, provider or status')}
                    {(() => {
                        const shown = quotes.filter((x) =>
                            match(requestById[x.request_id]?.title, providerById[x.provider_id]?.shop_name, x.status, x.message))
                        if (shown.length === 0) return <Empty icon={IndianRupee} text="No quotes found." />
                        return (
                            <Table head={['Requirement', 'Provider', 'Price', 'Status', 'Note', 'Sent']}>
                                {shown.map((x) => (
                                    <tr key={x.id}>
                                        <Td className="font-medium">{requestById[x.request_id]?.title ?? '-'}</Td>
                                        <Td>{providerById[x.provider_id]?.shop_name ?? '-'}</Td>
                                        <Td className="font-semibold">{fmtMoney(x.price)}</Td>
                                        <Td><QuoteBadge status={x.status} /></Td>
                                        <Td className="max-w-xs text-muted">{x.message || '-'}</Td>
                                        <Td>{fmtDate(x.created_at)}</Td>
                                    </tr>
                                ))}
                            </Table>
                        )
                    })()}
                </>
            )}

            {/* ============ REVIEWS ============ */}
            {tab === 'reviews' && (
                <>
                    {searchBox('Search by provider, comment or requirement')}
                    {(() => {
                        const shown = reviews.filter((rv) =>
                            match(providerById[rv.provider_id]?.shop_name, rv.comment, requestById[rv.request_id]?.title))
                        if (shown.length === 0) return <Empty icon={Star} text="No reviews found." />
                        return (
                            <Table head={['Provider', 'Rating', 'Comment', 'Requirement', 'Date', '']}>
                                {shown.map((rv) => (
                                    <tr key={rv.id}>
                                        <Td className="font-medium">{providerById[rv.provider_id]?.shop_name ?? '-'}</Td>
                                        <Td>
                                            <span className="flex items-center gap-1 font-semibold">
                                                <Star className="h-4 w-4 fill-amber-brand text-amber-brand" />{rv.rating}
                                            </span>
                                        </Td>
                                        <Td className="max-w-xs text-muted">{rv.comment || '-'}</Td>
                                        <Td>{requestById[rv.request_id]?.title ?? '-'}</Td>
                                        <Td>{fmtDate(rv.created_at)}</Td>
                                        <Td>
                                            <button
                                                onClick={() => deleteReview(rv)}
                                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        </Td>
                                    </tr>
                                ))}
                            </Table>
                        )
                    })()}
                </>
            )}
        </Page>
    )
}