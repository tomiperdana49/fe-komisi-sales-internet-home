export type ProductGroup = 'Home' | 'Nusafiber' | 'NusaSelecta Basic/Prime' | 'NusaSelecta Ultra'

export interface CommissionProductRule {
    name: string;
    serviceIds: string[];
    group: ProductGroup;
    rate1: number;
    rate6: number;
    rate12: number;
    /** Contract months at which the 6-month rate starts (2 for most products, 6 for NusaSelecta). */
    sixMonthRateFrom: number;
    /** Contract months at which the 12-month rate starts (12 by default). */
    twelveMonthRateFrom: number;
    /** null = use rates.setup */
    setupRate: number | null;
    /** Stopped services of this product are pulled in as churn. */
    churn: boolean;
}

export interface CommissionRules {
    /** Recurring categories that never earn commission — applied when invoices are imported. */
    excludedRecurringCategories: string[];
    products: CommissionProductRule[];
    rates: {
        prorate: number;
        setup: number;
        alatWithSetup: number;
        alatStandalone: number;
        recurringOnTarget: number;
        recurringMissedTarget: number;
        digitalBusinessInternal: number;
        digitalBusinessResell: number;
    };
    penalties: { latePerMonth: number; lateMax: number; missedTarget: number };
    targets: { permanent: number; probation: number };
    achievement: {
        permanentBonus: number;
        permanentOnTarget: number;
        permanentSp1Below: number;
        probationExcellent: number;
        probationVeryGood: number;
        probationAverage: number;
    };
    bonus: { tiers: { at: number; amount: number }[]; excessPerUnit: number };
    manager: {
        teamThresholds: { teamSize: number; percent: number }[];
        newCommissionTiers: { minAchievement: number; rate: number }[];
        recurringOnTarget: number;
        recurringMissedTarget: number;
    };
}

export interface CommissionRuleSet {
    id: number;
    effectivePeriod: string;
    status: 'draft' | 'published';
    rules: CommissionRules;
    note: string;
    createdBy: string;
    createdByName: string | null;
    createdAt: string;
    updatedBy: string | null;
    updatedByName: string | null;
    updatedAt: string | null;
    publishedBy: string | null;
    publishedByName: string | null;
    publishedAt: string | null;
}

export interface EffectiveRules {
    ruleSetId: number | null;
    effectivePeriod: string | null;
    rules: CommissionRules;
}

export interface RulePreview {
    period: string;
    sales: { employeeId: string; name: string; photoProfile: string; currentStatus: string; draftStatus: string; current: number; draft: number }[];
    managers: { employeeId: string; name: string; photoProfile: string; current: number; draft: number }[];
}
