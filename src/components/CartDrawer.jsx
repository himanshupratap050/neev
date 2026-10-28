/**
 * CartDrawer.jsx: SLIDE-IN CART MODULE
 * ---------------------------------------------------------------
 * Purpose : A panel from the right that shows the whole cart. It opens
 *           when an item is added or when the navbar cart icon is clicked.
 * Mounted : once, inside CustomerShell in App.jsx
 * State   : drawerOpen / closeDrawer come from CartContext
 * Closes  : X button, click on the dark area, or the Esc key
 *
 * DEBUG: Drawer does not open? Check that <CartDrawer /> is rendered in
 *        App.jsx and that Navbar's cart icon calls openDrawer().
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import CartItems, { RequestCta } from './CartItems'

export default function CartDrawer() {
    const { count, drawerOpen, closeDrawer } = useCart()
    const { t } = useLang()

    // While open: Esc closes it, and the page behind does not scroll
    // (hooks must run before the early return below)
    useEffect(() => {
        if (!drawerOpen) return
        const onKey = (e) => { if (e.key === 'Escape') closeDrawer() }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [drawerOpen, closeDrawer])

    if (!drawerOpen) return null

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('cart.title')}>
            {/* Dark area: click to close */}
            <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />

            <aside className="drawer-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
                <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h2 className="text-lg font-bold">
                        {t('cart.title')}
                        {count > 0 && <span className="ml-2 text-sm font-medium text-muted">({count} {t('cart.itemsLabel')})</span>}
                    </h2>
                    <button onClick={closeDrawer} aria-label={t('cart.close')}><X className="h-6 w-6" /></button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-2">
                    <CartItems onBrowse={closeDrawer} />
                </div>

                {count > 0 && (
                    <footer className="space-y-2 border-t border-slate-200 px-4 py-3">
                        <p className="text-xs text-muted">{t('cart.hint')}</p>
                        <RequestCta onNavigate={closeDrawer} />
                        <Link to="/cart" onClick={closeDrawer}
                            className="block text-center text-sm font-semibold text-blue-brand">
                            {t('cart.viewFull')}
                        </Link>
                    </footer>
                )}
            </aside>
        </div>
    )
}