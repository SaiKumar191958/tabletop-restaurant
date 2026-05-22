import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import api from "./api";

const API_ROOT =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:8000";
const MEDIA_BASE = API_ROOT;

export interface Category {
  id: number;
  name: string;
  image?: string | null;
}

export interface FoodItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  food_type: "veg" | "nonveg";
  is_available: boolean;
  rating: number;
  category_id: number;
  category?: Category;
  default_stock: number;
  current_stock: number;
}

export interface OrderItem {
  id?: number;
  quantity: number;
  price: number;
  food_item?: FoodItem;
}

export type PaymentMethod = "cod" | "upi" | "card";
export type PaymentStatus = "unpaid" | "paid" | "failed";

export interface RestaurantConfig {
  name: string;
  packing_charge: number;
  gst_percentage: number;
  delivery_charge_info: string;
  bulk_order_info: string;
  is_open: boolean;
  opening_time?: string;
  closing_time?: string;
  weekday_timing?: Record<string, { open: string; close: string }>;
}

export interface Order {
  id: number;
  status: string;
  total_price: number;
  packing_charge: number;
  gst_amount: number;
  delivery_charge: number;
  created_at: string;
  address: string;
  phone: string;
  items?: OrderItem[];
  user?: { id?: number; username: string; email?: string };
  device_id?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  payment_provider?: string;
  payment_reference?: string;
  paid_at?: string | null;
}

export interface PaymentConfig {
  mode: string;
  provider: string;
  currency: string;
  message: string;
  methods: { id: PaymentMethod; label: string; enabled: boolean }[];
  demo_fail_card?: string;
}

export interface Address {
  id: number;
  address_type: 'home' | 'work' | 'other';
  address_line: string;
  is_default: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  phone?: string;
  createdAt?: string;
  addresses?: Address[];
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_users: number;
  total_menu_items: number;
  orders_by_status: { status: string; count: number }[];
  recent_orders: Order[];
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  total_pages: number;
  current_page: number;
  links: {
    next: string | null;
    previous: string | null;
  };
}

export interface ListMenuItemsParams {
  category_id?: number;
  food_type?: "veg" | "nonveg";
  max_price?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ExternalFoodResult {
  source: string;
  external_id: string;
  name: string;
  description: string;
  image_url: string;
  suggested_category: string;
  meal_category: string;
  food_type: "veg" | "nonveg";
}

function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${MEDIA_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeCategory(raw: Record<string, unknown>): Category {
  return {
    id: Number(raw.id),
    name: String(raw.name),
    image: mediaUrl(raw.image as string | null) ?? null,
  };
}

function normalizeFoodItem(raw: Record<string, unknown>): FoodItem {
  const categoryId =
    raw.category_id ??
    (typeof raw.category === "number" ? raw.category : (raw.category as Record<string, unknown>)?.id);

  const category =
    raw.category && typeof raw.category === "object"
      ? normalizeCategory(raw.category as Record<string, unknown>)
      : raw.category_name
        ? { id: Number(categoryId), name: String(raw.category_name), image: null }
        : undefined;

  return {
    id: Number(raw.id),
    name: String(raw.name),
    description: (raw.description as string) ?? null,
    price: Number(raw.price),
    image: mediaUrl(raw.image as string | null) ?? null,
    food_type: raw.food_type as "veg" | "nonveg",
    is_available: Boolean(raw.is_available),
    rating: Number(raw.rating ?? 0),
    category_id: Number(categoryId),
    category,
    default_stock: Number(raw.default_stock ?? 0),
    current_stock: Number(raw.current_stock ?? 0),
  };
}

function normalizeOrderItem(raw: Record<string, unknown>): OrderItem {
  const foodItemRaw = (raw.food_item ?? raw.food_item_details) as Record<string, unknown> | undefined;
  return {
    id: raw.id != null ? Number(raw.id) : undefined,
    quantity: Number(raw.quantity),
    price: Number(raw.price),
    food_item: foodItemRaw ? normalizeFoodItem(foodItemRaw) : undefined,
  };
}

function normalizeOrder(raw: Record<string, unknown>): Order {
  const userRaw = raw.user as Record<string, unknown> | undefined;
  return {
    id: Number(raw.id),
    status: String(raw.status),
    total_price: Number(raw.total_price),
    packing_charge: Number(raw.packing_charge ?? 0),
    gst_amount: Number(raw.gst_amount ?? 0),
    delivery_charge: Number(raw.delivery_charge ?? 0),
    created_at: String(raw.created_at),
    address: String(raw.address),
    phone: String(raw.phone ?? ""),
    payment_method: raw.payment_method as PaymentMethod | undefined,
    payment_status: raw.payment_status as PaymentStatus | undefined,
    payment_provider: raw.payment_provider ? String(raw.payment_provider) : undefined,
    payment_reference: raw.payment_reference ? String(raw.payment_reference) : undefined,
    paid_at: raw.paid_at ? String(raw.paid_at) : null,
    items: Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[]).map(normalizeOrderItem)
      : [],
    user: userRaw
      ? { id: Number(userRaw.id), username: String(userRaw.username), email: String(userRaw.email ?? "") }
      : raw.user_name
        ? { username: String(raw.user_name) }
        : undefined,
  };
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: Number(raw.id),
    username: String(raw.username),
    email: String(raw.email ?? ""),
    role: String(raw.role),
    phone: raw.phone ? String(raw.phone) : undefined,
    createdAt: raw.createdAt
      ? String(raw.createdAt)
      : raw.date_joined
        ? String(raw.date_joined)
        : undefined,
    addresses: Array.isArray(raw.addresses)
      ? (raw.addresses as Record<string, unknown>[]).map((addr) => ({
          id: Number(addr.id),
          address_type: addr.address_type as any,
          address_line: String(addr.address_line),
          is_default: Boolean(addr.is_default),
        }))
      : [],
  };
}

function normalizeRestaurantConfig(raw: Record<string, unknown>): RestaurantConfig {
  return {
    name: String(raw.name),
    packing_charge: Number(raw.packing_charge ?? 0),
    gst_percentage: Number(raw.gst_percentage ?? 5.00),
    delivery_charge_info: String(raw.delivery_charge_info ?? ""),
    bulk_order_info: String(raw.bulk_order_info ?? ""),
    is_open: Boolean(raw.is_open ?? true),
    opening_time: raw.opening_time ? String(raw.opening_time) : undefined,
    closing_time: raw.closing_time ? String(raw.closing_time) : undefined,
    weekday_timing: raw.weekday_timing as Record<string, { open: string; close: string }> | undefined,
  };
}

// ——— Query keys ———

export const getListCategoriesQueryKey = () => ["categories"] as const;

export const getListMenuItemsQueryKey = (params?: ListMenuItemsParams) =>
  ["menu", params ?? {}] as const;

export const getListMyOrdersQueryKey = (deviceId?: string) => ["orders", "mine", deviceId ?? "auth"] as const;

export const getListAllOrdersQueryKey = () => ["orders", "all"] as const;

export const getListUsersQueryKey = () => ["admin", "users"] as const;

export const getDashboardStatsQueryKey = () => ["admin", "dashboard"] as const;

export const getPaymentConfigQueryKey = () => ["payments", "config"] as const;

export const getRestaurantConfigQueryKey = () => ["restaurant", "config"] as const;

// ——— Queries ———

export function useRestaurantConfig(
  options?: Omit<UseQueryOptions<RestaurantConfig>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: getRestaurantConfigQueryKey(),
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>("restaurant/config/");
      return normalizeRestaurantConfig(data);
    },
    staleTime: 300_000,
    ...options,
  });
}

export function useUpdateRestaurantConfig(
  options?: UseMutationOptions<RestaurantConfig, Error, { data: Partial<RestaurantConfig> }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: res } = await api.patch("restaurant/config/", data);
      return normalizeRestaurantConfig(res);
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(getRestaurantConfigQueryKey(), newConfig);
    },
    ...options,
  });
}

export function usePaymentConfig(
  options?: Omit<UseQueryOptions<PaymentConfig>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: getPaymentConfigQueryKey(),
    queryFn: async () => {
      const { data } = await api.get<PaymentConfig>("payments/config/");
      return data;
    },
    staleTime: 60_000,
    ...options,
  });
}

export function searchExternalFood(query: string, limit = 8) {
  return api
    .get<{ results: ExternalFoodResult[] }>("menu/search-external/", {
      params: { q: query, limit },
    })
    .then((res) => res.data.results);
}

export function useListCategories(
  options?: Omit<UseQueryOptions<Category[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: getListCategoriesQueryKey(),
    queryFn: async () => {
      const { data } = await api.get("categories/");
      const list = Array.isArray(data) ? data : data.results ?? [];
      return (list as Record<string, unknown>[]).map(normalizeCategory);
    },
    ...options,
  });
}

export function useListMenuItems(
  params?: ListMenuItemsParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<FoodItem>>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: getListMenuItemsQueryKey(params),
    queryFn: async () => {
      const { data } = await api.get("menu/", { params });
      
      if (data.results && typeof data.count === 'number') {
        const items = (data.results as Record<string, unknown>[]).map(normalizeFoodItem);
        return {
          ...data,
          results: items
        } as PaginatedResponse<FoodItem>;
      }

      // Fallback for non-paginated response
      const list = Array.isArray(data) ? data : data.results ?? [];
      let items = (list as Record<string, unknown>[]).map(normalizeFoodItem);

      if (params?.category_id != null) {
        items = items.filter((i) => i.category_id === params.category_id);
      }
      if (params?.food_type) {
        items = items.filter((i) => i.food_type === params.food_type);
      }
      if (params?.max_price != null) {
        items = items.filter((i) => i.price <= params.max_price!);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter((i) => i.name.toLowerCase().includes(q));
      }

      return {
        results: items,
        count: items.length,
        total_pages: 1,
        current_page: 1,
        links: { next: null, previous: null }
      };
    },
    ...options,
  });
}

export function useListMyOrders(
  deviceId?: string,
  params?: { page?: number; page_size?: number },
  options?: Omit<UseQueryOptions<PaginatedResponse<Order>>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: [...getListMyOrdersQueryKey(deviceId), params],
    queryFn: async () => {
      const queryParams = { ...(deviceId ? { device_id: deviceId } : {}), ...params };
      const { data } = await api.get("orders/", { params: queryParams });
      
      if (data.results && typeof data.count === 'number') {
        const items = (data.results as Record<string, unknown>[]).map(normalizeOrder);
        return { ...data, results: items } as PaginatedResponse<Order>;
      }

      const list = Array.isArray(data) ? data : data.results ?? [];
      const items = (list as Record<string, unknown>[]).map(normalizeOrder);
      return {
        results: items,
        count: items.length,
        total_pages: 1,
        current_page: 1,
        links: { next: null, previous: null }
      };
    },
    ...options,
  });
}

export function useListAllOrders(
  params?: { page?: number; page_size?: number },
  options?: Omit<UseQueryOptions<PaginatedResponse<Order>>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: [...getListAllOrdersQueryKey(), params],
    queryFn: async () => {
      const { data } = await api.get("orders/all/", { params });
      
      if (data.results && typeof data.count === 'number') {
        const items = (data.results as Record<string, unknown>[]).map(normalizeOrder);
        return { ...data, results: items } as PaginatedResponse<Order>;
      }

      const list = Array.isArray(data) ? data : data.results ?? [];
      const items = (list as Record<string, unknown>[]).map(normalizeOrder);
      return {
        results: items,
        count: items.length,
        total_pages: 1,
        current_page: 1,
        links: { next: null, previous: null }
      };
    },
    ...options,
  });
}

export function useListUsers(
  params?: { page?: number; page_size?: number },
  options?: Omit<UseQueryOptions<PaginatedResponse<User>>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: [...getListUsersQueryKey(), params],
    queryFn: async () => {
      const { data } = await api.get("admin/users/", { params });
      
      if (data.results && typeof data.count === 'number') {
        const items = (data.results as Record<string, unknown>[]).map(normalizeUser);
        return { ...data, results: items } as PaginatedResponse<User>;
      }

      const list = Array.isArray(data) ? data : data.results ?? [];
      const items = (list as Record<string, unknown>[]).map(normalizeUser);
      return {
        results: items,
        count: items.length,
        total_pages: 1,
        current_page: 1,
        links: { next: null, previous: null }
      };
    },
    ...options,
  });
}

export function useGetDashboardStats(
  options?: Omit<UseQueryOptions<DashboardStats>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: getDashboardStatsQueryKey(),
    queryFn: async () => {
      const { data } = await api.get("admin/dashboard/");
      return {
        ...data,
        total_revenue: Number(data.total_revenue),
        recent_orders: (data.recent_orders ?? []).map((o: Record<string, unknown>) =>
          normalizeOrder(o),
        ),
      } as DashboardStats;
    },
    ...options,
  });
}

// ——— Mutations ———

export type CategoryInput = {
  name: string;
  image_url?: string;
  imageFile?: File | null;
};

function buildCategoryPayload(data: CategoryInput): FormData | Record<string, unknown> {
  if (data.imageFile) {
    const form = new FormData();
    form.append("name", data.name);
    form.append("image", data.imageFile);
    return form;
  }
  const payload: Record<string, unknown> = { name: data.name };
  if (data.image_url !== undefined) payload.image_url = data.image_url;
  return payload;
}

export function useCreateCategory(
  options?: UseMutationOptions<Category, Error, { data: CategoryInput }>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const payload = buildCategoryPayload(data);
      const config = payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined;
      const { data: res } = await api.post("categories/", payload, config);
      return normalizeCategory(res);
    },
    ...options,
  });
}

export function useUpdateCategory(
  options?: UseMutationOptions<Category, Error, { id: number; data: CategoryInput }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = buildCategoryPayload(data);
      const config = payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined;
      const { data: res } = await api.patch(`categories/${id}/`, payload, config);
      return normalizeCategory(res);
    },
    ...options,
  });
}

export function useDeleteCategory(
  options?: UseMutationOptions<void, Error, { id: number }>,
) {
  return useMutation({
    mutationFn: async ({ id }) => {
      await api.delete(`categories/${id}/`);
    },
    ...options,
  });
}

export type MenuItemInput = {
  name: string;
  description?: string;
  price: number;
  food_type: "veg" | "nonveg";
  is_available: boolean;
  category_id: number;
  image_url?: string;
  imageFile?: File | null;
  default_stock?: number;
  current_stock?: number;
};

function buildMenuPayload(data: MenuItemInput): FormData | Record<string, unknown> {
  if (data.imageFile) {
    const form = new FormData();
    form.append("name", data.name);
    form.append("description", data.description ?? "");
    form.append("price", String(data.price));
    form.append("food_type", data.food_type);
    form.append("is_available", String(data.is_available));
    form.append("category_id", String(data.category_id));
    form.append("image", data.imageFile);
    if (data.default_stock !== undefined) form.append("default_stock", String(data.default_stock));
    if (data.current_stock !== undefined) form.append("current_stock", String(data.current_stock));
    return form;
  }

  const payload: Record<string, unknown> = {
    name: data.name,
    description: data.description ?? "",
    price: data.price,
    food_type: data.food_type,
    is_available: data.is_available,
    category_id: data.category_id,
    default_stock: data.default_stock,
    current_stock: data.current_stock,
  };
  if (data.image_url !== undefined) {
    payload.image_url = data.image_url;
  }
  return payload;
}

export function useCreateMenuItem(
  options?: UseMutationOptions<FoodItem, Error, { data: MenuItemInput }>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const payload = buildMenuPayload(data);
      const config =
        payload instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined;
      const { data: res } = await api.post("menu/", payload, config);
      return normalizeFoodItem(res);
    },
    ...options,
  });
}

export function useUpdateMenuItem(
  options?: UseMutationOptions<FoodItem, Error, { id: number; data: MenuItemInput }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = buildMenuPayload(data);
      const config =
        payload instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined;
      const { data: res } = await api.patch(`menu/${id}/`, payload, config);
      return normalizeFoodItem(res);
    },
    ...options,
  });
}

export function useDeleteMenuItem(
  options?: UseMutationOptions<void, Error, { id: number }>,
) {
  return useMutation({
    mutationFn: async ({ id }) => {
      await api.delete(`menu/${id}/`);
    },
    ...options,
  });
}

export interface CreateOrderInput {
  address: string;
  phone: string;
  items: { food_item_id: number; quantity: number }[];
  payment_method: PaymentMethod;
  card_number?: string;
  device_id?: string;
}

export function useCreateOrder(
  options?: UseMutationOptions<Order, Error, { data: CreateOrderInput }>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const payload: Record<string, unknown> = {
        address: data.address,
        phone: data.phone,
        payment_method: data.payment_method,
        device_id: data.device_id,
        items: data.items.map((i) => ({
          food_item: i.food_item_id,
          quantity: i.quantity,
        })),
      };
      if (data.card_number) {
        payload.card_number = data.card_number;
      }
      const { data: res } = await api.post("orders/", payload);
      return normalizeOrder(res);
    },
    ...options,
  });
}

export function useUpdateOrderStatus(
  options?: UseMutationOptions<Order, Error, { id: number; data: { status: string } }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: res } = await api.patch(`orders/${id}/status/`, data);
      return normalizeOrder(res);
    },
    ...options,
  });
}

export function useUpdateOrder(
  options?: UseMutationOptions<Order, Error, { id: number; data: CreateOrderInput }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const payload: Record<string, unknown> = {
        address: data.address,
        phone: data.phone,
        payment_method: data.payment_method,
        items: data.items.map((i) => ({
          food_item: i.food_item_id,
          quantity: i.quantity,
        })),
      };
      const { data: res } = await api.patch(`admin/orders/${id}/`, payload);
      return normalizeOrder(res);
    },
    ...options,
  });
}

export function useUpdateUserRole(
  options?: UseMutationOptions<User, Error, { id: number; data: { role: string } }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: res } = await api.patch(`admin/users/${id}/role/`, data);
      return normalizeUser(res);
    },
    ...options,
  });
}

// ——— Profile & Address Hooks ———

export function useUpdateProfile(
  options?: UseMutationOptions<User, Error, { data: Partial<User> }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: res } = await api.patch("auth/me/", data);
      return normalizeUser(res);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["auth", "me"], updatedUser);
    },
    ...options,
  });
}

export function useListAddresses(
  options?: Omit<UseQueryOptions<Address[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get("addresses/");
      return (data as Record<string, unknown>[]).map((addr) => ({
        id: Number(addr.id),
        address_type: addr.address_type as any,
        address_line: String(addr.address_line),
        is_default: Boolean(addr.is_default),
      }));
    },
    ...options,
  });
}

export function useCreateAddress(
  options?: UseMutationOptions<Address, Error, { data: Omit<Address, "id"> }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: res } = await api.post("addresses/", data);
      return res as Address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    ...options,
  });
}

export function useUpdateAddress(
  options?: UseMutationOptions<Address, Error, { id: number; data: Partial<Address> }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: res } = await api.patch(`addresses/${id}/`, data);
      return res as Address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    ...options,
  });
}

export function useDeleteAddress(
  options?: UseMutationOptions<void, Error, { id: number }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      await api.delete(`addresses/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    ...options,
  });
}
