export interface Person {
  id: number
  firstName: string
  lastName: string
  houseNumber: string
  street: string | null
  subDistrict: string
  district: string
  province: string
  postalCode: string
  birthDate: string // "YYYY-MM-DD"
  createdAt: string
}

export interface CreatePersonInput {
  firstName: string
  lastName: string
  houseNumber: string
  street?: string
  subDistrict: string
  district: string
  province: string
  postalCode: string
  birthDate: string
}

export interface PageResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}
