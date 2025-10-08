// Shared types for the application

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_name: string
  supplier_contact?: string
  total_amount: number
  status: 'received' | 'cancelled'
  order_date: string
  expected_delivery_date?: string
  received_date?: string
  notes?: string
  created_by: string
  created_by_first_name: string
  created_by_last_name: string
  cancelled_by?: string
  cancelled_by_first_name?: string
  cancelled_by_last_name?: string
  cancelled_at?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  purchase_order_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: string
  has_po_reference?: boolean
  has_matching_date?: boolean
  validation_status?: string
  validation_notes?: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category_id: string
  supplier_id: string
  category?: string
  supplier?: string
  unit_price: number
  min_stock_level?: number
  is_active: boolean
  created_at: string
  updated_at: string
  total_stock?: number
  total_reserved?: number
  total_available?: number
}

export interface Category {
  id: string
  name: string
  description: string
  is_active: boolean
}

export interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Warehouse {
  id: string
  name: string
  location: string
  address?: string
  contact_person?: string
  contact_phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StockLevel {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  min_stock_level: number
  max_stock_level?: number
  last_updated: string
  product_name: string
  product_sku: string
  warehouse_name: string
}

export type SortField = 'name' | 'unit_price' | 'created_at'
export type SortOrder = 'asc' | 'desc'

// Form types
export interface SupplierFormData {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  is_active?: boolean
}

export interface WarehouseFormData {
  name: string
  location: string
  address?: string
  contact_person?: string
  contact_phone?: string
}

export interface ProductFormData {
  sku: string
  name: string
  description?: string
  category_id: string
  supplier_id: string
  unit_price: number
  min_stock_level: number
}
