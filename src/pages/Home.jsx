/**
 * Home page, top to bottom:
 * 1 Hero carousel  2 Products  3 Fabrication strip  4 Related tools
 * 5 Trust  6 FAQ  7 Provider banner (footer is rendered by App.jsx)
 * All text comes from i18n/translations.js via t('key').
 */
import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { Link, Navigate } from 'react-router-dom'
import { PRODUCTS } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { Calculator, MapPin, Users, Boxes, HardHat, ListChecks, ShieldCheck, Scale, Truck, IndianRupee, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'

// ---- Animated building: floors "rise" one by one, then loop (keyframes in index.css) ----
function BuildingAnimation() {
    return (
        <svg viewBox="0 0 200 200" className="mx-auto h-64 w-64">
            <rect x="10" y="185" width="180" height="8" rx="4" fill="#F97316" />
            {[0, 1, 2, 3, 4].map(i => (
                <g key={i} className="floor" style={{ '--i': i }}>
                    <rect x="50" y={155 - i * 30} width="100" height="28" rx="3" fill={i % 2 ? '#0284C7' : '#38BDF8'} />
                    <rect x="64" y={162 - i * 30} width="14" height="12" fill="#F8FAFC" />
                    <rect x="93" y={162 - i * 30} width="14" height="12" fill="#F8FAFC" />
                    <rect x="122" y={162 - i * 30} width="14" height="12" fill="#F8FAFC" />
                </g>
            ))}
        </svg>
    )
}

// ---- Simple house illustration for slide 2 ----
function HouseIllustration() {
    return (
        <svg viewBox="0 0 200 200" className="mx-auto h-64 w-64">
            <polygon points="100,30 20,95 180,95" fill="#F97316" />
            <rect x="35" y="95" width="130" height="85" fill="#F8FAFC" />
            <rect x="85" y="125" width="30" height="55" fill="#0F172A" />
            <rect x="50" y="110" width="25" height="25" fill="#0284C7" />
            <rect x="125" y="110" width="25" height="25" fill="#0284C7" />
            <rect x="10" y="180" width="180" height="8" rx="4" fill="#0F172A" />
        </svg>
    )
}

// ---- Slide 3: sample quote comparison cards (static demo) ----
function QuoteSample({ t }) {
    const rows = [['hero.sample.a', 'bg-white'], ['hero.sample.b', 'bg-amber-50 ring-2 ring-amber-brand'], ['hero.sample.c', 'bg-white']]
    return (
        <div className="mx-auto w-72 space-y-2">
            {rows.map(([k, cls], i) => (
                <div key={k} className={`rounded-xl p-3 text-slate-brand ${cls}`}>
                    <div className="flex items-center justify-between font-semibold">
                        {t(k)} {i === 1 && <span className="rounded-full bg-amber-brand px-2 text-xs text-white">{t('hero.sample.best')}</span>}
                    </div>
                    <p className="text-xs text-muted">✔ {t('hero.sample.verified')}</p>
                </div>
            ))}
        </div>
    )
}

function Hero() {
    const { t } = useLang()
    const [i, setI] = useState(0)
    // Auto-move to the next slide every 5 seconds (timer restarts whenever slide changes)
    useEffect(() => {
        const id = setTimeout(() => setI(n => (n + 1) % 3), 5000)
        return () => clearTimeout(id)
    }, [i])

    const slides = [
        { title: t('hero.slide1.title'), tag: t('hero.slide1.tag'), art: <BuildingAnimation /> },
        { title: t('hero.slide2.title'), art: <HouseIllustration /> },
        { title: t('hero.slide3.title'), art: <QuoteSample t={t} /> },
    ]
    const s = slides[i]
    return (
        <section className="bg-gradient-to-br from-slate-brand to-slate-800 text-white">
            <div className="relative mx-auto grid min-h-[420px] max-w-7xl items-center gap-6 px-12 py-10 md:grid-cols-2">
                {/* LEFT: text + call-to-action buttons */}
                <div>
                    {s.tag && <p className="mb-2 font-semibold text-amber-brand">{s.tag}</p>}
                    <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{s.title}</h1>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link to="/post" className="rounded-xl bg-amber-brand px-6 py-3 font-semibold">{t('hero.cta.post')}</Link>
                        <a href="#products" className="rounded-xl border border-slate-500 px-6 py-3 font-semibold">{t('hero.cta.browse')}</a>
                    </div>
                </div>
                {/* RIGHT: slide artwork */}
                <div>{s.art}</div>

                {/* Arrows + dots */}
                <button onClick={() => setI((i + 2) % 3)} aria-label={t('hero.prev')} className="absolute left-2 top-1/2"><ChevronLeft /></button>
                <button onClick={() => setI((i + 1) % 3)} aria-label={t('hero.next')} className="absolute right-2 top-1/2"><ChevronRight /></button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                    {[0, 1, 2].map(n => <button key={n} onClick={() => setI(n)} aria-label={t('hero.goto') + ' ' + (n + 1)} className={`h-2 rounded-full ${n === i ? 'w-6 bg-amber-brand' : 'w-2 bg-slate-500'}`} />)}
                </div>
            </div>
        </section>
    )
}

// Category chips under the hero: click -> Product List filtered by that category
function Categories() {
    const { t } = useLang()
    return (
        <section className="mx-auto max-w-7xl px-4 pt-8">
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                {PRODUCTS.map(p => (
                    <Link key={p.id} to={`/products?cat=${p.id}`} className={`flex flex-col items-center rounded-2xl p-4 text-center font-semibold ${p.color} hover:shadow-md`}>
                        <span className="text-3xl">{p.emoji}</span><span className="mt-1 text-sm">{t(`cat.${p.id}`)}</span>
                    </Link>
                ))}
            </div>
        </section>
    )
}

// Offers strip: three short promises (text in translations.js)
function Offers() {
    const { t } = useLang()
    return (
        <section className="mx-auto max-w-7xl px-4 pt-6">
            <div className="grid gap-3 md:grid-cols-3">
                {['1', '2', '3'].map(n => <div key={n} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-slate-brand">🎁 {t(`offer.${n}`)}</div>)}
            </div>
        </section>
    )
}

export function Products() {
    const { t } = useLang()
    return (
        <section id="products" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-14">
            <div className="flex items-end justify-between">
                <div><h2 className="text-2xl font-bold">{t('products.title')}</h2><p className="text-muted">{t('products.subtitle')}</p></div>
                <Link to="/products" className="text-sm font-semibold text-blue-brand">{t('products.viewAll')} →</Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{ PRODUCTS.map(p => <ProductCard key={p.id} p={p} />) }</div>
            {/* Fabrication strip: gates, grills, railings, sheds */}
            <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl bg-blue-brand p-6 text-white md:flex-row">
                <div><h3 className="text-lg font-bold">{t('fab.title')}</h3><p className="text-sm">{t('fab.body')}</p></div>
                <Link to="/post" className="rounded-xl bg-white px-5 py-3 font-semibold text-blue-brand">{t('fab.cta')}</Link>
            </div>
        </section>
    )
}

const TOOLS = [['cost', Calculator], ['store', MapPin], ['customer', Users], ['products', Boxes], ['assist', HardHat], ['selector', ListChecks]]

export function Tools() {
    const { t } = useLang()
    return (
        <section id="tools" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-14">
            <h2 className="text-2xl font-bold">{t('tools.title')}</h2>
            <p className="text-muted">{t('tools.subtitle')}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {TOOLS.map(([k, Icon]) => (
                    <div key={k} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <Icon className="h-8 w-8 text-amber-brand" />
                        <h3 className="mt-3 font-semibold">{t(`tool.${k}.name`)}</h3>
                        <p className="text-sm text-muted">{t(`tool.${k}.desc`)}</p>
                        <span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted">{t('tools.soon')}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

const TRUST = [['verified', ShieldCheck], ['compare', Scale], ['local', Truck], ['free', IndianRupee]]

export function Trust() {
    const { t } = useLang()
    return (
        <section id="trust" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-14">
            <h2 className="text-2xl font-bold">{t('trust.title')}</h2>
            <p className="text-muted">{t('trust.subtitle')}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {TRUST.map(([k, Icon]) => (
                    <div key={k} className="rounded-2xl bg-white p-5 shadow-sm">
                        <Icon className="h-7 w-7 text-blue-brand" />
                        <h3 className="mt-2 font-semibold">{t(`trust.${k}.t`)}</h3>
                        <p className="text-sm text-muted">{t(`trust.${k}.d`)}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

export function Faq() {
    const { t } = useLang()
    const [open, setOpen] = useState(1) // which question is expanded
    return (
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pt-14">
            <h2 className="mb-4 text-2xl font-bold">{t('faq.title')}</h2>
            {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="mb-2 rounded-xl border border-slate-200 bg-white">
                    <button onClick={() => setOpen(open === n ? 0 : n)} className="flex w-full items-center justify-between p-4 text-left font-semibold">
                        {t(`faq.${n}.q`)}<ChevronDown className={`h-5 w-5 transition ${open === n ? 'rotate-180' : ''}`} />
                    </button>
                    {open === n && <p className="px-4 pb-4 text-sm text-muted">{t(`faq.${n}.a`)}</p>}
                </div>
            ))}
        </section>
    )
}

function ProviderBanner() {
    const { t } = useLang()
    return (
        <section className="mx-auto max-w-7xl px-4 pt-14">
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-amber-brand p-8 text-white md:flex-row">
                <div><h2 className="text-xl font-bold">{t('banner.title')}</h2><p>{t('banner.body')}</p></div>
                <Link to="/signup" className="rounded-xl bg-slate-brand px-6 py-3 font-semibold">{t('banner.cta')}</Link>
            </div>
        </section>
    )
}

export default function Home() {
    // Providers have their own dashboard, so they never see the customer home page
    const { profile } = useAuth()
    if (profile?.role === 'provider') return <Navigate to="/leads" replace />
    return (<><Hero /><Categories /><Offers /><Products /><Tools /><Trust /><Faq /><ProviderBanner /></>)
}
