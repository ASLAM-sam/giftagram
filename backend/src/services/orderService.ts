import { CreateOrderInput, ProductRow, OrderRow, OrderItemRow } from '../types';
import { generateId, generateOrderNumber } from '../utils/ids';

export interface OrderCreationResult {
  id: string;
  orderNumber: string;
  subtotal: number;
  depositAmount: number;
  depositAmountPaise: number;
  remainingAmount: number;
  status: string;
  createdAt: string;
}

export const orderService = {
  /**
   * Creates an order with strict server-side price recalculation from Cloudflare D1
   */
  async createOrder(db: D1Database, input: CreateOrderInput): Promise<OrderCreationResult> {
    // 1. Extract product IDs and fetch authoritative product records from D1
    const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const placeholders = productIds.map(() => '?').join(',');

    const productsRes = await db
      .prepare(`SELECT * FROM products WHERE id IN (${placeholders}) AND active = 1`)
      .bind(...productIds)
      .all<ProductRow>();

    const productsMap = new Map<string, ProductRow>();
    (productsRes.results || []).forEach((p) => productsMap.set(p.id, p));

    // Verify all requested products exist and are active
    for (const item of input.items) {
      const product = productsMap.get(item.productId);
      if (!product) {
        throw new Error(`Product "${item.productId}" is not available or inactive.`);
      }
    }

    // 2. Authoritatively recalculate subtotal and line totals (NEVER TRUST CLIENT PRICES)
    let subtotal = 0;
    const itemsToInsert: {
      id: string;
      productId: string;
      nameSnapshot: string;
      unitPriceSnapshot: number;
      quantity: number;
      lineTotal: number;
      cakeCustomization?: any;
    }[] = [];

    for (const item of input.items) {
      const product = productsMap.get(item.productId)!;
      const unitPrice = product.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      itemsToInsert.push({
        id: generateId('item'),
        productId: product.id,
        nameSnapshot: product.name,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        lineTotal,
        cakeCustomization: item.cakeCustomization,
      });
    }

    // 50% non-refundable deposit calculation
    const depositAmount = Math.round(subtotal * 0.5 * 100) / 100;
    const depositAmountPaise = Math.round(depositAmount * 100);
    const remainingAmount = subtotal - depositAmount;

    // 3. Customer preparation
    const customerPhone = input.customer.phone.replace(/\D/g, '').slice(-10);
    let customerId: string = generateId('cust');

    const existingCustomer = await db
      .prepare('SELECT id FROM customers WHERE phone = ? LIMIT 1')
      .bind(customerPhone)
      .first<{ id: string }>();

    let shouldInsertCustomer = true;
    if (existingCustomer) {
      customerId = existingCustomer.id;
      shouldInsertCustomer = false;
    }

    // 4. Generate Order references
    const orderId = generateId('ord');
    const orderNumber = generateOrderNumber();
    const createdAt = new Date().toISOString();

    // 5. Build D1 batch transaction statements
    const batchStatements: D1PreparedStatement[] = [];

    if (shouldInsertCustomer) {
      batchStatements.push(
        db
          .prepare(
            'INSERT INTO customers (id, name, phone, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
          )
          .bind(
            customerId,
            input.customer.name,
            customerPhone,
            input.customer.email || null,
            createdAt,
            createdAt
          )
      );
    }

    // Order record
    batchStatements.push(
      db
        .prepare(
          `INSERT INTO orders (
            id, order_number, customer_id, status, subtotal, deposit_amount, remaining_amount,
            currency, pickup_date, pickup_time, customer_name, customer_phone, customer_email, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          orderId,
          orderNumber,
          customerId,
          'payment_pending',
          subtotal,
          depositAmount,
          remainingAmount,
          'INR',
          input.pickupDate,
          input.pickupTime,
          input.customer.name,
          customerPhone,
          input.customer.email || null,
          input.specialInstructions || null,
          createdAt,
          createdAt
        )
    );

    // Order items and Cake customizations
    for (const item of itemsToInsert) {
      batchStatements.push(
        db
          .prepare(
            `INSERT INTO order_items (
              id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            item.id,
            orderId,
            item.productId,
            item.nameSnapshot,
            item.unitPriceSnapshot,
            item.quantity,
            item.lineTotal,
            createdAt
          )
      );

      if (item.cakeCustomization) {
        const customId = generateId('custm');
        batchStatements.push(
          db
            .prepare(
              `INSERT INTO cake_customizations (
                id, order_item_id, full_name, phone, email, pickup_date, pickup_time,
                design_requirements, colors, lettering, additional_notes, deposit_acknowledged, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              customId,
              item.id,
              item.cakeCustomization.fullName,
              item.cakeCustomization.phone,
              item.cakeCustomization.email || null,
              item.cakeCustomization.pickupDate,
              item.cakeCustomization.pickupTime,
              item.cakeCustomization.designRequirements,
              item.cakeCustomization.colors || null,
              item.cakeCustomization.lettering || null,
              item.cakeCustomization.additionalNotes || null,
              item.cakeCustomization.depositAcknowledged ? 1 : 0,
              createdAt
            )
        );
      }
    }

    // Order audit event
    batchStatements.push(
      db
        .prepare(
          'INSERT INTO order_events (id, order_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(
          generateId('evt'),
          orderId,
          'order_created',
          JSON.stringify({ orderNumber, subtotal, depositAmount }),
          createdAt
        )
    );

    // Atomically execute all statements in a single D1 batch
    await db.batch(batchStatements);

    return {
      id: orderId,
      orderNumber,
      subtotal,
      depositAmount,
      depositAmountPaise,
      remainingAmount,
      status: 'payment_pending',
      createdAt,
    };
  },

  /**
   * Looks up an order by human-friendly orderNumber and contact phone
   */
  async lookupOrder(
    db: D1Database,
    orderNumber: string,
    phone: string
  ): Promise<any | null> {
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    const order = await db
      .prepare(
        `SELECT * FROM orders 
         WHERE (order_number = ? OR id = ?) 
         AND customer_phone = ? 
         LIMIT 1`
      )
      .bind(cleanOrderNumber, cleanOrderNumber, normalizedPhone)
      .first<OrderRow>();

    if (!order) return null;

    const itemsRes = await db
      .prepare(
        `SELECT product_name_snapshot as productName, quantity, unit_price_snapshot as unitPrice, line_total as lineTotal 
         FROM order_items 
         WHERE order_id = ?`
      )
      .bind(order.id)
      .all<any>();

    return {
      orderNumber: order.order_number,
      status: order.status,
      customerName: order.customer_name,
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      subtotal: order.subtotal,
      depositAmount: order.deposit_amount,
      remainingAmount: order.remaining_amount,
      items: itemsRes.results || [],
    };
  },
};
