export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}