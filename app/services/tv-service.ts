import { apiService } from './api-service'

/** One Account Manager as the public TV screen sees them: no IDs, no commission. */
export interface TvSalesRow {
  name: string
  photoProfile: string
  /** The photo with its background removed, or null until it has been processed. */
  photoCutout: string | null
  branch: string | null
  status: string | null
  activityCount: number
  /** 0 when the AM has no target this period (e.g. Probation). */
  target: number
  newSubscription: number
}

export interface TvPeriod {
  period: string
  startDate: string
  endDate: string
  closed: boolean
  rows: TvSalesRow[]
}

/** Where each AM stood when the day started, for the rank-movement arrows. */
export type TvBaselineRow = Pick<TvSalesRow, 'name' | 'activityCount' | 'newSubscription'>

export interface TvSalesData {
  previous: TvPeriod
  current: TvPeriod
  baseline: TvBaselineRow[]
  generatedAt: string
}

export const tvService = {
  /** No login: the TV passes the shared display key from its URL. */
  async sales(key: string): Promise<TvSalesData> {
    const response = await apiService.client.get('/tv/sales', { params: { key } })
    return response.data.data
  }
}
