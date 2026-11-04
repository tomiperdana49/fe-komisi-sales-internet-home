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

export interface TvMonitoringMember {
  name: string
  photoProfile: string
  branch: string | null
  activityCount: number
  target: number
  /** Activity gained on the last day with data. */
  lastDayDelta: number
}

/** One Sales Manager's team, day by day. */
export interface TvMonitoringManager {
  name: string
  photoProfile: string
  branch: string | null
  teamSize: number
  activityCount: number
  finalTarget: number
  achievementPercentage: number
  /** Activity an even pace to finalTarget would have reached by the last day with data. */
  expected: number
  neededPerDay: number
  status: 'on_track' | 'slightly_behind' | 'behind' | 'no_target'
  churnCount: number
  lastDayDelta: number
  /** Team activity at the end of each day from the period start to dataUntil. */
  cumulative: number[]
  members: TvMonitoringMember[]
}

export interface TvMonitoringData {
  period: string
  startDate: string
  endDate: string
  dataUntil: string | null
  daysElapsed: number
  daysTotal: number
  managers: TvMonitoringManager[]
  /** Account Managers outside every listed Sales Manager's team; `team` is whoever they report to. */
  otherAccountManagers: (TvMonitoringMember & { team: string | null })[]
}

export const tvService = {
  /** No login: the TV passes the shared display key from its URL. */
  async sales(key: string): Promise<TvSalesData> {
    const response = await apiService.client.get('/tv/sales', { params: { key } })
    return response.data.data
  },

  async monitoring(key: string): Promise<TvMonitoringData> {
    const response = await apiService.client.get('/tv/monitoring', { params: { key } })
    return response.data.data
  }
}
