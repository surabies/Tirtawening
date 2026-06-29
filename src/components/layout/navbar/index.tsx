// src/components/layout/navbar/index.tsx
//
// Navbar modular dengan Context slot.
// - NavbarProvider: taruh di DashboardLayout (route.tsx)
// - Navbar: shell sticky yang render slot
// - NavbarSlot: diisi dari halaman masing-masing via useNavbar()
//
// Contoh pemakaian di halaman:
//   const { setContent } = useNavbar()
//   useEffect(() => {
//     setContent(<NavbarFilter />)
//     return () => setContent(null)
//   }, [])

export { Navbar } from './navbar'
export { NavbarProvider, useNavbar } from './navbar-context'
export { NavbarFilter } from './navbar-filter'
