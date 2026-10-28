/** ProductCard: one product tile = photo, name, hint, price/unit, Add to cart, Get quote. */
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'

export default function ProductCard({ p }) {
    const { t } = useLang()
    const { items, add } = useCart()
    const name = t(`product.${p.id}.name`)
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            {/* Photo box: photo if set, otherwise emoji on a colored background */}
            <div className={`flex h-40 items-center justify-center text-5xl ${p.color}`}>
                {p.image ? <img src={p.image} alt={name} className="h-full w-full object-cover" /> : p.emoji}
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold">{name}</h3>
                <p className="text-sm text-muted">{t(`product.${p.id}.hint`)}</p>
                {/* Price per unit, e.g. Rs 380 / bag */}
                <p className="mt-2 text-lg font-bold text-amber-brand">₹{p.price} <span className="text-sm font-medium text-muted">/ {t(`product.${p.id}.per`)}</span></p>
                <div className="mt-auto flex gap-2 pt-3">
                    <button onClick={() => add(p.id)} className="flex-1 rounded-lg bg-slate-brand py-2 text-sm font-semibold text-white">
                        {items[p.id] ? `${t('product.inCart')} (${items[p.id]})` : t('product.add')}
                    </button>
                    <Link to={`/post?product=${p.id}`} className="flex-1 rounded-lg bg-amber-brand py-2 text-center text-sm font-semibold text-white">{t('product.quote')}</Link>
                </div>
            </div>
        </div>
    )
}
