export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          name?: string
        }
        Relationships: []
      }
      hero_banners: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_visible: boolean | null
          link_url: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_visible?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_visible?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_visible: boolean
          reference_id: string | null
          section_type: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          reference_id?: string | null
          section_type: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          reference_id?: string | null
          section_type?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          mobile: string | null
          name: string
          product_id: string
          purpose: string | null
          source_button: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          mobile?: string | null
          name: string
          product_id: string
          purpose?: string | null
          source_button?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          mobile?: string | null
          name?: string
          product_id?: string
          purpose?: string | null
          source_button?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_features: {
        Row: {
          display_order: number | null
          feature_text: string
          id: string
          is_included: boolean | null
          plan_id: string
        }
        Insert: {
          display_order?: number | null
          feature_text: string
          id?: string
          is_included?: boolean | null
          plan_id: string
        }
        Update: {
          display_order?: number | null
          feature_text?: string
          id?: string
          is_included?: boolean | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          billing_period: string
          brand_user_id: string | null
          created_at: string | null
          currency: string
          display_order: number | null
          id: string
          is_enabled: boolean | null
          is_popular: boolean | null
          name: string
          price: number
          product_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          billing_period?: string
          brand_user_id?: string | null
          created_at?: string | null
          currency?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          is_popular?: boolean | null
          name: string
          price?: number
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_period?: string
          brand_user_id?: string | null
          created_at?: string | null
          currency?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          is_popular?: boolean | null
          name?: string
          price?: number
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_plans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_banners: {
        Row: {
          banner_label: string | null
          banner_subtext: string | null
          banner_text: string
          banner_url: string | null
          bg_color: string | null
          display_order: number | null
          id: string
          product_id: string
        }
        Insert: {
          banner_label?: string | null
          banner_subtext?: string | null
          banner_text: string
          banner_url?: string | null
          bg_color?: string | null
          display_order?: number | null
          id?: string
          product_id: string
        }
        Update: {
          banner_label?: string | null
          banner_subtext?: string | null
          banner_text?: string
          banner_url?: string | null
          bg_color?: string | null
          display_order?: number | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_banners_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_features: {
        Row: {
          display_order: number | null
          feature_text: string
          id: string
          product_id: string
        }
        Insert: {
          display_order?: number | null
          feature_text: string
          id?: string
          product_id: string
        }
        Update: {
          display_order?: number | null
          feature_text?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_integrations: {
        Row: {
          display_order: number | null
          id: string
          integration_name: string
          product_id: string
        }
        Insert: {
          display_order?: number | null
          id?: string
          integration_name: string
          product_id: string
        }
        Update: {
          display_order?: number | null
          id?: string
          integration_name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_integrations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_links: {
        Row: {
          display_order: number | null
          id: string
          is_highlighted: boolean | null
          link_text: string
          link_type: string | null
          link_url: string
          product_id: string
        }
        Insert: {
          display_order?: number | null
          id?: string
          is_highlighted?: boolean | null
          link_text: string
          link_type?: string | null
          link_url: string
          product_id: string
        }
        Update: {
          display_order?: number | null
          id?: string
          is_highlighted?: boolean | null
          link_text?: string
          link_type?: string | null
          link_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          best_for_max: number | null
          best_for_min: number | null
          best_for_unit: string | null
          brand_user_id: string
          category_id: string | null
          category_label: string | null
          company_name: string
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          currency: string | null
          description: string
          discount_percent: number | null
          display_order: number | null
          free_trial_link: string | null
          free_trial_text: string | null
          google_form_status: string | null
          google_form_url: string | null
          id: string
          is_sponsored: boolean | null
          is_visible: boolean | null
          logo_url: string | null
          new_price: number | null
          old_price: number | null
          price_on_request: boolean | null
          pricing_unit: string | null
          pricing_value: number | null
          request_demo_link: string | null
          show_pricing: boolean | null
          status: string | null
          sub_description: string | null
          subcategory_id: string | null
          subtitle: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          best_for_max?: number | null
          best_for_min?: number | null
          best_for_unit?: string | null
          brand_user_id: string
          category_id?: string | null
          category_label?: string | null
          company_name: string
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          currency?: string | null
          description: string
          discount_percent?: number | null
          display_order?: number | null
          free_trial_link?: string | null
          free_trial_text?: string | null
          google_form_status?: string | null
          google_form_url?: string | null
          id?: string
          is_sponsored?: boolean | null
          is_visible?: boolean | null
          logo_url?: string | null
          new_price?: number | null
          old_price?: number | null
          price_on_request?: boolean | null
          pricing_unit?: string | null
          pricing_value?: number | null
          request_demo_link?: string | null
          show_pricing?: boolean | null
          status?: string | null
          sub_description?: string | null
          subcategory_id?: string | null
          subtitle?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          best_for_max?: number | null
          best_for_min?: number | null
          best_for_unit?: string | null
          brand_user_id?: string
          category_id?: string | null
          category_label?: string | null
          company_name?: string
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          currency?: string | null
          description?: string
          discount_percent?: number | null
          display_order?: number | null
          free_trial_link?: string | null
          free_trial_text?: string | null
          google_form_status?: string | null
          google_form_url?: string | null
          id?: string
          is_sponsored?: boolean | null
          is_visible?: boolean | null
          logo_url?: string | null
          new_price?: number | null
          old_price?: number | null
          price_on_request?: boolean | null
          pricing_unit?: string | null
          pricing_value?: number | null
          request_demo_link?: string | null
          show_pricing?: boolean | null
          status?: string | null
          sub_description?: string | null
          subcategory_id?: string | null
          subtitle?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string | null
          id: string
          is_visible: boolean | null
          product_id: string
          rating: number
          review_text: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          product_id: string
          rating: number
          review_text?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          product_id?: string
          rating?: number
          review_text?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      section_ads: {
        Row: {
          ad_type: string
          alt_text: string | null
          category_id: string
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_visible: boolean | null
          link_url: string | null
        }
        Insert: {
          ad_type?: string
          alt_text?: string | null
          category_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_visible?: boolean | null
          link_url?: string | null
        }
        Update: {
          ad_type?: string
          alt_text?: string | null
          category_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_visible?: boolean | null
          link_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_ads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          created_at: string
          event_type: string
          id: string
          link_text: string | null
          link_url: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          link_text?: string | null
          link_url?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          link_text?: string | null
          link_url?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "brand" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "brand", "user"],
    },
  },
} as const
