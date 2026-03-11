import { AxiosResponse } from 'axios';
import { z } from 'zod';

import { api } from '@/lib/axios';
import { PHONE_VALIDATION_MESSAGE, toE164PhoneOrNull } from '@/lib/phone';
import { IOrder, IOrdersResponse } from '@/types/order';

const OrderStatusSchema = z.enum(['PENDING', 'SUCCEEDED', 'CANCELLED']);
const DeliveryMethodSchema = z.enum(['COURIER', 'NOVA_POSHTA']);
const NovaPoshtaDeliveryTypeSchema = z.enum(['BRANCH', 'POSTOMAT', 'COURIER']);

export const OrderSchema = z.object({
  userId: z.number().int().positive().optional(),
  items: z.unknown().optional(),
  status: OrderStatusSchema.optional(),
  totalAmount: z.number().finite(),
  paymentId: z.string().min(1).optional(),
  fullName: z.string().min(1, 'Full name is required'),
  deliveryMethod: DeliveryMethodSchema.default('COURIER'),
  novaPoshtaDeliveryType: NovaPoshtaDeliveryTypeSchema.default('BRANCH'),
  address: z.string().optional(),
  novaPoshtaCityRef: z.string().optional(),
  novaPoshtaCityName: z.string().optional(),
  novaPoshtaWarehouseRef: z.string().optional(),
  novaPoshtaWarehouseName: z.string().optional(),
  email: z.string().email('Invalid email'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone is required')
    .refine((value) => Boolean(toE164PhoneOrNull(value)), PHONE_VALIDATION_MESSAGE)
    .transform((value) => toE164PhoneOrNull(value) || value),
  comment: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.deliveryMethod === 'COURIER') {
    if (!value.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Address is required',
        path: ['address'],
      });
    }
    return;
  }

  if (!value.novaPoshtaCityRef) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'City is required',
      path: ['novaPoshtaCityRef'],
    });
  }

  if (value.novaPoshtaDeliveryType === 'COURIER') {
    if (!value.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Address is required',
        path: ['address'],
      });
    }
  } else if (!value.novaPoshtaWarehouseRef) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Warehouse is required',
      path: ['novaPoshtaWarehouseRef'],
    });
  }
});

export type IOrderSchema = z.infer<typeof OrderSchema>;

export interface QueryOrderParams {
  page?: string | number;
  limit?: string | number;
}

export interface ApiOrder {
  create: (body: IOrderSchema) => Promise<IOrder>;
  getAll: (params?: QueryOrderParams) => Promise<IOrdersResponse>;
  getOne: (id: string | number) => Promise<IOrder>;
  update: (id: string | number, data: Partial<IOrderSchema>) => Promise<IOrder>;
  remove: (id: string | number) => Promise<{ message: string }>;
}

export const apiOrder: ApiOrder = {
  create: (body) => api.post('/orders', body).then(unwrapData),
  getAll: (params) => api.get('/orders', { params }).then(unwrapData),
  getOne: (id) => api.get(`/orders/${id}`).then(unwrapData),
  update: (id, body) => api.patch(`/orders/${id}`, body).then(unwrapData),
  remove: (id) => api.delete(`/orders/${id}`).then(unwrapData),
};

const unwrapData = <T>(response: AxiosResponse<T>): T => response.data;
