import { apiService } from "./api-service"
import type { TestimonialInput, TestimonialResponseData } from "~/types/testimonial"
import type { SummaryQueryParams } from "~/types/summary"

export class TestimonialService {
    private get headers() {
        return { authorization: `Bearer ${useAuth().state.token}` }
    }

    async listBySales(employeeId: string): Promise<TestimonialResponseData> {
        try {
            const response = await apiService.client.get(`/sales/${employeeId}/testimonial`, { headers: this.headers })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async listByPeriod(params: SummaryQueryParams): Promise<TestimonialResponseData> {
        try {
            const response = await apiService.client.get(`/summary/testimonial`, { params, headers: this.headers })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async create(employeeId: string, data: TestimonialInput): Promise<any> {
        try {
            const response = await apiService.client.post(`/sales/${employeeId}/testimonial`, data, { headers: this.headers })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async update(employeeId: string, id: number, data: TestimonialInput): Promise<any> {
        try {
            const response = await apiService.client.put(`/sales/${employeeId}/testimonial/${id}`, data, { headers: this.headers })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }

    async remove(employeeId: string, id: number): Promise<any> {
        try {
            const response = await apiService.client.delete(`/sales/${employeeId}/testimonial/${id}`, { headers: this.headers })
            return response.data
        } catch (error: any) {
            handleServiceError(error)
        }
    }
}
