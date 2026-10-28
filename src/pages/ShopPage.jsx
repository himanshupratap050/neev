/**
 * ShopPage.jsx: PUBLIC SHOP PAGE
 * ---------------------------------------------------------------
 * Purpose : What a customer sees about one provider: shop details,
 *           verified badge, rating, products and reviews.
 * Route   : /shop/:id (public, id = the provider's user id)
 * Tables  : providers, provider_products, reviews (all publicly readable)
 *
 * DEBUG: "Shop not found" = wrong id in the URL, or the providers row
 *        does not exist for this user.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Star, MapPin, Store } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Page, Grid, Card, Button, Badge, Empty, Spinner, timeAgo } from '../components/ui'

export default function ShopPage() {
    const { id } = useParams()
    const [shop, setShop] = useState(null)
    const [products, setProducts] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [s, p, r] = await Promise.all([
                supabase.from('providers').select('*').eq('id', id).maybeSingle(),
                supabase.from('provider_products').select('*').eq('provider_id', id).order('created_at', { ascending: false }),
                supabase.from('reviews').select('*').eq('provider_id', id).order('created_at', { ascending: false }),
            ])
            setShop(s.data)
            setProducts(p.data ?? [])
            setReviews(r.data ?? [])
            setLoading(false)
        }
        load()
    }, [id])

    if (loading) return <Spinner />
    if (!shop) return <Page title="Shop"><Empty icon={Store} text="Shop not found." /></Page>

    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

    return (
        <Page size="wide" title={shop.shop_name} subtitle={shop.category}>
            <Card>
                <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={shop.verified ? 'green' : 'gray'}>{shop.verified ? 'Verified' : 'Not verified yet'}</Badge>
                    <span className="flex items-center gap-1 text-sm text-muted">
                        <MapPin className="h-4 w-4" />{shop.city} {shop.pincode}
                    </span>
                    {avg && (
                        <span className="flex items-center gap-1 text-sm font-semibold">
                            <Star className="h-4 w-4 fill-amber-brand text-amber-brand" />{avg} ({reviews.length})
                        </span>
                    )}
                </div>
                {shop.description && <p className="mt-3 text-muted">{shop.description}</p>}
                <div className="mt-4 max-w-xs">
                    <Link to="/post"><Button>Post a requirement</Button></Link>
                </div>
            </Card>

            <h2 className="pt-2 text-xl font-bold">Products</h2>
            {products.length === 0 && <Empty text="This shop has not listed products yet." />}
            <Grid>
                {products.map((p) => (
                    <Card key={p.id}>
                        {p.photo_url
                            ? <img src={p.photo_url} alt={p.name} onError={(e) => { e.currentTarget.style.display = 'none' }} className="mb-3 h-40 w-full rounded-xl object-cover" />
                            : <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-slate-100 text-4xl">📦</div>}
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-snug">{p.name}</h3>
                            <Badge tone={p.in_stock ? 'green' : 'gray'}>{p.in_stock ? 'In stock' : 'Out of stock'}</Badge>
                        </div>
                        <p className="mt-1 text-lg font-bold">
                            {p.price ? `₹${Number(p.price).toLocaleString('en-IN')} / ${p.unit ?? 'unit'}` : 'Ask for quote'}
                        </p>
                        {p.description && <p className="mt-2 text-sm text-muted">{p.description}</p>}
                    </Card>
                ))}
            </Grid>

            <h2 className="pt-2 text-xl font-bold">Reviews</h2>
            {reviews.length === 0 && <Empty text="No reviews yet." />}
            <Grid>
                {reviews.map((r) => (
                    <Card key={r.id}>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-semibold">
                                <Star className="h-4 w-4 fill-amber-brand text-amber-brand" />{r.rating}/5
                            </span>
                            <span className="text-xs text-muted">{timeAgo(r.created_at)}</span>
                        </div>
                        {r.comment && <p className="mt-2 text-sm text-muted">{r.comment}</p>}
                    </Card>
                ))}
            </Grid>
        </Page>
    )
}