export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string | null;
          role: string;
          is_active: boolean | null;
          phone: string | null;
          avatar_url: string | null;
          preferences: Json | null;
          last_login: string | null;
          last_seen: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          organization_id: string;
          email: string;
          full_name?: string | null;
          role?: string;
          is_active?: boolean | null;
          phone?: string | null;
          avatar_url?: string | null;
          preferences?: Json | null;
          last_login?: string | null;
          last_seen?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      facilities: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          facility_type: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          phone: string | null;
          email: string | null;
          timezone: string | null;
          is_active: boolean | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          facility_type?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          phone?: string | null;
          email?: string | null;
          timezone?: string | null;
          is_active?: boolean | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["facilities"]["Insert"]>;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          organization_id: string;
          sku: string;
          name: string;
          category: string | null;
          subcategory: string | null;
          description: string | null;
          uom: string | null;
          unit_cost: number | null;
          currency: string | null;
          supplier_id: string | null;
          manufacturer: string | null;
          model_number: string | null;
          track_expiration: boolean | null;
          expiration_alert_days: number | null;
          is_active: boolean | null;
          image_url: string | null;
          notes: string | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          sku: string;
          name: string;
          category?: string | null;
          subcategory?: string | null;
          description?: string | null;
          uom?: string | null;
          unit_cost?: number | null;
          currency?: string | null;
          supplier_id?: string | null;
          manufacturer?: string | null;
          model_number?: string | null;
          track_expiration?: boolean | null;
          expiration_alert_days?: number | null;
          is_active?: boolean | null;
          image_url?: string | null;
          notes?: string | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          supplier_code: string | null;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          website: string | null;
          payment_terms: string | null;
          lead_time_days: number | null;
          minimum_order_quantity: number | null;
          is_active: boolean | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          supplier_code?: string | null;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          website?: string | null;
          payment_terms?: string | null;
          lead_time_days?: number | null;
          minimum_order_quantity?: number | null;
          is_active?: boolean | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          id: string;
          facility_id: string;
          supplier_id: string | null;
          po_number: string;
          po_date: string;
          expected_delivery_date: string | null;
          actual_delivery_date: string | null;
          status: string | null;
          total_amount: number | null;
          currency: string | null;
          notes: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          facility_id: string;
          supplier_id?: string | null;
          po_number: string;
          po_date: string;
          expected_delivery_date?: string | null;
          actual_delivery_date?: string | null;
          status?: string | null;
          total_amount?: number | null;
          currency?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_orders"]["Insert"]>;
        Relationships: [];
      };
      purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          inventory_item_id: string;
          quantity_ordered: number | null;
          quantity_received: number | null;
          unit_price: number | null;
          line_total: number | null;
          uom: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          inventory_item_id: string;
          quantity_ordered?: number | null;
          quantity_received?: number | null;
          unit_price?: number | null;
          line_total?: number | null;
          uom?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_order_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type PublicTables = Database["public"]["Tables"];

export type TableName = keyof PublicTables;
export type TableRow<T extends TableName> = PublicTables[T]["Row"];
export type TableInsert<T extends TableName> = PublicTables[T]["Insert"];
export type TableUpdate<T extends TableName> = PublicTables[T]["Update"];
