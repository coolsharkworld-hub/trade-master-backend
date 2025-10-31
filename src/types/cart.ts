export interface CartItem {
  id: number;
  courseId: number;
  userId: number;
  addedAt: Date;
}

export interface Cart {
  userId: number;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  updatedAt: Date;
}

export interface CartSummary {
  itemCount: number;
  totalPrice: number;
  averagePrice: number;
  newCoursesCount: number;
}

export interface AddToCartRequest {
  courseId: number;
}

export interface RemoveFromCartRequest {
  courseId: number;
}

export interface CartResponse {
  success: boolean;
  message: string;
  cart?: Cart;
  error?: string;
}

export interface CartItemDbRow {
  id: number;
  user_id: number;
  course_id: number;
  added_at: Date;
  logo: string;
  description: string;
  price: string;
  is_new: boolean;
  included: string[];
  image: string;
  created_at?: Date;
  updated_at?: Date;
}
