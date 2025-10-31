export interface Course {
  id: number;
  logo: string;
  description: string;
  price: number;
  isNew: boolean;
  included: string[];
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCourseRequest {
  logo?: string;
  description: string;
  price: number;
  isNew?: boolean;
  included: string[];
  image?: string;
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  id: number;
}

export interface CourseFilters {
  minPrice?: number;
  maxPrice?: number;
  isNew?: boolean;
  search?: string;
}

export interface CourseResponse {
  success: boolean;
  message: string;
  course?: Course;
  courses?: Course[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: string;
}

export interface CourseDbRow {
  id: number;
  logo: string;
  description: string;
  price: string;
  is_new: boolean;
  included: string[];
  image: string;
  created_at: Date;
  updated_at: Date;
}
