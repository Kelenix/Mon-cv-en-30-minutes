
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "ai_operations": {
                  Row: {
                    "cache_read_tokens": number | null,"cost_usd_micros": number | null,"created_at": string,"credits_charged": number,"duration_ms": number | null,"error_code": string | null,"finished_at": string | null,"id": string,"input_tokens": number | null,"ip_hash": string | null,"kind": Database["public"]['Enums']["ai_operation_kind"],"model": string | null,"output_tokens": number | null,"request_id": string,"status": Database["public"]['Enums']["ai_operation_status"],"user_id": string,"was_free": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "cache_read_tokens"?: number | null,"cost_usd_micros"?: number | null,"created_at"?: string,"credits_charged"?: number,"duration_ms"?: number | null,"error_code"?: string | null,"finished_at"?: string | null,"id"?: string,"input_tokens"?: number | null,"ip_hash"?: string | null,"kind": Database["public"]['Enums']["ai_operation_kind"],"model"?: string | null,"output_tokens"?: number | null,"request_id": string,"status"?: Database["public"]['Enums']["ai_operation_status"],"user_id": string,"was_free"?: boolean
                  }
                  Update: {
                    "cache_read_tokens"?: number | null,"cost_usd_micros"?: number | null,"created_at"?: string,"credits_charged"?: number,"duration_ms"?: number | null,"error_code"?: string | null,"finished_at"?: string | null,"id"?: string,"input_tokens"?: number | null,"ip_hash"?: string | null,"kind"?: Database["public"]['Enums']["ai_operation_kind"],"model"?: string | null,"output_tokens"?: number | null,"request_id"?: string,"status"?: Database["public"]['Enums']["ai_operation_status"],"user_id"?: string,"was_free"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_operations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"credit_ledger": {
                  Row: {
                    "bucket": Database["public"]['Enums']["credit_bucket"],"created_at": string,"delta": number,"id": number,"operation_id": string | null,"purchase_id": string | null,"reason": Database["public"]['Enums']["ledger_reason"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket": Database["public"]['Enums']["credit_bucket"],"created_at"?: string,"delta": number,"id"?: never,"operation_id"?: string | null,"purchase_id"?: string | null,"reason": Database["public"]['Enums']["ledger_reason"],"user_id": string
                  }
                  Update: {
                    "bucket"?: Database["public"]['Enums']["credit_bucket"],"created_at"?: string,"delta"?: number,"id"?: never,"operation_id"?: string | null,"purchase_id"?: string | null,"reason"?: Database["public"]['Enums']["ledger_reason"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "credit_ledger_operation_id_fkey"
      columns: ["operation_id"]
isOneToOne: false
      referencedRelation: "ai_operations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "credit_ledger_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"credit_wallets": {
                  Row: {
                    "created_at": string,"included_balance": number,"purchased_balance": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"included_balance"?: number,"purchased_balance"?: number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"included_balance"?: number,"purchased_balance"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "credit_wallets_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "ads_removed_at": string | null,"city": string | null,"created_at": string,"first_name": string | null,"free_generation_used_at": string | null,"id": string,"interstitial_shown_at": string | null,"last_name": string | null,"last_seen_at": string,"locale": Database["public"]['Enums']["app_locale"],"phone": string | null,"retention_warning_sent_at": string | null,"stripe_customer_id": string | null,"trial_used_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ads_removed_at"?: string | null,"city"?: string | null,"created_at"?: string,"first_name"?: string | null,"free_generation_used_at"?: string | null,"id": string,"interstitial_shown_at"?: string | null,"last_name"?: string | null,"last_seen_at"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"phone"?: string | null,"retention_warning_sent_at"?: string | null,"stripe_customer_id"?: string | null,"trial_used_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "ads_removed_at"?: string | null,"city"?: string | null,"created_at"?: string,"first_name"?: string | null,"free_generation_used_at"?: string | null,"id"?: string,"interstitial_shown_at"?: string | null,"last_name"?: string | null,"last_seen_at"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"phone"?: string | null,"retention_warning_sent_at"?: string | null,"stripe_customer_id"?: string | null,"trial_used_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "grant_credits":
{ Args: { "p_amount": number,"p_bucket": Database["public"]['Enums']["credit_bucket"],"p_purchase_id"?: string,"p_reason": Database["public"]['Enums']["ledger_reason"],"p_user_id": string }; Returns: {
              "included_balance": number,"purchased_balance": number
            }[]
                           },
"refund_operation":
{ Args: { "p_operation_id": string }; Returns: number
                           },
"set_included_credits":
{ Args: { "p_amount": number,"p_reason": Database["public"]['Enums']["ledger_reason"],"p_user_id": string }; Returns: {
              "included_balance": number,"purchased_balance": number
            }[]
                           },
"spend_credits":
{ Args: { "p_allow_included": boolean,"p_cost": number,"p_operation_id": string,"p_user_id": string }; Returns: {
              "included_balance": number,"purchased_balance": number
            }[]
                           },
"touch_last_seen":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           }
          }
          Enums: {
            "ai_operation_kind": "generate_cv"|"improve_experience"|"improve_summary"|"adapt_to_job"|"linkedin"|"cover_letter"|"interview"|"interview_feedback","ai_operation_status": "pending"|"succeeded"|"failed","app_locale": "fr"|"en"|"it"|"es"|"de","credit_bucket": "included"|"purchased","ledger_reason": "ai_operation"|"ai_refund"|"pack_purchase"|"rewarded_ad"|"trial_grant"|"monthly_grant"|"upgrade_grant"|"included_expiry"|"subscription_end"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "ai_operation_kind": ["generate_cv", "improve_experience", "improve_summary", "adapt_to_job", "linkedin", "cover_letter", "interview", "interview_feedback"],"ai_operation_status": ["pending", "succeeded", "failed"],"app_locale": ["fr", "en", "it", "es", "de"],"credit_bucket": ["included", "purchased"],"ledger_reason": ["ai_operation", "ai_refund", "pack_purchase", "rewarded_ad", "trial_grant", "monthly_grant", "upgrade_grant", "included_expiry", "subscription_end"]
          }
        }
} as const
