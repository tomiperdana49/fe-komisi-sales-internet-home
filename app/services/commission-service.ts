import { apiService } from "./api-service"
import type {
    SalesChurnResponseData,
    SalesCommissionQueryParams,
    SalesCommissionResponseData,
    SalesCommissionYearQueryParams,
    SalesCommissionYearResponseData
} from "~/types/sales"
import type {
    ManagerChurnResponseData,
    ManagerCommissionQueryParams,
    ManagerCommissionResponseData,
    ManagerCommissionYearQueryParams,
    ManagerCommissionYearResponseData
} from "~/types/manager"

export class CommissionService {
    async salesCommission(employeeId: string, params: SalesCommissionQueryParams): Promise<SalesCommissionResponseData> {
        try {
            const response = await apiService.client.get(`/sales/${employeeId}/commission`, {
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

    async salesCommissionYear(employeeId: string, params: SalesCommissionYearQueryParams): Promise<SalesCommissionYearResponseData> {
        try {
            const response = await apiService.client.get(`/sales/${employeeId}/commission/year`, {
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

    async salesChurn(employeeId: string, params: SalesCommissionQueryParams): Promise<SalesChurnResponseData> {
        try {
            const response = await apiService.client.get(`/sales/${employeeId}/churn`, {
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

    async managerCommission(managerId: string, params: ManagerCommissionQueryParams): Promise<ManagerCommissionResponseData> {
        try {
            const response = await apiService.client.get(`/manager/${managerId}/commission`, {
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

    async managerChurn(managerId: string, params: ManagerCommissionQueryParams): Promise<ManagerChurnResponseData> {
        try {
            const response = await apiService.client.get(`/manager/${managerId}/churn`, {
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

    async managerCommissionYear(managerId: string, params: ManagerCommissionYearQueryParams): Promise<ManagerCommissionYearResponseData> {
        try {
            const response = await apiService.client.get(`/manager/${managerId}/commission/year`, {
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
