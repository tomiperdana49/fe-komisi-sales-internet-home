export default defineNuxtRouteMiddleware((to, from) => {
    if (process.server) return

    // The TV lounge screen has no login; its display key is checked by the BE.
    if (to.path === '/tv') return

    const { state } = useAuth()

    if (!state.token && to.path !== '/sign-in') {
      return navigateTo('/sign-in')
    }

    if (to.path.startsWith('/sumarry') && !state.user?.is_admin) {
      useToast().add({ title: 'Access denied', description: 'Summary dashboard is admin-only.', color: 'error' })
      return navigateTo('/')
    }

    if (to.path === '/sumarry/admin-access' && !state.user?.is_super_admin) {
      useToast().add({ title: 'Access denied', description: 'Akses Admin hanya untuk Super Admin.', color: 'error' })
      return navigateTo('/sumarry/sales')
    }
})