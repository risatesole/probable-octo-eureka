import { NextRequest, NextResponse } from 'next/server';
import type { AddProductToCartResponse } from '@/features/cart/types/AddProductToCartResponse';
import type { GetCartResponse } from '@/features/cart/types/GetCartResponse';

const DJANGO_BASE = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${DJANGO_BASE}/api/v1/cart/`, {
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch cart', data: null },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform Django response to frontend format
    const transformedData: GetCartResponse = {
      status: data.status,
      data: {
        items: data.data.items.map((item: any) => ({
          id: item.id,
          product: {
            id: item.id,
            name: item.name,
            description: item.description,
            selling_price: item.selling_price,
            slug: item.slug,
            images: item.thumbnail ? [{ type: 'THUMBNAIL', url: item.thumbnail }] : [],
          },
          quantity: item.quantity,
          tax_rate: item.tax_rate,
        })),
      },
    };

    return NextResponse.json(transformedData, { status: 200 });
  } catch (error) {
    console.error('GET cart error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch cart', data: null },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, productvariantid, quantity = 1 } = body;

    // Accept both product_id and productvariantid
    const variantId = productvariantid || product_id;

    if (!variantId) {
      return NextResponse.json(
        { status: 'error', message: 'productvariantid or product_id is required', data: null },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { status: 'error', message: 'quantity must be a positive integer', data: null },
        { status: 400 }
      );
    }

    const response = await fetch(`${DJANGO_BASE}/api/v1/cart/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({
        productvariantid: variantId,
        quantity,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          status: 'error',
          message: errorData.message || `Failed to add item to cart (${response.status})`,
          data: null,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('POST cart error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to add item to cart', data: null },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, productvariantid, quantity } = body;

    // Accept both product_id and productvariantid
    const variantId = productvariantid || product_id;

    if (!variantId) {
      return NextResponse.json(
        { status: 'error', message: 'productvariantid or product_id is required', data: null },
        { status: 400 }
      );
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { status: 'error', message: 'quantity is required', data: null },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { status: 'error', message: 'quantity must be a valid integer', data: null },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { status: 'error', message: 'quantity must be greater than 0', data: null },
        { status: 400 }
      );
    }

    const response = await fetch(`${DJANGO_BASE}/api/v1/cart/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({
        productvariantid: variantId,
        quantity,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          status: 'error',
          message: errorData.message || `Failed to update cart (${response.status})`,
          data: null,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('PATCH cart error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to update cart item', data: null },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, productvariantid, quantity = 1 } = body;

    // Accept both product_id and productvariantid
    const variantId = productvariantid || product_id;

    if (!variantId) {
      return NextResponse.json(
        { status: 'error', message: 'productvariantid or product_id is required', data: null },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { status: 'error', message: 'quantity must be a positive integer', data: null },
        { status: 400 }
      );
    }

    const response = await fetch(`${DJANGO_BASE}/api/v1/cart/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({
        productvariantid: variantId,
        quantity,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          status: 'error',
          message: errorData.message || `Failed to remove item (${response.status})`,
          data: null,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('DELETE cart error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to remove cart item', data: null },
      { status: 500 }
    );
  }
}
