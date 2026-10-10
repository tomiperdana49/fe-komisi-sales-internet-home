import type { ManagerServiceGroup } from './manager'

export interface CommissionStats {
    count: number;
    commission: number;
    subscription: number;
    mrc: number;
}

export interface CommissionBreakdown {
    new: CommissionStats;
    upgrade: CommissionStats;
    prorate: CommissionStats;
    recurring: CommissionStats;
    alat: CommissionStats;
    setup: CommissionStats;
}

export interface CommissionLineItem {
    aiInvoice: number;
    aiReceipt: number | null;
    customerId: string;
    customerName: string | null;
    customerCompany: string | null;
    customerServiceId: number | null;
    customerServiceAccount: string | null;
    serviceId: string | null;
    serviceName: string | null;
    category: string | null;
    /** Product label from the period's Aturan Komisi, computed on the BE. */
    serviceGroup: ManagerServiceGroup;
    businessOperation: string | null;
    manager: string | null;
    type: string;
    /** Renewal price increase that billing marked as new — commissioned as recurring. */
    isRenewal?: boolean;
    month: number;
    lateMonth: number;
    isApproved: boolean;
    isAdjusted: boolean;
    paidDate: string | null;
    subscription: number;
    mrc: number;
    referralFee: number;
    referralType: string | null;
    baseCommission: number;
    commissionPercentage: number;
    commission: number;
}

export interface SalesCommissionQueryParams {
    period?: string;
    month?: number;
    year?: number;
}

export interface SalesCommissionData {
    period: string;
    startDate: string;
    endDate: string;
    /** When an admin closed (froze) this period; null while it is still open. */
    closedAt: string | null;
    employeeId: string;
    status: string | null;
    activityCount: number;
    /** New Achievement target used this period: the admin-set one (Target AM page) when present, else the rules' default. */
    target: number;
    /** The admin-set target and its period range (YYYYMM), when one covers this period. */
    manualTarget: { target: number; startPeriod: string; endPeriod: string } | null;
    /** NusaSelecta New units sold (before churn); they count toward New Achievement only in groups. */
    nusaSelectaNewUnits?: { basicPrime: number; ultra: number };
    achievementStatus: string;
    motivation: string;
    bonusBulanan: number;
    bonusKelebihanService: number;
    consistencyBonus: number;
    total: CommissionStats;
    breakdown: CommissionBreakdown;
    byServiceGroup: Record<string, CommissionBreakdown>;
    deduction: CommissionStats;
}

export interface SalesCommissionResponseData {
    success: boolean;
    message: string;
    data: SalesCommissionData;
}

export interface SalesCommissionYearQueryParams {
    year: number;
}

export interface SalesCommissionYearData {
    year: number;
    employeeId: string;
    yearly: CommissionStats;
    months: SalesCommissionData[];
}

export interface SalesCommissionYearResponseData {
    success: boolean;
    message: string;
    data: SalesCommissionYearData;
}

export interface SalesInvoiceData {
    period: string;
    startDate: string;
    endDate: string;
    count: number;
    data: CommissionLineItem[];
}

export interface SalesInvoiceResponseData {
    success: boolean;
    message: string;
    data: SalesInvoiceData;
}

export interface ChurnRow {
    customer_service_id: number;
    customer_id: string;
    customer_name: string | null;
    customer_service_account: string | null;
    service_id: string | null;
    service_name: string | null;
    registration_date: string | null;
    unregistration_date: string | null;
    reason: string | null;
    /** NIS close category: status when closed (e.g. "Renewal") and the reason picked; null for legacy closings. */
    close_status: string | null;
    close_reason: string | null;
    period: number;
    price: number | null;
    sales_id: string | null;
    manager_id: string | null;
    is_approved: boolean;
    /** Why an admin waived this churn (it then cuts nothing); null when not waived or no reason was recorded. */
    approval_note: string | null;
    mrc: number;
    commission: number;
    commissionPercentage: number;
}

export interface SalesChurnResponseData {
    success: boolean;
    message: string;
    data: ChurnRow[];
}
