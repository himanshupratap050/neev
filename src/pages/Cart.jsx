/** Cart page: items added with "Add to cart"; "Request quotes" continues to the post-requirement form. */
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function Cart() {
    const { items, remove } = useCart()
    const { t } = useLang()
    const ids = Object.keys(items)
    return (
        <div className="mx-auto min-h-[70vh] max-w-2xl px-4 pt-14">
            <h1 className="text-2xl font-bold">{t('cart.title')}</h1>
            {ids.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-white p-6 text-center">
                    <p className="text-muted">{t('cart.empty')}</p>
                    <Link to="/products" className="mt-3 inline-block rounded-xl bg-amber-brand px-5 py-2 font-semibold text-white">{t('cart.browse')}</Link>
                </div>
            ) : (<>
                {ids.map(id => (
                    <div key={id} className="mt-3 flex items-center justify-between rounded-xl bg-white p-4">
                        <span className="font-semibold">{t(`product.${id}.name`)} × {items[id]}</span>
                        <button onClick={() => remove(id)} className="text-sm text-red-600">{t('cart.remove')}</button>
                    </div>
                ))}
                <p className="mt-3 text-sm text-muted">{t('cart.hint')}</p>
                <Link to="/post" className="mt-4 block rounded-xl bg-amber-brand py-3 text-center font-semibold text-white">{t('cart.request')}</Link>
            </>)}
        </div>
    )
}
