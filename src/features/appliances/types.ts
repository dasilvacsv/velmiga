export interface Appliance {
  id: string
  name: string
  model: string | null
  serialNumber: string | null
  brandId: string | null
  applianceTypeId: string | null
  createdAt: Date | null
  updatedAt: Date | null
  createdBy?: string | null
  updatedBy?: string | null
}

export interface CreateApplianceInput {
  name: string
  model?: string
  serialNumber?: string
  brandId: string
  applianceTypeId: string
}

export interface UpdateApplianceInput {
  id: string
  name?: string
  model?: string
  serialNumber?: string
  brandId?: string
  applianceTypeId?: string
} 