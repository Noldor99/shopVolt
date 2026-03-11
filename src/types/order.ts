export type OrderStatus = 'PENDING' | 'SUCCEEDED' | 'CANCELLED';

export interface IOrderUser {
  id: number;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  provider: string | null;
  providerId: string | null;
  verified: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IOrder {
  id: number;
  userId: number | null;
  items: unknown;
  status: OrderStatus;
  totalAmount: number;
  paymentId: string | null;
  fullName: string;
  address: string;
  email: string;
  phone: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: IOrderUser | null;
}

export interface IOrdersMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IOrdersResponse {
  data: IOrder[];
  meta: IOrdersMeta;
}
