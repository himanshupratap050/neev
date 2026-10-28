/**
 * CartContext.jsx: CART STATE MODULE
 * ---------------------------------------------------------------
 * Purpose : Holds the cart as { productId: quantity }, saves it in
 *           localStorage (survives refresh and login), and controls the
 *           slide-in cart drawer.
 * Used by : Navbar (badge + open drawer), Home Products ("Add to cart"),
 *           CartItems / CartDrawer / Cart page, PostRequirement (reads the
 *           cart, then removes the submitted items).
 *
 * DEBUG: Cart empty after refresh? Open F12 -> Application -> Local Storage
 *        -> key "neev-cart". Unknown product ids are dropped in load().
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { PRODUCTS } from '../data/products'

const KEY = 'neev-cart'
const MAX_QTY = 9999
const VALID_IDS = new Set(PRODUCTS.map((p) => p.id))

const CartContext = createContext()
export const useCart = () => useContext(CartContext)

// Read the saved cart safely: ignore broken JSON, unknown products, bad numbers
function load() {
    try {
        const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
        const clean = {}
        for (const [id, q] of Object.entries(raw)) {
            const n = Math.floor(Number(q))
            if (VALID_IDS.has(id) && n > 0) clean[id] = Math.min(n, MAX_QTY)
        }
        return clean
    } catch {
        return {}
    }
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(load)
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Save on every change
    useEffect(() => {
        try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* storage full or blocked */ }
    }, [items])

    // ---- Actions ----
    // Add one unit, then open the drawer so the user sees the whole cart
    const add = (id) => {
        setItems((c) => ({ ...c, [id]: Math.min((c[id] || 0) + 1, MAX_QTY) }))
        setDrawerOpen(true)
    }
    const setQty = (id, qty) => {
        const n = Math.floor(Number(qty))
        if (!(n >= 1)) return
        setItems((c) => ({ ...c, [id]: Math.min(n, MAX_QTY) }))
    }
    const remove = (id) => setItems((c) => {
        const next = { ...c }
        delete next[id]
        return next
    })
    const removeMany = (ids) => setItems((c) => {
        const next = { ...c }
        ids.forEach((id) => delete next[id])
        return next
    })
    const clear = () => setItems({})

    const count = Object.keys(items).length // number of different products (navbar badge)

    return (
        <CartContext.Provider value={{
            items, count, add, setQty, remove, removeMany, clear,
            drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
        }}>
            {children}
        </CartContext.Provider>
    )
}