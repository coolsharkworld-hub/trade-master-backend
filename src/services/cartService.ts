// src/services/cartService.ts
import { Pool } from 'pg';
import { CartItem, CartItemDbRow, CartSummary } from '../types/cart';

export class CartService {
  private db: Pool;

  constructor(database: Pool) {
    this.db = database;
  }

  async addToCart(userId: number, courseId: number): Promise<CartItem> {
    const client = await this.db.connect();

    try {
      // Check if item is already in cart
      const existingItem = await client.query(
        'SELECT id FROM cart_items WHERE user_id = $1 AND course_id = $2',
        [userId, courseId],
      );

      if (existingItem.rows.length > 0) {
        if (existingItem.rows[0].bought)
          throw new Error('You already bought it')
        else
          throw new Error('Course already in Cart')
      }

      // Add to cart
      const result = await client.query(
        `INSERT INTO cart_items (user_id, course_id)
               VALUES ($1, $2)
               RETURNING id, user_id, course_id, bought, added_at`,
        [userId, courseId],
      );

      // Get the cart item with course details
      const cartItemResult = await client.query(
        `SELECT 
                  ci.id,
                  ci.user_id,
                  ci.course_id,
                  ci.bought,
                  ci.added_at
               FROM cart_items ci
               WHERE ci.id = $1`,
        [result.rows[0].id],
      );

      return this.mapRowToCartItem(cartItemResult.rows[0]);
    } finally {
      client.release();
    }
  }

  async removeFromCart(userId: number, courseId: number): Promise<boolean> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND course_id = $2 AND bought = false',
        [userId, courseId],
      );

      return result.rowCount != null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async getItems(userId: number, bought: boolean): Promise<CartItem[]> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        `SELECT 
                  ci.id,
                  ci.user_id,
                  ci.course_id,
                  ci.added_at
               FROM cart_items ci
               WHERE ci.user_id = $1 AND ci.bought = $2
               ORDER BY ci.added_at DESC`,
        [userId, bought],
      );

      return result.rows.map((row) => this.mapRowToCartItem(row));
    } finally {
      client.release();
    }
  }

  async clearCart(userId: number, bought: boolean): Promise<boolean> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        bought ? 'UPDATE cart_items SET bought = true WHERE user_id = $1' : 'DELETE FROM cart_items WHERE user_id = $1 and bought = false',
        [userId],
      );

      return result.rowCount != null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async getCartItemCount(userId: number): Promise<number> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM cart_items WHERE user_id = $1 AND bought = false',
        [userId],
      );

      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async isInCart(userId: number, courseId: number): Promise<boolean> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        'SELECT id FROM cart_items WHERE user_id = $1 AND course_id = $2 AND bought = false',
        [userId, courseId],
      );

      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  async getCartItem(
    userId: number,
    courseId: number,
  ): Promise<CartItem | null> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        `SELECT 
                  ci.id,
                  ci.user_id,
                  ci.course_id,
                  ci.added_at
               FROM cart_items ci
               WHERE ci.user_id = $1 AND ci.course_id = $2 AND ci.bought = false`,
        [userId, courseId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToCartItem(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async moveToWishlist(userId: number, courseId: number): Promise<boolean> {
    // This would require a wishlist table - placeholder for future implementation
    const client = await this.db.connect();

    try {
      // For now, just remove from cart
      // In a full implementation, you'd move it to a wishlist table
      const result = await client.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND course_id = $2',
        [userId, courseId],
      );

      return result.rowCount != null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async getRecentlyAddedItems(
    userId: number,
    limit: number = 5,
  ): Promise<CartItem[]> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        `SELECT 
                  ci.id,
                  ci.user_id,
                  ci.course_id,
                  ci.added_at
               FROM cart_items ci
               WHERE ci.user_id = $1 AND ci.bought = false
               ORDER BY ci.added_at DESC
               LIMIT $2`,
        [userId, limit],
      );

      return result.rows.map((row) => this.mapRowToCartItem(row));
    } finally {
      client.release();
    }
  }

  private mapRowToCartItem(row: CartItemDbRow): CartItem {
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      addedAt: row.added_at
    };
  }
}
