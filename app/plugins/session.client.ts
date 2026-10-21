import { authService } from '~/services/auth-service'

// Re-read the signed-in user on every app load so role changes apply without signing in again.
export default defineNuxtPlugin(() => {
    authService.validateSession()
})
