import { apiService } from "./api-service"

type Envelope<T> = { success: boolean; message: string; data: T }
export type CommissionSimulationSetting = { newPct: number | null; oldPct: number | null; canEdit: boolean }

const auth = () => ({ authorization: `Bearer ${useAuth().state.token}` })

/** Simulasi Komisi: one shared, display-only setting; only the designated account may change it. */
export class CommissionSimulationService {
    async get(): Promise<Envelope<CommissionSimulationSetting>> {
        try {
            return (await apiService.client.get('/commission-simulation', { headers: auth() })).data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async save(input: { newPct: number | null; oldPct: number | null }): Promise<Envelope<CommissionSimulationSetting>> {
        try {
            return (await apiService.client.put('/commission-simulation', input, { headers: auth() })).data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}
