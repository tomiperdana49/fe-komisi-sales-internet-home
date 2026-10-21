import { apiService } from "./api-service"
import type { SdrCommissionRules, SdrEffectiveRules, SdrRulePreview, SdrRuleSet } from "~/types/sdr-rules"

type Envelope<T> = { success: boolean; message: string; data: T }

// Validation errors carry the specific problems in `error`, so show both.
const handleRuleError = (error: any): never => {
    const data = error.response?.data
    const message = data?.message || 'Terjadi kesalahan'
    useToast().add({ title: message, description: data?.error, color: 'error' })
    throw new Error(message)
}

const auth = () => ({ authorization: `Bearer ${useAuth().state.token}` })

/** Admin endpoints for the SDR commission rules — separate versions from the Home rules (RulesService). */
export class SdrRulesService {
    async list(): Promise<Envelope<SdrRuleSet[]>> {
        try {
            return (await apiService.client.get('/summary/sdr-rules', { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async effective(period: string): Promise<Envelope<SdrEffectiveRules>> {
        try {
            return (await apiService.client.get('/summary/sdr-rules/effective', { params: { period }, headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async createDraft(effectivePeriod: string, note: string, copyFromId?: number): Promise<Envelope<SdrRuleSet>> {
        try {
            return (await apiService.client.post('/summary/sdr-rules', { effectivePeriod, note, copyFromId }, { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async updateDraft(id: number, effectivePeriod: string, note: string, rules: SdrCommissionRules): Promise<Envelope<SdrRuleSet>> {
        try {
            return (await apiService.client.put(`/summary/sdr-rules/${id}`, { effectivePeriod, note, rules }, { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async preview(id: number, period: string): Promise<Envelope<SdrRulePreview>> {
        try {
            return (await apiService.client.get(`/summary/sdr-rules/${id}/preview`, { params: { period }, headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async publish(id: number): Promise<Envelope<SdrRuleSet>> {
        try {
            return (await apiService.client.post(`/summary/sdr-rules/${id}/publish`, {}, { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async deleteDraft(id: number): Promise<Envelope<null>> {
        try {
            return (await apiService.client.delete(`/summary/sdr-rules/${id}`, { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }
}
