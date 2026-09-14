import { CreateOrderInput } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateOrderInput(body: any): {
  valid: boolean;
  errors: ValidationError[];
  data?: CreateOrderInput;
} {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'Request payload must be a JSON object' }] };
  }

  // 1. Validate Customer
  if (!body.customer || typeof body.customer !== 'object') {
    errors.push({ field: 'customer', message: 'Customer information is required' });
  } else {
    const name = String(body.customer.name || '').trim();
    if (!name || name.length < 2) {
      errors.push({ field: 'customer.name', message: 'Full name must be at least 2 characters' });
    }

    const rawPhone = String(body.customer.phone || '').replace(/\D/g, '');
    if (rawPhone.length < 10) {
      errors.push({ field: 'customer.phone', message: 'Valid 10-digit phone number is required' });
    }

    if (body.customer.email) {
      const email = String(body.customer.email).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ field: 'customer.email', message: 'Invalid email address format' });
      }
    }
  }

  // 2. Validate Fulfillment: Delivery Address or Studio Pickup
  const fulfillmentType: 'delivery' | 'pickup' =
    body.fulfillmentType === 'pickup' || (!body.fulfillmentType && body.pickupDate && !body.deliveryAddress)
      ? 'pickup'
      : 'delivery';

  let validatedDeliveryAddress: CreateOrderInput['deliveryAddress'];
  let pickupDate = String(body.pickupDate || '').trim();
  let pickupTime = String(body.pickupTime || '').trim();

  if (fulfillmentType === 'delivery') {
    const addr = body.deliveryAddress;
    if (!addr || typeof addr !== 'object') {
      errors.push({ field: 'deliveryAddress', message: 'Delivery address is required for doorstep delivery' });
    } else {
      const line1 = String(addr.addressLine1 || '').trim();
      if (!line1 || line1.length < 3) {
        errors.push({ field: 'deliveryAddress.addressLine1', message: 'Address line 1 (house/flat/building/street) is required' });
      }

      const locality = String(addr.locality || '').trim();
      if (!locality || locality.length < 2) {
        errors.push({ field: 'deliveryAddress.locality', message: 'Locality or area is required' });
      }

      const city = String(addr.city || '').trim();
      if (!city || city.length < 2) {
        errors.push({ field: 'deliveryAddress.city', message: 'City is required' });
      }

      const state = String(addr.state || '').trim();
      if (!state || state.length < 2) {
        errors.push({ field: 'deliveryAddress.state', message: 'State is required' });
      }

      const rawPincode = String(addr.pincode || '').trim();
      if (!/^\d{6}$/.test(rawPincode)) {
        errors.push({ field: 'deliveryAddress.pincode', message: 'Valid 6-digit Indian PIN code is required' });
      }

      const deliveryDate = String(addr.deliveryDate || body.deliveryDate || body.pickupDate || '').trim();
      if (!deliveryDate) {
        errors.push({ field: 'deliveryAddress.deliveryDate', message: 'Delivery date is required' });
      }

      const deliveryTime = String(addr.deliveryTime || body.deliveryTime || body.pickupTime || '').trim();
      if (!deliveryTime) {
        errors.push({ field: 'deliveryAddress.deliveryTime', message: 'Preferred delivery time slot is required' });
      }

      if (errors.length === 0) {
        validatedDeliveryAddress = {
          addressLine1: line1,
          addressLine2: addr.addressLine2 ? String(addr.addressLine2).trim() : undefined,
          locality,
          city,
          state,
          pincode: rawPincode,
          deliveryDate,
          deliveryTime,
        };
        // Normalize pickupDate / pickupTime for internal scheduling and notifications
        pickupDate = deliveryDate;
        pickupTime = deliveryTime;
      }
    }
  } else {
    // Pickup mode validation
    if (!pickupDate) {
      errors.push({ field: 'pickupDate', message: 'Pickup date is required' });
    }
    if (!pickupTime) {
      errors.push({ field: 'pickupTime', message: 'Pickup time window is required' });
    }
  }

  // 3. Validate Items
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'Order must contain at least one item' });
  } else {
    body.items.forEach((item: any, index: number) => {
      if (!item || typeof item !== 'object') {
        errors.push({ field: `items[${index}]`, message: 'Item must be an object' });
        return;
      }

      if (!item.productId || typeof item.productId !== 'string') {
        errors.push({ field: `items[${index}].productId`, message: 'Product ID is required' });
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        errors.push({ field: `items[${index}].quantity`, message: 'Quantity must be an integer between 1 and 50' });
      }

      // Check cake customization if provided
      if (item.cakeCustomization) {
        const c = item.cakeCustomization;
        if (!c.depositAcknowledged) {
          errors.push({
            field: `items[${index}].cakeCustomization.depositAcknowledged`,
            message: 'You must acknowledge the 50% non-refundable deposit to confirm this order',
          });
        }
        if (!c.designRequirements || String(c.designRequirements).trim() === '') {
          errors.push({
            field: `items[${index}].cakeCustomization.designRequirements`,
            message: 'Cake design requirements are mandatory for custom cakes',
          });
        }
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalizedPhone = String(body.customer.phone).replace(/\D/g, '').slice(-10);

  return {
    valid: true,
    errors: [],
    data: {
      customer: {
        name: String(body.customer.name).trim(),
        phone: normalizedPhone,
        email: body.customer.email ? String(body.customer.email).trim() : undefined,
      },
      fulfillmentType,
      deliveryAddress: validatedDeliveryAddress,
      pickupDate,
      pickupTime,
      specialInstructions: body.specialInstructions
        ? String(body.specialInstructions).trim()
        : (body.deliveryAddress && body.deliveryAddress.instructions)
        ? String(body.deliveryAddress.instructions).trim()
        : body.notes
        ? String(body.notes).trim()
        : undefined,
      items: body.items.map((i: any) => ({
        productId: String(i.productId).trim(),
        quantity: Math.floor(Number(i.quantity)),
        cakeCustomization: i.cakeCustomization
          ? {
              fullName: String(i.cakeCustomization.fullName || body.customer.name).trim(),
              phone: String(i.cakeCustomization.phone || normalizedPhone).replace(/\D/g, '').slice(-10),
              email: i.cakeCustomization.email ? String(i.cakeCustomization.email).trim() : undefined,
              pickupDate: String(i.cakeCustomization.pickupDate || pickupDate).trim(),
              pickupTime: String(i.cakeCustomization.pickupTime || pickupTime).trim(),
              designRequirements: String(i.cakeCustomization.designRequirements || '').trim(),
              colors: i.cakeCustomization.colors ? String(i.cakeCustomization.colors).trim() : undefined,
              lettering: i.cakeCustomization.lettering ? String(i.cakeCustomization.lettering).trim() : undefined,
              additionalNotes: i.cakeCustomization.additionalNotes ? String(i.cakeCustomization.additionalNotes).trim() : undefined,
              depositAcknowledged: Boolean(i.cakeCustomization.depositAcknowledged),
            }
          : undefined,
      })),
    },
  };
}
