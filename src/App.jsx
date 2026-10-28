/**
 * App.jsx: ROUTER MODULE
 * ---------------------------------------------------------------
 * Purpose : Decides which page shows for each URL, and which role
 *           (customer / provider / admin) is allowed to open it.
 * Used by : main.jsx (this component is the root of the app)
 * Depends : Navbar, ProtectedRoute, and every file in /pages
 *
 * DEBUG: Blank page under the navbar = no route matches the URL.
 *        Open F12 -> Console and look for "No routes matched location".
 *        Also check that the page's import line below exists.
 */
import { Routes, Route, Outlet } from 'react-router-dom'

// ---- Shared components ----
import Navbar from './components/Navbar'               // top header + menu
import ProviderLayout from './components/ProviderLayout'  // provider sidebar dashboard
import Cart from './pages/Cart'
import { ProductsPage, ToolsPage, AboutPage, FaqPage } from './pages/InfoPages'
import Footer from './components/Footer'                 // bottom footer
import ProtectedRoute from './components/ProtectedRoute' // login + role guard
import CartDrawer from './components/CartDrawer'       // slide-in cart

// ---- Public pages (no login needed) ----
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'      // product details
import ShopPage from './pages/ShopPage'                // public shop page of a provider

// ---- Customer pages ----
import PostRequirement from './pages/PostRequirement'  // create a request
import MyRequests from './pages/MyRequests'            // compare + accept quotes

// ---- Provider pages ----
import ProviderDashboard from './pages/ProviderDashboard' // provider home: numbers + checklist
import ProviderLeads from './pages/ProviderLeads'         // browse leads + send quotes
import ProviderQuotes from './pages/ProviderQuotes'       // track sent/won quotes
import ProviderProducts from './pages/ProviderProducts'   // list and manage products
import ProviderProfile from './pages/ProviderProfile'     // edit shop details

// ---- Admin pages ----
import Admin from './pages/Admin'                      // admin panel

// Customer layout: navbar on top, page in the middle, footer at the bottom
function CustomerShell() {
    return (<><Navbar /><main><Outlet /></main><Footer /><CartDrawer /></>)
}

export default function App() {
    return (
        <Routes>
            {/* CUSTOMER SIDE (also public pages + admin) */}
            <Route element={<CustomerShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/shop/:id" element={<ShopPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/post" element={<ProtectedRoute role="customer"><PostRequirement /></ProtectedRoute>} />
                <Route path="/my-requests" element={<ProtectedRoute role="customer"><MyRequests /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
            </Route>

            {/* PROVIDER SIDE: its own sidebar dashboard */}
            <Route element={<ProtectedRoute role="provider"><ProviderLayout /></ProtectedRoute>}>
                <Route path="/provider" element={<ProviderDashboard />} />
                <Route path="/leads" element={<ProviderLeads />} />
                <Route path="/my-quotes" element={<ProviderQuotes />} />
                <Route path="/provider/products" element={<ProviderProducts />} />
                <Route path="/provider/profile" element={<ProviderProfile />} />
            </Route>
        </Routes>
    )
}