import { sql } from "drizzle-orm";
import { text, sqliteTable, integer, real } from "drizzle-orm/sqlite-core";


//Products Table Schema
export const productsTable = sqliteTable('products',{
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    category: text('category').notNull(),
    price: real('price').notNull(),
    stock: integer('stock').notNull(),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

//Sales Table Schema
export const salesTable = sqliteTable('sales', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    product_id: integer('product_id')
        .notNull()
        .references(() => productsTable.id),
    quantity: integer('quantity').notNull(),
    total_amount: real('total_amount').notNull(),
    sale_date: text('sale_date').default(sql`CURRENT_TIMESTAMP`),
    customer_name: text('customer_name').notNull(),
    region: text('region').notNull(),
});