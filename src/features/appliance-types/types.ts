export interface ApplianceType {
  id: string
  name: string
  createdAt: Date | null
  updatedAt: Date | null
  createdBy?: string | null
  updatedBy?: string | null
}

export interface CreateApplianceTypeInput {
  name: string
}

export interface UpdateApplianceTypeInput {
  id: string
  name: string
} 