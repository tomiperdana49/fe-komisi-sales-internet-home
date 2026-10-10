import type { CommissionLineItem } from "./sales"

export interface SummaryQueryParams {
    period?: string;
    month?: number;
    year?: number;
}

export interface SalesSummaryItem {
    employeeId: string;
    name: string;
    photoProfile: string;
    status: string | null;
    achievementStatus: string;
    activityCount: number;
    newMrc: number;
    newSubscription: number;
    newCommission: number;
    recurringSubscription: number;
    recurringCommission: number;
    otherSubscription: number;
    otherCommission: number;
    bonusBulanan: number;
    bonusKelebihanService: number;
    consistencyBonus: number;
    totalCommission: number;
}

export interface SalesSummaryResponseData {
    success: boolean;
    message: string;
    data: SalesSummaryItem[];
}

export interface ManagerSummaryItem {
    employeeId: string;
    name: string;
    photoProfile: string;
    totalCount: number;
    achievementPercentage: number;
    activityCount: number;
    isTargetAchieved: boolean;
    newMrc: number;
    newSubscription: number;
    newCommission: number;
    recurringSubscription: number;
    recurringCommission: number;
    managerNewCommission: number;
    managerRecurringCommission: number;
    managerTotalCommission: number;
}

export interface ManagerSummaryResponseData {
    success: boolean;
    message: string;
    data: ManagerSummaryItem[];
}

export interface InvoiceSummaryItem extends CommissionLineItem {
    sales: { employeeId: string; name: string; photoProfile: string } | null;
    managerEmployee: { employeeId: string; name: string; photoProfile: string } | null;
}

export interface InvoiceSummaryResponseData {
    success: boolean;
    message: string;
    data: InvoiceSummaryItem[];
}

export interface InvoiceApprovalInput {
    isApproved: boolean;
}

export interface ChurnApprovalInput {
    isApproved: boolean;
    /** Required when isApproved: why the churn is waived. */
    note?: string;
}

export interface ChurnSummaryItem {
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
    /** Why an admin waived this churn; null while not approved (or approved before reasons were recorded). */
    approval_note: string | null;
    approved_by: string | null;
    approved_by_name: string | null;
    approved_at: string | null;
    employee_name: string | null;
    employee_eid: string | null;
    employee_photo: string | null;
}

export interface ChurnSummaryResponseData {
    success: boolean;
    message: string;
    data: ChurnSummaryItem[];
}

/** Admin-editable snapshot fields — everything except the identity keys (ai/aiReceipt/period) and isApproved (has its own toggle). */
export interface AdjustableSnapshotFields {
    customerId?: string;
    customerName?: string | null;
    customerCompany?: string | null;
    customerServiceId?: number | null;
    customerServiceAccount?: string | null;
    serviceId?: string | null;
    serviceName?: string | null;
    category?: string | null;
    sales?: string | null;
    manager?: string | null;
    vendor?: string | null;
    subscription?: number | null;
    lineRental?: number | null;
    paidDate?: string | null;
    month?: number | null;
    lateMonth?: number | null;
    type?: string | null;
    referralFee?: number | null;
    referralType?: string | null;
    referralName?: string | null;
    businessOperation?: string | null;
}

export interface InvoiceAdjustmentInput extends AdjustableSnapshotFields {
    note: string;
}

/** Full raw invoice row, used to prefill the adjustment form with every field. */
export interface SnapshotDetailItem extends AdjustableSnapshotFields {
    aiInvoice: number;
    aiReceipt: number | null;
    period: string;
    isApproved: boolean;
    isAdjusted: boolean;
}

export interface SnapshotDetailResponseData {
    success: boolean;
    message: string;
    data: SnapshotDetailItem;
}

export interface SnapshotAdjustmentItem {
    id: number;
    aiInvoice: number;
    employeeId: string;
    employeeName: string | null;
    oldValue: Partial<AdjustableSnapshotFields>;
    newValue: Partial<AdjustableSnapshotFields>;
    note: string;
    createdAt: string;
}

export interface SnapshotAdjustmentResponseData {
    success: boolean;
    message: string;
    data: SnapshotAdjustmentItem[];
}

export interface ConsistencyBonusItem {
    employeeId: string;
    name: string;
    photoProfile: string;
    status: string | null;
    amount: number;
    note: string | null;
    /** Comma-separated month numbers (1-12) the admin cites as the consistency record — informational only. */
    months: string | null;
    serviceCount: number | null;
    testimonialLink: string | null;
    grantedBy: string | null;
    grantedByName: string | null;
    createdAt: string | null;
}

export interface ConsistencyBonusResponseData {
    success: boolean;
    message: string;
    data: ConsistencyBonusItem[];
}

export interface ConsistencyBonusGrantInput {
    amount: number;
    note: string;
    months?: number[];
    serviceCount: number;
    testimonialLink?: string;
}

/** One manual target range for an Account Manager (Target AM page). Periods are YYYYMM. */
export interface TargetOverride {
    id: number;
    target: number;
    startPeriod: string;
    endPeriod: string;
    note: string | null;
    updatedBy: string;
    updatedByName: string | null;
    updatedAt: string;
}

export interface TargetOverrideRosterItem {
    employeeId: string;
    name: string;
    photoProfile: string;
    status: string | null;
    /** Target from the commission rules for this period and status. */
    defaultTarget: number;
    /** Target actually used this period: the manual one when active, else defaultTarget. */
    effectiveTarget: number;
    /** The manual range covering this period, if any. */
    active: TargetOverride | null;
    /** Manual ranges starting after this period, oldest first. */
    upcoming: TargetOverride[];
}

export interface TargetOverrideResponseData {
    success: boolean;
    message: string;
    data: TargetOverrideRosterItem[];
}

export interface TargetOverrideInput {
    target: number;
    startPeriod: string;
    endPeriod: string;
    note?: string;
}

/** A closed (frozen) commission period — the import jobs no longer re-crawl it. */
export interface PeriodClosing {
    period: string;
    closedBy: string;
    closedAt: string;
}

export interface PeriodClosingResponseData {
    success: boolean;
    message: string;
    data: PeriodClosing[];
}
