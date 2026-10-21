import { apiService } from "./api-service"
import type { AdminAccessInput, AdminAccessList, AdminCandidate } from "~/types/admin-access"

type Envelope<T> = { success: boolean; message: string; data: T }

const auth = () => ({ authorization: `Bearer ${useAuth().state.token}` })

/** Super Admin endpoints for the ACL behind every admin page ("Akses Admin"). */
export class AdminAccessService {
    async list(): Promise<Envelope<AdminAccessList>> {
        try {
            return (await apiService.client.get('/summary/admin-access', { headers: auth() })).data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async candidates(search: string): Promise<Envelope<AdminCandidate[]>> {
        try {
            return (await apiService.client.get('/summary/admin-access/candidates', { params: { search }, headers: auth() })).data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(employeeId: string, input: AdminAccessInput): Promise<Envelope<null>> {
        try {
            return (await apiService.client.post('/summary/admin-access', { employeeId, ...input }, { headers: auth() })).data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, input: AdminAccessInput): Promise<Envelope<null>> {
        try {
            return (await apiService.client.put(`/summary/admin-access/${id}`, input, { headers: auth() })).data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async remove(id: number): Promise<Envelope<null>> {
        try {
            return (await apiService.client.delete(`/summary/admin-access/${id}`, { headers: auth() })).data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}
