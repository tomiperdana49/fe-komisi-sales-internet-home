import { apiService } from "./api-service"
import type {
    ChurnSummaryResponseData,
    ConsistencyBonusGrantInput,
    ConsistencyBonusResponseData,
    InvoiceApprovalInput,
    InvoiceAdjustmentInput,
    InvoiceSummaryResponseData,
    PeriodClosingResponseData,
    ManagerSummaryResponseData,
    SalesSummaryResponseData,
    SnapshotAdjustmentResponseData,
    SnapshotDetailResponseData,
    SummaryQueryParams,
    TargetOverrideInput,
    TargetOverrideResponseData
} from "~/types/summary"

export class SummaryService {
    async salesSummary(params: SummaryQueryParams): Promise<SalesSummaryResponseData> {
        try {
            const response = await apiService.client.get(`/summary/sales`, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async managerSummary(params: SummaryQueryParams): Promise<ManagerSummaryResponseData> {
        try {
            const response = await apiService.client.get(`/summary/manager`, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async invoiceSummary(params: SummaryQueryParams): Promise<InvoiceSummaryResponseData> {
        try {
            const response = await apiService.client.get(`/summary/invoice`, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async approveInvoice(aiInvoice: number, data: InvoiceApprovalInput): Promise<any> {
        try {
            const response = await apiService.client.post(`/summary/invoice/${aiInvoice}/approve`, data, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async invoiceDetail(aiInvoice: number): Promise<SnapshotDetailResponseData> {
        try {
            const response = await apiService.client.get(`/summary/invoice/${aiInvoice}`, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async adjustInvoice(aiInvoice: number, data: InvoiceAdjustmentInput): Promise<any> {
        try {
            const response = await apiService.client.put(`/summary/invoice/${aiInvoice}/adjust`, data, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async invoiceAdjustments(aiInvoice: number): Promise<SnapshotAdjustmentResponseData> {
        try {
            const response = await apiService.client.get(`/summary/invoice/${aiInvoice}/adjustments`, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async churnSummary(params: SummaryQueryParams): Promise<ChurnSummaryResponseData> {
        try {
            const response = await apiService.client.get(`/summary/churn`, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async approveChurn(customerServiceId: number, data: InvoiceApprovalInput): Promise<any> {
        try {
            const response = await apiService.client.post(`/summary/churn/${customerServiceId}/approve`, data, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async consistencyBonus(params: SummaryQueryParams): Promise<ConsistencyBonusResponseData> {
        try {
            const response = await apiService.client.get(`/summary/consistency-bonus`, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async grantConsistencyBonus(employeeId: string, params: SummaryQueryParams, data: ConsistencyBonusGrantInput): Promise<any> {
        try {
            const response = await apiService.client.put(`/summary/consistency-bonus/${employeeId}`, data, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async revokeConsistencyBonus(employeeId: string, params: SummaryQueryParams): Promise<any> {
        try {
            const response = await apiService.client.delete(`/summary/consistency-bonus/${employeeId}`, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async targetOverrides(params: SummaryQueryParams): Promise<TargetOverrideResponseData> {
        try {
            const response = await apiService.client.get(`/summary/target-override`, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async createTargetOverride(data: TargetOverrideInput & { employeeId: string }): Promise<any> {
        try {
            const response = await apiService.client.post(`/summary/target-override`, data, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async updateTargetOverride(id: number, data: TargetOverrideInput): Promise<any> {
        try {
            const response = await apiService.client.put(`/summary/target-override/${id}`, data, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async deleteTargetOverride(id: number): Promise<any> {
        try {
            const response = await apiService.client.delete(`/summary/target-override/${id}`, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async periodClosings(): Promise<PeriodClosingResponseData> {
        try {
            const response = await apiService.client.get(`/summary/period-closing`, {
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async closePeriod(params: SummaryQueryParams): Promise<any> {
        try {
            const response = await apiService.client.put(`/summary/period-closing`, {}, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async reopenPeriod(params: SummaryQueryParams): Promise<any> {
        try {
            const response = await apiService.client.delete(`/summary/period-closing`, {
                params,
                headers: {
                    authorization: `Bearer ${useAuth().state.token}`
                }
            })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }
}
