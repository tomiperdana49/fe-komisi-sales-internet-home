// Only a Super Admin changes data on the admin pages (and manages "Akses Admin"); an Admin
// only views. The API enforces both — this just hides controls they can't use.
export const useAdminAccess = () => {
    const { state } = useAuth()
    const isSuperAdmin = computed(() => Boolean(state.user?.is_super_admin))
    return { isSuperAdmin }
}
