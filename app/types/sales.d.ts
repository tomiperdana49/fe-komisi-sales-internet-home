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
    /** Why, by whom and when the late-payment waiver was approved; null while not approved (or approved before notes were recorded). */
    approvalNote?: string | null;
    approvedBy?: string | null;
    approvedByName?: string | null;
    approvedAt?: string | null;
    isAdjusted: boolean;
    /** Latest manual adjustment of an adjusted row: why, by whom and when. */
    adjustmentNote?: string | null;
    adjustedByName?: string | null;
    adjustedAt?: string | null;
    paidDate: string | null;
    /** Payment transaction date — what places the invoice in a period; paidDate is finance's input date. Null on rows pulled before it was recorded. */
    transactionDate?: string | null;
    /** New-customer rows: the service's first activation; null for recurring (or rows pulled before it was recorded). */
    activationDate?: string | null;
    subscription: number;
    mrc: number;
    referralFee: number;
    referralType: string | null;
    /** Reseller the referral fee goes to. */
    referralName?: string | null;
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
    /** Sales Development Representative: SDR rules, NusaSelecta counted 1:1. */
    isSdr: boolean;
    status: string | null;
    activityCount: number;
    /** New Achievement target used this period: the admin-set one (Target AM page) when present, else the rules' default. */
    target: number;
    /** The admin-set target and its period range (YYYYMM), when one covers this period. */
    manualTarget: { target: number; startPeriod: string; endPeriod: string } | null;
    /** NusaSelecta New units sold (before churn); they count toward New Achievement only in groups. */
    nusaSelectaNewUnits?: { basicPrime: number; ultra: number; promo?: number };
    achievementStatus: string;
    motivation: string;
    bonusBulanan: number;
    bonusKelebihanService: number;
    /** Manual + automatic Bonus Konsistensi. */
    consistencyBonus: number;
    /** The automatic part of consistencyBonus; null when the rules don't pay it this period. */
    consistencyBonusAuto?: { amount: number; months: { period: string; activityCount: number }[]; total: number } | null;
    total: CommissionStats;
    breakdown: CommissionBreakdown;
    byServiceGroup: Record<string, CommissionBreakdown>;
    deduction: CommissionStats;
    /** Referral fees on recurring invoices (incl. renewals); each already cuts its invoice's commission basis. */
    recurringReferralFee?: number;
    /** Late-payment cut on recurring invoices (after referral); approved invoices cut nothing. */
    recurringLatePenalty?: number;
    /** The recurring invoices behind recurringLatePenalty, each with its cut. */
    recurringLateItems?: import('./manager').ManagerRecurringBasisItem[];
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
    approved_by?: string | null;
    approved_by_name?: string | null;
    approved_at?: string | null;
    mrc: number;
    commission: number;
    commissionPercentage: number;
    /** Service group whose New figures this churn was deducted from. */
    serviceGroup: ManagerServiceGroup;
}

export interface SalesChurnResponseData {
    success: boolean;
    message: string;
    data: ChurnRow[];
}
