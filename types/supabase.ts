export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          email: string
          display_name: string | null
          role: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email: string
          display_name?: string | null
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          display_name?: string | null
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      dealers: {
        Row: {
          id: string
          user_id: string
          name: string
          dealer_code: string
          salesman_id: string | null
          price_chart_id: string | null
          created_at: string
          updated_at: string
        }
      }
      price_charts: {
        Row: {
          id: string
          price_chart_code: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
      }
      price_chart_items: {
        Row: {
          id: string
          price_chart_id: string
          product_id: string
          price_per_unit: number
          currency: string
          effective_date: string
          expiry_date: string | null
          created_at: string
          updated_at: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string | null
          description: string | null
          unit: string
          created_at: string
          updated_at: string
        }
      }
      orders: {
        Row: {
          id: string
          dealer_id: string
          salesman_id: string | null
          product_id: string
          product_name: string
          unit: string
          quantity: number
          price_chart_id: string | null
          price_per_unit: number
          total_price: number
          status: 'processing' | 'completed' | 'canceled'
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}