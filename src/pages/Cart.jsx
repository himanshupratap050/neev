/**
 * Cart.jsx: FULL CART PAGE (/cart)
 * ---------------------------------------------------------------
 * Purpose : The same cart as the drawer, as a full page, with a
 *           "clear cart" option. All logic lives in CartItems.jsx.
 */
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import CartItems, { RequestCta } from '../components/CartItems'

export default function Cart() {
    const { count, clear } = useCart()
    const { t } = useLang()

    return (
        <div className="mx-auto min-h-[70vh] max-w-2xl px-4 pt-14">
            <h1 className="text-2xl font-bold">{t('cart.title')}</h1>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <CartItems />
            </div>

            {count > 0 && (
                <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted">{t('cart.hint')}</p>
                    <RequestCta />
                    <button onClick={clear} className="w-full text-sm font-semibold text-red-600">
                        {t('cart.clear')}
                    </button>
                </div>
            )}
        </div>
    )
}