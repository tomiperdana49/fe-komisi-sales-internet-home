export interface TestimonialItem {
    id: number;
    employeeId: string;
    employeeName: string | null;
    branch: string | null;
    /** Their Sales Manager when the testimonial was entered. */
    managerId: string | null;
    managerName: string | null;
    customerId: string;
    customerName: string;
    /** YYYY-MM-DD. */
    testimonialDate: string;
    link: string;
    createdBy: string;
    createdByName: string | null;
    createdAt: string;
    updatedByName: string | null;
    updatedAt: string | null;
    /** Dated in a closed period: only a Super Admin may change it. */
    periodClosed?: boolean;
}

export interface TestimonialInput {
    customerId: string;
    customerName: string;
    testimonialDate: string;
    link: string;
}

export interface TestimonialResponseData {
    success: boolean;
    message: string;
    data: TestimonialItem[];
}
