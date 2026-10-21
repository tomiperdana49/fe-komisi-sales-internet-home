import type { CommissionProductRule } from './rules'

/** SDR commission rules — versioned separately from the Home rules (Aturan Komisi SDR). */
export interface SdrCommissionRules {
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
}

export interface SdrRuleSet {
    id: number;
    effectivePeriod: string;
    status: 'draft' | 'published';
    rules: SdrCommissionRules;
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

export interface SdrEffectiveRules {
    ruleSetId: number | null;
    effectivePeriod: string | null;
    rules: SdrCommissionRules;
}

export interface SdrRulePreview {
    period: string;
    sales: { employeeId: string; name: string; photoProfile: string; currentStatus: string; draftStatus: string; current: number; draft: number }[];
}
