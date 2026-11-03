export default defineNuxtRouteMiddleware((to, from) => {
    if (process.server) return

    // Production nginx serves the generated pages with a trailing slash (/tv/), so compare without it.
    const path = to.path.replace(/\/+$/, '') || '/'

    // The TV lounge screen has no login; its display key is checked by the BE.
    if (path === '/tv') return

    const { state } = useAuth()

    if (!state.token && path !== '/sign-in') {
      return navigateTo('/sign-in')
    }

    if (path.startsWith('/sumarry') && !state.user?.is_admin) {
      useToast().add({ title: 'Access denied', description: 'Summary dashboard is admin-only.', color: 'error' })
      return navigateTo('/')
    }

    if (path === '/sumarry/admin-access' && !state.user?.is_super_admin) {
      useToast().add({ title: 'Access denied', description: 'Akses Admin hanya untuk Super Admin.', color: 'error' })
      return navigateTo('/sumarry/sales')
    }
})