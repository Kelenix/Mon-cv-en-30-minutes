
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "acquisition_checkouts": {
                  Row: {
                    "channel": string,"created_at": string,"source": string,"stripe_checkout_session_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channel": string,"created_at"?: string,"source": string,"stripe_checkout_session_id": string
                  }
                  Update: {
                    "channel"?: string,"created_at"?: string,"source"?: string,"stripe_checkout_session_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"acquisition_counts": {
                  Row: {
                    "amount_cents": number,"channel": string,"count": number,"day": string,"event": string,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents"?: number,"channel": string,"count"?: number,"day": string,"event": string,"source": string
                  }
                  Update: {
                    "amount_cents"?: number,"channel"?: string,"count"?: number,"day"?: string,"event"?: string,"source"?: string
                  }
                  Relationships: [
                    
                  ]
                },"admin_audit_log": {
                  Row: {
                    "action": string,"admin_email": string,"created_at": string,"details": NonNullable<Json>,"id": number,"target_email": string | null,"target_user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"admin_email": string,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: never,"target_email"?: string | null,"target_user_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"admin_email"?: string,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: never,"target_email"?: string | null,"target_user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"ai_operations": {
                  Row: {
                    "cache_read_tokens": number | null,"cost_usd_micros": number | null,"created_at": string,"credits_charged": number,"duration_ms": number | null,"error_code": string | null,"finished_at": string | null,"id": string,"input_tokens": number | null,"ip_hash": string | null,"kind": Database["public"]['Enums']["ai_operation_kind"],"model": string | null,"output_tokens": number | null,"request_id": string,"status": Database["public"]['Enums']["ai_operation_status"],"user_id": string | null,"was_free": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "cache_read_tokens"?: number | null,"cost_usd_micros"?: number | null,"created_at"?: string,"credits_charged"?: number,"duration_ms"?: number | null,"error_code"?: string | null,"finished_at"?: string | null,"id"?: string,"input_tokens"?: number | null,"ip_hash"?: string | null,"kind": Database["public"]['Enums']["ai_operation_kind"],"model"?: string | null,"output_tokens"?: number | null,"request_id": string,"status"?: Database["public"]['Enums']["ai_operation_status"],"user_id"?: string | null,"was_free"?: boolean
                  }
                  Update: {
                    "cache_read_tokens"?: number | null,"cost_usd_micros"?: number | null,"created_at"?: string,"credits_charged"?: number,"duration_ms"?: number | null,"error_code"?: string | null,"finished_at"?: string | null,"id"?: string,"input_tokens"?: number | null,"ip_hash"?: string | null,"kind"?: Database["public"]['Enums']["ai_operation_kind"],"model"?: string | null,"output_tokens"?: number | null,"request_id"?: string,"status"?: Database["public"]['Enums']["ai_operation_status"],"user_id"?: string | null,"was_free"?: boolean
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
      foreignKeyName: "credit_ledger_purchase_fk"
      columns: ["purchase_id"]
isOneToOne: false
      referencedRelation: "purchases"
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
                },"cv_photos": {
                  Row: {
                    "cv_id": string,"image": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cv_id": string,"image": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cv_id"?: string,"image"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cv_photos_cv_id_fkey"
      columns: ["cv_id"]
isOneToOne: true
      referencedRelation: "cvs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cv_photos_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cvs": {
                  Row: {
                    "answers": NonNullable<Json>,"content": NonNullable<Json>,"created_at": string,"id": string,"language": Database["public"]['Enums']["app_locale"],"operation_id": string | null,"pro_unlocked_at": string | null,"target_country": string | null,"template": string,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers": NonNullable<Json>,"content": NonNullable<Json>,"created_at"?: string,"id"?: string,"language": Database["public"]['Enums']["app_locale"],"operation_id"?: string | null,"pro_unlocked_at"?: string | null,"target_country"?: string | null,"template"?: string,"title": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"language"?: Database["public"]['Enums']["app_locale"],"operation_id"?: string | null,"pro_unlocked_at"?: string | null,"target_country"?: string | null,"template"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cvs_operation_id_fkey"
      columns: ["operation_id"]
isOneToOne: true
      referencedRelation: "ai_operations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cvs_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"generations": {
                  Row: {
                    "created_at": string,"cv_id": string,"id": string,"input": NonNullable<Json>,"kind": Database["public"]['Enums']["generation_kind"],"language": Database["public"]['Enums']["app_locale"],"operation_id": string | null,"output": NonNullable<Json>,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"cv_id": string,"id"?: string,"input"?: NonNullable<Json>,"kind": Database["public"]['Enums']["generation_kind"],"language": Database["public"]['Enums']["app_locale"],"operation_id"?: string | null,"output": NonNullable<Json>,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"cv_id"?: string,"id"?: string,"input"?: NonNullable<Json>,"kind"?: Database["public"]['Enums']["generation_kind"],"language"?: Database["public"]['Enums']["app_locale"],"operation_id"?: string | null,"output"?: NonNullable<Json>,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "generations_cv_id_fkey"
      columns: ["cv_id"]
isOneToOne: false
      referencedRelation: "cvs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "generations_operation_id_fkey"
      columns: ["operation_id"]
isOneToOne: false
      referencedRelation: "ai_operations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "generations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"job_runs": {
                  Row: {
                    "details": NonNullable<Json>,"finished_at": string,"id": number,"job": string,"ok": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "details"?: NonNullable<Json>,"finished_at"?: string,"id"?: never,"job": string,"ok": boolean
                  }
                  Update: {
                    "details"?: NonNullable<Json>,"finished_at"?: string,"id"?: never,"job"?: string,"ok"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "ads_removed_at": string | null,"city": string | null,"created_at": string,"first_name": string | null,"first_sign_in_at": string | null,"free_generation_used_at": string | null,"free_letter_used_at": string | null,"id": string,"interstitial_shown_at": string | null,"last_name": string | null,"last_seen_at": string,"locale": Database["public"]['Enums']["app_locale"],"phone": string | null,"referral_code": string | null,"retention_warning_sent_at": string | null,"signup_country": string | null,"stripe_customer_id": string | null,"trial_used_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ads_removed_at"?: string | null,"city"?: string | null,"created_at"?: string,"first_name"?: string | null,"first_sign_in_at"?: string | null,"free_generation_used_at"?: string | null,"free_letter_used_at"?: string | null,"id": string,"interstitial_shown_at"?: string | null,"last_name"?: string | null,"last_seen_at"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"phone"?: string | null,"referral_code"?: string | null,"retention_warning_sent_at"?: string | null,"signup_country"?: string | null,"stripe_customer_id"?: string | null,"trial_used_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "ads_removed_at"?: string | null,"city"?: string | null,"created_at"?: string,"first_name"?: string | null,"first_sign_in_at"?: string | null,"free_generation_used_at"?: string | null,"free_letter_used_at"?: string | null,"id"?: string,"interstitial_shown_at"?: string | null,"last_name"?: string | null,"last_seen_at"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"phone"?: string | null,"referral_code"?: string | null,"retention_warning_sent_at"?: string | null,"signup_country"?: string | null,"stripe_customer_id"?: string | null,"trial_used_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"purchases": {
                  Row: {
                    "amount_cents": number,"created_at": string,"currency": string,"cv_id": string | null,"id": string,"payment_method": string | null,"product": Database["public"]['Enums']["purchase_product"],"stripe_checkout_session_id": string,"terms_accepted_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"created_at"?: string,"currency"?: string,"cv_id"?: string | null,"id"?: string,"payment_method"?: string | null,"product": Database["public"]['Enums']["purchase_product"],"stripe_checkout_session_id": string,"terms_accepted_at": string,"user_id"?: string | null
                  }
                  Update: {
                    "amount_cents"?: number,"created_at"?: string,"currency"?: string,"cv_id"?: string | null,"id"?: string,"payment_method"?: string | null,"product"?: Database["public"]['Enums']["purchase_product"],"stripe_checkout_session_id"?: string,"terms_accepted_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "purchases_cv_id_fkey"
      columns: ["cv_id"]
isOneToOne: false
      referencedRelation: "cvs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchases_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limit_events": {
                  Row: {
                    "created_at": string,"key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"key": string
                  }
                  Update: {
                    "created_at"?: string,"key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"referrals": {
                  Row: {
                    "created_at": string,"referee_id": string,"referrer_id": string,"referrer_rewarded": boolean,"rewarded_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"referee_id": string,"referrer_id": string,"referrer_rewarded"?: boolean,"rewarded_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"referee_id"?: string,"referrer_id"?: string,"referrer_rewarded"?: boolean,"rewarded_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "referrals_referee_id_fkey"
      columns: ["referee_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "referrals_referrer_id_fkey"
      columns: ["referrer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reward_tokens": {
                  Row: {
                    "created_at": string,"expires_at": string,"id": string,"redeemed_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"redeemed_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"redeemed_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reward_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"site_visits": {
                  Row: {
                    "channel": string,"country": string,"day": string,"source": string,"visits": number
                  }
                  ComputedFields: never
                  Insert: {
                    "channel": string,"country": string,"day": string,"source": string,"visits"?: number
                  }
                  Update: {
                    "channel"?: string,"country"?: string,"day"?: string,"source"?: string,"visits"?: number
                  }
                  Relationships: [
                    
                  ]
                },"stripe_events": {
                  Row: {
                    "created_at": string,"id": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"type": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"subscription_invoices": {
                  Row: {
                    "amount_cents": number,"billing_interval": Database["public"]['Enums']["billing_interval"] | null,"created_at": string,"currency": string,"id": string,"paid_at": string,"payment_method": string | null,"plan": Database["public"]['Enums']["plan_tier"] | null,"stripe_invoice_id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"billing_interval"?: Database["public"]['Enums']["billing_interval"] | null,"created_at"?: string,"currency"?: string,"id"?: string,"paid_at": string,"payment_method"?: string | null,"plan"?: Database["public"]['Enums']["plan_tier"] | null,"stripe_invoice_id": string,"user_id"?: string | null
                  }
                  Update: {
                    "amount_cents"?: number,"billing_interval"?: Database["public"]['Enums']["billing_interval"] | null,"created_at"?: string,"currency"?: string,"id"?: string,"paid_at"?: string,"payment_method"?: string | null,"plan"?: Database["public"]['Enums']["plan_tier"] | null,"stripe_invoice_id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscription_invoices_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "billing_interval": Database["public"]['Enums']["billing_interval"],"cancel_at_period_end": boolean,"created_at": string,"current_period_end": string,"id": string,"monthly_credits": number,"next_credit_grant_at": string | null,"payment_method": string | null,"plan": Database["public"]['Enums']["plan_tier"],"provider_subscription_id": string,"source": Database["public"]['Enums']["subscription_source"],"status": Database["public"]['Enums']["subscription_status"],"trial_ends_at": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billing_interval": Database["public"]['Enums']["billing_interval"],"cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end": string,"id"?: string,"monthly_credits": number,"next_credit_grant_at"?: string | null,"payment_method"?: string | null,"plan": Database["public"]['Enums']["plan_tier"],"provider_subscription_id": string,"source"?: Database["public"]['Enums']["subscription_source"],"status": Database["public"]['Enums']["subscription_status"],"trial_ends_at"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "billing_interval"?: Database["public"]['Enums']["billing_interval"],"cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end"?: string,"id"?: string,"monthly_credits"?: number,"next_credit_grant_at"?: string | null,"payment_method"?: string | null,"plan"?: Database["public"]['Enums']["plan_tier"],"provider_subscription_id"?: string,"source"?: Database["public"]['Enums']["subscription_source"],"status"?: Database["public"]['Enums']["subscription_status"],"trial_ends_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_acquisition":
{ Args: { "p_days": number }; Returns: {
              "channel": string,"cvs": number,"purchases": number,"revenue_cents": number,"signups": number,"source": string,"trials": number,"visits": number
            }[]
                           },
"admin_daily":
{ Args: { "p_days": number }; Returns: {
              "ai_cost_micros": number,"ai_failed": number,"ai_operations": number,"cvs": number,"day": string,"revenue_cents": number,"signups": number,"visits": number
            }[]
                           },
"admin_summary":
{ Args: { "p_days": number }; Returns: Json
                           },
"admin_system":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_user_detail":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"admin_users":
{ Args: { "p_limit": number,"p_offset": number,"p_plan": string,"p_search": string }; Returns: {
              "banned": boolean,"country": string,"created_at": string,"credits": number,"cvs": number,"email": string,"first_name": string,"id": string,"last_name": string,"last_seen_at": string,"locale": Database["public"]['Enums']["app_locale"],"plan": Database["public"]['Enums']["plan_tier"],"spent_cents": number,"subscription_status": Database["public"]['Enums']["subscription_status"],"total": number
            }[]
                           },
"attach_referral":
{ Args: { "p_code": string,"p_referee_id": string }; Returns: boolean
                           },
"begin_ai_operation":
{ Args: { "p_allow_included": boolean,"p_cost": number,"p_free_ip_limit": number,"p_ip_hash"?: string,"p_kind": Database["public"]['Enums']["ai_operation_kind"],"p_rate_limit": number,"p_request_id": string,"p_try_free": boolean,"p_user_id": string }; Returns: {
              "created": boolean,"operation_id": string,"status": Database["public"]['Enums']["ai_operation_status"],"was_free": boolean
            }[]
                           },
"claim_retention_warnings":
{ Args: { "p_limit"?: number }; Returns: {
              "email": string,"first_name": string,"locale": Database["public"]['Enums']["app_locale"],"user_id": string
            }[]
                           },
"complete_ai_operation":
{ Args: { "p_cache_read_tokens": number,"p_cost_usd_micros": number,"p_cv_id"?: string,"p_duration_ms": number,"p_input"?: Json,"p_input_tokens": number,"p_kind"?: Database["public"]['Enums']["generation_kind"],"p_language"?: Database["public"]['Enums']["app_locale"],"p_model": string,"p_operation_id": string,"p_output"?: Json,"p_output_tokens": number }; Returns: string
                           },
"complete_cv_generation":
{ Args: { "p_answers": Json,"p_cache_read_tokens": number,"p_content": Json,"p_cost_usd_micros": number,"p_cv_limit"?: number,"p_duration_ms": number,"p_input_tokens": number,"p_language": Database["public"]['Enums']["app_locale"],"p_model": string,"p_operation_id": string,"p_output_tokens": number,"p_replace_cv_id"?: string,"p_title": string }; Returns: string
                           },
"complete_interview_feedback":
{ Args: { "p_answers": Json,"p_cache_read_tokens": number,"p_cost_usd_micros": number,"p_duration_ms": number,"p_feedback": Json,"p_generation_id": string,"p_input_tokens": number,"p_model": string,"p_operation_id": string,"p_output_tokens": number }; Returns: undefined
                           },
"consume_rate_limit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"ensure_referral_code":
{ Args: { "p_user_id": string }; Returns: string
                           },
"fail_ai_operation":
{ Args: { "p_cache_read_tokens"?: number,"p_cost_usd_micros"?: number,"p_duration_ms"?: number,"p_error_code": string,"p_input_tokens"?: number,"p_model"?: string,"p_operation_id": string,"p_output_tokens"?: number }; Returns: number
                           },
"fulfill_purchase":
{ Args: { "p_amount_cents": number,"p_credits"?: number,"p_currency": string,"p_cv_id"?: string,"p_product": Database["public"]['Enums']["purchase_product"],"p_session_id": string,"p_terms_accepted_at": string,"p_user_id": string }; Returns: boolean
                           },
"grant_credits":
{ Args: { "p_amount": number,"p_bucket": Database["public"]['Enums']["credit_bucket"],"p_purchase_id"?: string,"p_reason": Database["public"]['Enums']["ledger_reason"],"p_user_id": string }; Returns: {
              "included_balance": number,"purchased_balance": number
            }[]
                           },
"issue_reward_token":
{ Args: { "p_daily_limit": number,"p_user_id": string }; Returns: string
                           },
"record_acquisition":
{ Args: { "p_amount_cents"?: number,"p_channel": string,"p_event": string,"p_source": string }; Returns: undefined
                           },
"record_acquisition_checkout":
{ Args: { "p_amount_cents": number,"p_session_id": string }; Returns: undefined
                           },
"record_visit":
{ Args: { "p_channel": string,"p_country": string,"p_source": string }; Returns: undefined
                           },
"redeem_reward_token":
{ Args: { "p_daily_limit": number,"p_token": string,"p_user_id": string }; Returns: number
                           },
"refund_operation":
{ Args: { "p_operation_id": string }; Returns: number
                           },
"retention_deletions_due":
{ Args: { "p_limit"?: number }; Returns: {
              "stripe_customer_id": string,"user_id": string
            }[]
                           },
"reward_referral":
{ Args: { "p_credits": number,"p_monthly_cap": number,"p_referee_id": string }; Returns: boolean
                           },
"rewarded_credits_today":
{ Args: { "p_user_id": string }; Returns: number
                           },
"run_daily_maintenance":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"run_monthly_grants":
{ Args: Record<PropertyKey, never>; Returns: number
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
"sync_subscription":
{ Args: { "p_cancel_at_period_end": boolean,"p_current_period_end": string,"p_interval": Database["public"]['Enums']["billing_interval"],"p_monthly_credits": number,"p_plan": Database["public"]['Enums']["plan_tier"],"p_provider_subscription_id": string,"p_status": Database["public"]['Enums']["subscription_status"],"p_trial_credits": number,"p_trial_ends_at"?: string,"p_user_id": string }; Returns: undefined
                           },
"touch_last_seen":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           }
          }
          Enums: {
            "ai_operation_kind": "generate_cv"|"improve_experience"|"improve_summary"|"adapt_to_job"|"linkedin"|"cover_letter"|"interview"|"interview_feedback","ai_operation_status": "pending"|"succeeded"|"failed","app_locale": "fr"|"en"|"it"|"es"|"de","billing_interval": "month"|"year","credit_bucket": "included"|"purchased","generation_kind": "summary_variants"|"job_adaptation"|"linkedin"|"cover_letter"|"interview","ledger_reason": "ai_operation"|"ai_refund"|"pack_purchase"|"rewarded_ad"|"trial_grant"|"monthly_grant"|"upgrade_grant"|"included_expiry"|"subscription_end"|"admin_grant"|"referral","plan_tier": "essential"|"pro"|"premium","purchase_product": "credits_5"|"credits_15"|"credits_40"|"cv_pro"|"ads_removal","subscription_source": "stripe"|"app_store"|"play_store","subscription_status": "trialing"|"active"|"past_due"|"unpaid"|"canceled"|"incomplete"|"incomplete_expired"|"paused"
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
            "ai_operation_kind": ["generate_cv", "improve_experience", "improve_summary", "adapt_to_job", "linkedin", "cover_letter", "interview", "interview_feedback"],"ai_operation_status": ["pending", "succeeded", "failed"],"app_locale": ["fr", "en", "it", "es", "de"],"billing_interval": ["month", "year"],"credit_bucket": ["included", "purchased"],"generation_kind": ["summary_variants", "job_adaptation", "linkedin", "cover_letter", "interview"],"ledger_reason": ["ai_operation", "ai_refund", "pack_purchase", "rewarded_ad", "trial_grant", "monthly_grant", "upgrade_grant", "included_expiry", "subscription_end", "admin_grant", "referral"],"plan_tier": ["essential", "pro", "premium"],"purchase_product": ["credits_5", "credits_15", "credits_40", "cv_pro", "ads_removal"],"subscription_source": ["stripe", "app_store", "play_store"],"subscription_status": ["trialing", "active", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "paused"]
          }
        }
} as const
