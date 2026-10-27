/** CartContext: simple in-memory cart { productId: qty }. Backend hookup comes later. */
import { createContext, useContext, useState } from 'react'

const CartContext = createContext()
export const useCart = () => useContext(CartContext)

export function CartProvider({ children }) {
    const [items, setItems] = useState({})
    const add = id => setItems(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
    const remove = id => setItems(({ [id]: _, ...rest }) => rest)
    const count = Object.keys(items).length // badge number on the navbar cart icon
    return <CartContext.Provider value={{ items, add, remove, count }}>{children}</CartContext.Provider>
}
