export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      cognitive_profiles: {
        Row: {
          id: string;
          contact_id: string;
          organization_id: string;
          profile_version: number;
          global_confidence: number;
          summary: string | null;
          updated_from: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['cognitive_profiles']['Row']> & {
          contact_id: string;
          organization_id: string;
        };
        Update: Partial<Database['public']['Tables']['cognitive_profiles']['Row']>;
      };
      behavioral_signals: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string;
          profile_id: string | null;
          signal_type: string;
          text: string;
          inference: string | null;
          inference_level: 'observable' | 'inferred' | 'hypothetical' | 'unavailable';
          confidence: number;
          source_type: string;
          source_ref: string | null;
          observed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['behavioral_signals']['Row']> & {
          organization_id: string;
          contact_id: string;
          signal_type: string;
          text: string;
          inference_level: 'observable' | 'inferred' | 'hypothetical' | 'unavailable';
          confidence: number;
          source_type: string;
        };
        Update: Partial<Database['public']['Tables']['behavioral_signals']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

