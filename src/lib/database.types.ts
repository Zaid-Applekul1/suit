export type ConsultType   = 'CHAT' | 'CALL' | 'VIDEO' | 'ONSITE_VISIT';
export type ConsultStatus = 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED';
export type PrescriptionStatus = 'PENDING' | 'APPLIED' | 'NEEDS_CORRECTION';
export type ActionCategory = 'FUNGICIDE' | 'INSECTICIDE' | 'FERTILIZER' | 'LABOR' | 'IRRIGATION' | 'OTHER';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          farm_name: string | null;
          avatar_url: string | null;
          khasra_number: string | null;
          khata_number: string | null;
          whatsapp: string | null;
          address: string | null;
          language: string | null;
          currency: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      /**
       * doctors — real doctor profiles created by users who register as doctors.
       * user_id links to auth.users (1-to-1).
       */
      doctors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          specialization: string;
          hospital_name: string;
          phone: string | null;
          email: string | null;
          bio: string | null;
          rating: number;
          available: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['doctors']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['doctors']['Insert']>;
      };

      // consultations.doctor_id now stores the UUID from doctors.id
      consultations: {
        Row: {
          id: string;
          user_id: string;
          grower_name: string;
          grower_phone: string;
          field_id: string;
          orchard_name: string;
          doctor_id: string | null;
          type: ConsultType;
          status: ConsultStatus;
          target_datetime: string;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consultations']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['consultations']['Insert']>;
      };

      prescriptions: {
        Row: {
          id: string;
          consultation_id: string;
          doctor_name: string;
          hospital_name: string;
          issue_diagnosed: string;
          eppo_code: string;
          recommendation: string;
          status: PrescriptionStatus;
          issued_at: string;
          follow_up_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>;
      };

      prescription_action_items: {
        Row: {
          id: string;
          prescription_id: string;
          category: ActionCategory;
          product_name: string;
          dosage: string;
          estimated_cost: number;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['prescription_action_items']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['prescription_action_items']['Insert']>;
      };
    };
  };
}

/* ── Hydrated app-level types (with nested relations) ── */

export interface ActionItem {
  id: string;
  category: ActionCategory;
  productName: string;
  dosage: string;
  estimatedCost: number;
}

export interface DigitalPrescription {
  id: string;
  consultationId: string;
  doctorName: string;
  hospitalName: string;
  issueDiagnosed: string;
  eppoCode: string;
  recommendation: string;
  actionItems: ActionItem[];
  status: PrescriptionStatus;
  issuedAt: string;
  followUpDate: string;
}

export interface ConsultationRequest {
  id: string;
  growerName: string;
  growerPhone: string;
  fieldId: string;
  orchardName: string;
  doctorId: string | null;
  type: ConsultType;
  status: ConsultStatus;
  targetDateTime: string;
  notes: string;
  prescription?: DigitalPrescription;
  createdAt: string;
}

/** Real doctor profile from the `doctors` table */
export interface DoctorProfile {
  id: string;          // doctors.id (UUID)
  userId: string;      // links to auth.users.id
  name: string;
  specialization: string;
  hospitalName: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
  rating: number;
  available: boolean;
  avatarUrl: string | null;
  createdAt: string;
}
