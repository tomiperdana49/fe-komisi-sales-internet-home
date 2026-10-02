import { apiService } from "./api-service"
import type { CommissionRules, CommissionRuleSet, EffectiveRules, RulePreview } from "~/types/rules"

type Envelope<T> = { success: boolean; message: string; data: T }

// Validation errors carry the specific problems in `error`, so show both.
const handleRuleError = (error: any): never => {
    const data = error.response?.data
    const message = data?.message || 'Terjadi kesalahan'
    useToast().add({ title: message, description: data?.error, color: 'error' })
    throw new Error(message)
}

const auth = () => ({ authorization: `Bearer ${useAuth().state.token}` })

export class RulesService {
    async list(): Promise<Envelope<CommissionRuleSet[]>> {
        try {
            return (await apiService.client.get('/summary/rules', { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    /** Read-only, open to every signed-in user — used by the term tooltips. */
    async effectiveForViewer(period: string): Promise<Envelope<EffectiveRules>> {
        const response = await apiService.client.get('/commission-rules/effective', { params: { period }, headers: auth() })
        return response.data
    }

    async effective(period: string): Promise<Envelope<EffectiveRules>> {
        try {
            return (await apiService.client.get('/summary/rules/effective', { params: { period }, headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async createDraft(effectivePeriod: string, note: string, copyFromId?: number): Promise<Envelope<CommissionRuleSet>> {
        try {
            return (await apiService.client.post('/summary/rules', { effectivePeriod, note, copyFromId }, { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async updateDraft(id: number, effectivePeriod: string, note: string, rules: CommissionRules): Promise<Envelope<CommissionRuleSet>> {
        try {
            return (await apiService.client.put(`/summary/rules/${id}`, { effectivePeriod, note, rules }, { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async preview(id: number, period: string): Promise<Envelope<RulePreview>> {
        try {
            return (await apiService.client.get(`/summary/rules/${id}/preview`, { params: { period }, headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async publish(id: number): Promise<Envelope<CommissionRuleSet>> {
        try {
            return (await apiService.client.post(`/summary/rules/${id}/publish`, {}, { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }

    async deleteDraft(id: number): Promise<Envelope<null>> {
        try {
            return (await apiService.client.delete(`/summary/rules/${id}`, { headers: auth() })).data
        } catch (error: any) {
            return handleRuleError(error)
        }
    }
}
