/**
 * ProductDetail: one product page (/products/:id)
 * Photo, rate per unit, quantity, supplier, Add to Cart, Get Quote.
 * Supplier is a placeholder until products come from Supabase.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShieldCheck } from 'lucide-react'
import { PRODUCTS } from '../data/products'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

const MAX_QTY = 9999

export default function ProductDetail() {
    const { id } = useParams()
    const { t } = useLang()
    const { items, setQty, openDrawer } = useCart()
    const [text, setText] = useState('1')

    const p = PRODUCTS.find((x) => x.id === id)
    if (!p) {
        return (
            <div className="mx-auto min-h-[70vh] max-w-3xl px-4 pt-14 text-center">
                <p className="text-muted">{t('detail.notFound')}</p>
                <Link to="/products" className="mt-3 inline-block font-semibold text-blue-brand">{t('detail.back')}</Link>
            </div>
        )
    }

    const name = t(`product.${p.id}.name`)
    const per = t(`product.${p.id}.per`)
    const n = Math.floor(Number(text))
    const qty = n >= 1 ? Math.min(n, MAX_QTY) : 1

    function addToCart() {
        setQty(p.id, Math.min((items[p.id] || 0) + qty, MAX_QTY))
        openDrawer()
    }

    return (
        <div className="mx-auto min-h-[70vh] max-w-5xl px-4 pt-10">
            <Link to="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-brand">
                <ArrowLeft className="h-4 w-4" /> {t('detail.back')}
            </Link>

            <div className="mt-4 grid gap-8 md:grid-cols-2">
                {/* Photo */}
                <div className={`flex h-72 items-center justify-center overflow-hidden rounded-2xl text-7xl md:h-96 ${p.color}`}>
                    {p.image ? <img src={p.image} alt={name} className="h-full w-full object-cover" /> : p.emoji}
                </div>

                {/* Info */}
                <div>
                    <h1 className="text-3xl font-bold">{name}</h1>
                    <p className="mt-1 text-muted">{t(`product.${p.id}.hint`)}</p>

                    <p className="mt-4 text-3xl font-bold text-amber-brand">
                        ₹{p.price} <span className="text-base font-medium text-muted">/ {per}</span>
                    </p>
                    <p className="text-xs text-muted">{t('detail.approx')}</p>

                    {/* Supplier (placeholder for now) */}
                    <p className="mt-4 flex items-center gap-2 text-sm">
                        <ShieldCheck className="h-5 w-5 text-blue-brand" />
                        <span className="text-muted">{t('detail.supplier')}:</span>
                        <span className="font-semibold">{t('detail.supplierName')}</span>
                    </p>

                    {/* Quantity */}
                    <p className="mt-6 text-sm font-semibold">{t('cart.qty')} ({t(`product.${p.id}.unit`)})</p>
                    <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => setText(String(Math.max(1, qty - 1)))} disabled={qty <= 1}
                            aria-label={t('cart.decrease')}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40">
                            <Minus className="h-4 w-4" />
                        </button>
                        <input inputMode="numeric" value={text}
                            onChange={(e) => setText(e.target.value.replace(/\D/g, ''))}
                            onBlur={() => setText(String(qty))}
                            className="h-10 w-20 rounded-lg border border-slate-300 text-center font-semibold outline-none focus:border-blue-brand" />
                        <button onClick={() => setText(String(Math.min(MAX_QTY, qty + 1)))}
                            aria-label={t('cart.increase')}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <p className="mt-4 text-lg font-semibold">
                        {t('detail.total')}: ₹{(p.price * qty).toLocaleString('en-IN')}
                    </p>

                    {/* Buttons */}
                    <div className="mt-5 flex gap-3">
                        <button onClick={addToCart} className="flex-1 rounded-xl bg-slate-brand py-3 font-semibold text-white">
                            {t('product.add')}
                        </button>
                        <Link to={`/post?product=${p.id}&qty=${qty}`} className="flex-1 rounded-xl bg-amber-brand py-3 text-center font-semibold text-white">
                            {t('product.quote')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}