export interface Brand {
  id: string
  name: string
  createdAt: Date | null
  updatedAt: Date | null
  createdBy?: string | null
  updatedBy?: string | null
}

export interface CreateBrandInput {
  name: string
}

export interface UpdateBrandInput {
  id: string
  name: string
} 