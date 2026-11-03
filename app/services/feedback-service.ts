import { apiService } from './api-service'

export interface FeedbackPayload {
  message: string
  type: string
  url: string
  images?: File[]
}

/** One feedback the signed-in user sent, as the feedback sheet stores it. */
export interface FeedbackItem {
  timestamp: string
  employeeId: string
  name: string
  type: string
  message: string
  url: string
  image: string[]
  /** Follow-up status the team set in the sheet, if any. */
  Action?: string | null
  Note?: string | null
}

export class FeedbackService {
  /** The signed-in user's own feedback history. */
  async list(): Promise<FeedbackItem[]> {
    const response = await apiService.client.get('/feedback', {
      headers: { authorization: `Bearer ${useAuth().state.token}` }
    })
    return response.data?.data ?? []
  }

  async create(payload: FeedbackPayload) {
    const formData = new FormData()
    formData.append('message', payload.message)
    formData.append('type', payload.type)
    formData.append('url', payload.url)

    if (payload.images && payload.images.length > 0) {
      payload.images.forEach((file) => {
        formData.append('images', file)
      })
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    const response = await apiService.client.post('/feedback', formData, {
      headers: {
        // Jangan set Content-Type manual untuk FormData — browser perlu
        // menyisipkan boundary otomatis, kalau di-override manual body multipart jadi rusak.
        'Content-Type': undefined,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
    return response.data
  }
}

export const feedbackService = new FeedbackService()
