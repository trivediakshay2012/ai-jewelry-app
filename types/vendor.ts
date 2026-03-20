export type VendorRecord = {
    id: string;
    user_id: string;
    business_name: string;
    owner_name: string;
    email: string;
    phone?: string | null;
    country: string;
    city?: string | null;
    website?: string | null;
    specialization?: string[] | null;
    subscription_plan: string;
    subscription_status: string;
    stripe_account_id?: string | null;
    stripe_onboarding_complete: boolean;
    payouts_enabled: boolean;
    is_onboarded: boolean;
    created_at: string;
    updated_at: string;
  };
  
  export type UserRole = 'customer' | 'vendor' | 'admin';