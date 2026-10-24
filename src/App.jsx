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
import { Routes, Route } from 'react-router-dom'

// ---- Shared components ----
import Navbar from './components/Navbar'               // top header + menu
import ProtectedRoute from './components/ProtectedRoute' // login + role guard

// ---- Public pages (no login needed) ----
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'

// ---- Customer pages ----
import PostRequirement from './pages/PostRequirement'  // create a request
import MyRequests from './pages/MyRequests'            // compare + accept quotes

// ---- Provider pages ----
import ProviderLeads from './pages/ProviderLeads'      // browse leads + send quotes
import ProviderQuotes from './pages/ProviderQuotes'    // track sent/won quotes

// ---- Admin pages ----
import Admin from './pages/Admin'                      // verify providers

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* PUBLIC: anyone can open these */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* CUSTOMER ONLY: ProtectedRoute redirects others to Home or Login */}
          <Route path="/post" element={<ProtectedRoute role="customer"><PostRequirement /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute role="customer"><MyRequests /></ProtectedRoute>} />

          {/* PROVIDER ONLY */}
          <Route path="/leads" element={<ProtectedRoute role="provider"><ProviderLeads /></ProtectedRoute>} />
          <Route path="/my-quotes" element={<ProtectedRoute role="provider"><ProviderQuotes /></ProtectedRoute>} />

          {/* ADMIN ONLY */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  )
}