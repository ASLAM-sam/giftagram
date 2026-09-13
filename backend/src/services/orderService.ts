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

  /**
   * Retrieves orders for the admin management view with optional search and status filtering.
   */
  async getAdminOrders(
    db: D1Database,
    filters?: { status?: string; search?: string; limit?: number; offset?: number }
  ): Promise<any[]> {
    let query = `
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'all') {
      query += ` AND o.status = ?`;
      params.push(filters.status.trim());
    }

    if (filters?.search && filters.search.trim()) {
      const s = `%${filters.search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(o.order_number) LIKE ? OR LOWER(o.customer_name) LIKE ? OR o.customer_phone LIKE ?)`;
      params.push(s, s, s);
    }

    query += ` ORDER BY o.created_at DESC`;

    const limit = filters?.limit ? Math.min(filters.limit, 100) : 50;
    const offset = filters?.offset ? Math.max(filters.offset, 0) : 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query).bind(...params);
    const result = await stmt.all<any>();
    const rows = result.results || [];

    return rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email || undefined,
      status: r.status,
      subtotal: r.subtotal,
      depositAmount: r.deposit_amount,
      remainingAmount: r.remaining_amount,
      currency: r.currency || 'INR',
      pickupDate: r.pickup_date || undefined,
      pickupTime: r.pickup_time || undefined,
      notes: r.notes || undefined,
      itemsCount: r.items_count || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  /**
   * Retrieves full order dossier for admin review: items, cake customizations, payment records, and audit events.
   */
  async getAdminOrderById(db: D1Database, idOrOrderNumber: string): Promise<any | null> {
    const cleanId = idOrOrderNumber.trim();
    const order = await db
      .prepare('SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1')
      .bind(cleanId, cleanId)
      .first<OrderRow>();

    if (!order) return null;

    // 1. Fetch Order Items
    const itemsResult = await db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC')
      .bind(order.id)
      .all<OrderItemRow>();
    const rawItems = itemsResult.results || [];

    // 2. Fetch Cake Customizations for items
    const itemIds = rawItems.map((i) => i.id);
    let customizationsMap = new Map<string, any>();
    if (itemIds.length > 0) {
      const placeholders = itemIds.map(() => '?').join(',');
      const customRes = await db
        .prepare(`SELECT * FROM cake_customizations WHERE order_item_id IN (${placeholders})`)
        .bind(...itemIds)
        .all<any>();
      (customRes.results || []).forEach((c) => customizationsMap.set(c.order_item_id, c));
    }

    const items = rawItems.map((item) => {
      const custom = customizationsMap.get(item.id);
      return {
        id: item.id,
        productId: item.product_id,
        productNameSnapshot: item.product_name_snapshot,
        unitPriceSnapshot: item.unit_price_snapshot,
        quantity: item.quantity,
        lineTotal: item.line_total,
        cakeCustomization: custom
          ? {
              id: custom.id,
              fullName: custom.full_name,
              phone: custom.phone,
              email: custom.email || undefined,
              pickupDate: custom.pickup_date,
              pickupTime: custom.pickup_time,
              designRequirements: custom.design_requirements,
              colors: custom.colors || undefined,
              lettering: custom.lettering || undefined,
              additionalNotes: custom.additional_notes || undefined,
              depositAcknowledged: custom.deposit_acknowledged === 1,
            }
          : null,
      };
    });

    // 3. Fetch Payments (safely sanitized without secrets)
    const paymentsRes = await db
      .prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at ASC')
      .bind(order.id)
      .all<any>();
    const payments = (paymentsRes.results || []).map((p) => ({
      id: p.id,
      amount: p.amount,
      amountRupees: p.amount / 100,
      currency: p.currency,
      status: p.status,
      provider: p.provider || 'razorpay',
      providerOrderId: p.provider_order_id,
      providerPaymentId: p.provider_payment_id || undefined,
      createdAt: p.created_at,
    }));

    // 4. Fetch Order Events / Audit Log
    const eventsRes = await db
      .prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC')
      .bind(order.id)
      .all<any>();
    const events = (eventsRes.results || []).map((e) => {
      let payload = null;
      try {
        payload = e.payload_json ? JSON.parse(e.payload_json) : null;
      } catch {
        payload = e.payload_json;
      }
      return {
        id: e.id,
        eventType: e.event_type,
        payload,
        createdAt: e.created_at,
      };
    });

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email || undefined,
      status: order.status,
      subtotal: order.subtotal,
      depositAmount: order.deposit_amount,
      remainingAmount: order.remaining_amount,
      currency: order.currency || 'INR',
      pickupDate: order.pickup_date || undefined,
      pickupTime: order.pickup_time || undefined,
      notes: order.notes || undefined,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items,
      payments,
      events,
    };
  },

  /**
   * Updates an order's status following strict business state machine transitions and audit logging.
   */
  async updateOrderStatus(
    db: D1Database,
    idOrOrderNumber: string,
    newStatus: string,
    reason?: string
  ): Promise<any> {
    const cleanStatus = newStatus.trim().toLowerCase();
    const VALID_STATUSES = new Set([
      'payment_pending',
      'deposit_paid',
      'confirmed',
      'processing',
      'ready',
      'completed',
      'cancelled',
    ]);

    if (!VALID_STATUSES.has(cleanStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${Array.from(VALID_STATUSES).join(', ')}`);
    }

    const cleanId = idOrOrderNumber.trim();
    const order = await db
      .prepare('SELECT id, status, order_number FROM orders WHERE id = ? OR order_number = ? LIMIT 1')
      .bind(cleanId, cleanId)
      .first<{ id: string; status: string; order_number: string }>();

    if (!order) {
      throw new Error(`Order "${idOrOrderNumber}" not found.`);
    }

    const currentStatus = order.status;
    if (currentStatus === cleanStatus) {
      // Idempotent: status already matches
      return this.getAdminOrderById(db, order.id);
    }

    const VALID_TRANSITIONS: Record<string, string[]> = {
      payment_pending: ['cancelled'],
      deposit_paid: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['ready', 'cancelled'],
      ready: ['completed'],
      completed: [], // terminal
      cancelled: [], // terminal
    };

    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(cleanStatus)) {
      throw new Error(
        `Cannot transition order from "${currentStatus}" to "${cleanStatus}". Allowed transitions: ${
          allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'
        }.`
      );
    }

    const now = new Date().toISOString();
    const eventId = generateId('evt');

    await db.batch([
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind(cleanStatus, now, order.id),
      db
        .prepare(
          'INSERT INTO order_events (id, order_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(
          eventId,
          order.id,
          'status_changed',
          JSON.stringify({
            from: currentStatus,
            to: cleanStatus,
            reason: reason || null,
            transitionTimestamp: now,
          }),
          now
        ),
    ]);

    return this.getAdminOrderById(db, order.id);
  },
};
