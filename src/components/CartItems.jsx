/**
 * CartItems.jsx: CART LIST + REQUEST BUTTON (shared)
 * ---------------------------------------------------------------
 * Purpose : The list of cart lines (photo, name, quantity stepper, remove)
 *           and the "Request quotes" button. Used by BOTH the slide-in
 *           drawer and the full /cart page, so they always match.
 * Parts   : 1) QtyInput    quantity field (type a number, or use + and -)
 *           2) CartItems   the list (default export)
 *           3) RequestCta  button, depends on login state and role
 *
 * DEBUG: Button does nothing? RequestCta navigates to /post?cart=1.
 *        PostRequirement reads that query and builds lines from the cart.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { PRODUCTS } from '../data/products'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'

/* PART 1: QtyInput. Keeps what the user is typing in local state, and
   saves it to the cart on blur or Enter (an empty field reverts). */
function QtyInput({ id, value }) {
    const { setQty } = useCart()
    const { t } = useLang()
    const [text, setText] = useState(String(value))

    useEffect(() => { setText(String(value)) }, [value])

    function commit() {
        const n = Math.floor(Number(text))
        if (n >= 1) setQty(id, n)
        else setText(String(value))
    }

    return (
        <input
            inputMode="numeric"
            aria-label={t('cart.qty')}
            value={text}
            onChange={(e) => setText(e.target.value.replace(/\D/g, ''))}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className="h-10 w-16 rounded-lg border border-slate-300 text-center font-semibold outline-none focus:border-blue-brand"
        />
    )
}

/* PART 2: CartItems (list) */
export default function CartItems({ onBrowse }) {
    const { items, setQty, remove } = useCart()
    const { t } = useLang()
    const lines = PRODUCTS.filter((p) => items[p.id])

    // Empty state
    if (lines.length === 0) {
        return (
            <div className="py-10 text-center">
                <p className="text-muted">{t('cart.empty')}</p>
                <Link to="/products" onClick={onBrowse}
                    className="mt-3 inline-block rounded-xl bg-amber-brand px-5 py-2 font-semibold text-white">
                    {t('cart.browse')}
                </Link>
            </div>
        )
    }

    return (
        <ul className="divide-y divide-slate-100">
            {lines.map((p) => (
                <li key={p.id} className="flex gap-3 py-3">
                    {/* Photo, or the emoji box if no image */}
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl ${p.color}`}>
                        {p.image
                            ? <img src={p.image} alt="" className="h-full w-full object-cover" />
                            : p.emoji}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{t(`product.${p.id}.name`)}</p>
                        <p className="text-xs text-muted">{t('cart.qty')} ({t(`product.${p.id}.unit`)})</p>

                        {/* Quantity stepper */}
                        <div className="mt-2 flex items-center gap-2">
                            <button
                                onClick={() => setQty(p.id, items[p.id] - 1)}
                                disabled={items[p.id] <= 1}
                                aria-label={t('cart.decrease')}
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40">
                                <Minus className="h-4 w-4" />
                            </button>
                            <QtyInput id={p.id} value={items[p.id]} />
                            <button
                                onClick={() => setQty(p.id, items[p.id] + 1)}
                                aria-label={t('cart.increase')}
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <button onClick={() => remove(p.id)} aria-label={t('cart.remove')}
                        className="self-start p-1 text-red-600">
                        <Trash2 className="h-5 w-5" />
                    </button>
                </li>
            ))}
        </ul>
    )
}

/* PART 3: RequestCta. Guest -> sign in. Customer -> go to the form.
   Provider or admin -> short note (they cannot post requirements). */
export function RequestCta({ onNavigate }) {
    const { user, profile } = useAuth()
    const { t } = useLang()
    const navigate = useNavigate()
    const base = 'block w-full rounded-xl bg-amber-brand py-3 text-center font-semibold text-white'

    if (!user) {
        return <Link to="/login" onClick={onNavigate} className={base}>{t('cart.signinToRequest')}</Link>
    }
    if (profile && profile.role !== 'customer') {
        return <p className="text-center text-sm text-muted">{t('cart.customersOnly')}</p>
    }
    return (
        <button onClick={() => { onNavigate?.(); navigate('/post?cart=1') }} className={base}>
            {t('cart.request')}
        </button>
    )
}