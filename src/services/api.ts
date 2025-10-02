// API Service for Encárgate App
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
console.log('API_BASE_URL:', API_BASE_URL);
// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  location?: string;
  verified: boolean;
  role: 'CLIENTE' | 'ENCARGADO' | 'ADMIN';
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Encargado {
  id: string;
  name: string;
  email: string;
  avatar: string;
  location: string;
  verified: boolean;
  service: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    services: string[];
  };
  price: number;
  priceMin: number;
  priceMax: number;
  rating: number;
  reviewsCount: number;
  experience: string;
  description: string;
  services: string[];
  available: boolean;
  reviews?: Review[];
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  encargadoId: string;
  service: string;
  description?: string;
  address: string;
  date: string;
  time: string;
  price: number;
  paymentMethod: 'card' | 'cash';
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentIntentId?: string;
  rating?: number;
  review?: Review;
  createdAt: string;
  encargado?: {
    name: string;
    avatar: string;
    location: string;
    rating: number;
    reviewsCount: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  services: string[];
  encargadosCount?: number;
  imageUrl?: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discount: number;
  categoryId?: string;
  color: string;
  gradient: string;
  imageUrl: string;
  validUntil?: string;
}

export interface Banner {
  id: string;
  icon: string;
  title: string;
  headline: string;
  subtitle: string;
  gradient: string;
  image: string;
  active: boolean;
  order: number;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Recargar token desde localStorage en cada petición
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken && storedToken !== this.token) {
        this.token = storedToken;
      }
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // console.log('🔗 Request URL:', url);
    // console.log('⚙️ Request config:', config);

    try {
      const response = await fetch(url, config);
      // console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // NestJS devuelve errores en diferentes formatos
        const errorMessage = errorData.message || errorData.error || errorData.statusText || `HTTP error! status: ${response.status}`;
        
        // Solo mostrar error si no es 401 (para evitar spam en consola)
        if (response.status !== 401) {
          console.error('❌ API request failed:', errorMessage);
          console.error('📄 Error data:', errorData);
        }
        
        throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      }

      const responseData = await response.json();
      // console.log('✅ Response data received:', responseData);
      
      return responseData;
    } catch (error) {
      // Solo mostrar error detallado si no es Unauthorized
      if (!error?.toString().includes('Unauthorized')) {
        console.error('❌ API request failed:', error);
      }
      throw error;
    }
  }

  // Auth methods
  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'CLIENTE' | 'ENCARGADO';
    location?: string;
  }) {
    const response = await this.request<{
      message: string;
      user: User;
      token: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string) {
    console.log('🌐 ApiClient: Enviando login request a:', `${this.baseURL}/auth/login`);
    console.log('📝 ApiClient: Datos enviados:', { email, password });
    
    const response = await this.request<{
      message: string;
      user: User;
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    console.log('📨 ApiClient: Respuesta recibida:', response);

    this.setToken(response.token);
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // Users
  async getUserProfile() {
    return this.request<{ user: User }>('/users/profile');
  }

  async updateUserProfile(userData: {
    name?: string;
    phone?: string;
    location?: string;
    avatarUrl?: string;
  }) {
    return this.request<{ message: string; user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getFavorites() {
    return this.request<{ favorites: Encargado[] }>('/users/favorites');
  }

  async toggleFavorite(encargadoId: string) {
    return this.request<{ message: string; favorited: boolean }>(
      `/users/favorites/${encargadoId}`,
      { method: 'POST' }
    );
  }

  // Encargados
  async getEncargados(params?: {
    category?: string;
    search?: string;
    service?: string;
    available?: boolean;
    sortBy?: 'rating' | 'price' | 'reviews';
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/encargados${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Encargado[]>(endpoint);
  }

  async getEncargadoById(id: string) {
    return this.request<Encargado>(`/encargados/${id}`);
  }

  async getEncargadoProfile() {
    return this.request<Encargado>('/encargados/profile');
  }

  async updateEncargadoProfile(id: string, data: {
    name?: string;
    service?: string;
    price?: number;
    priceMin?: number;
    priceMax?: number;
    experience?: string;
    description?: string;
    services?: string[];
    available?: boolean;
    avatar?: string;
  }) {
    return this.request<{ message: string; encargado: any }>(
      `/encargados/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async toggleEncargadoAvailability(id: string) {
    return this.request<{ message: string; available: boolean }>(
      `/encargados/${id}/toggle-availability`,
      {
        method: 'PATCH',
      }
    );
  }

  // Categories
  async getCategories() {
    return this.request<Category[]>('/categories');
  }

  async getCategoryServices(categoryId: string) {
    return this.request<{
      categoryId: string;
      categoryName: string;
      services: string[];
    }>(`/categories/${categoryId}/services`);
  }

  async getCategoryById(id: string) {
    return this.request<Category>(`/categories/${id}`);
  }

  // Orders
  async createOrder(orderData: {
    encargadoId: string;
    categoryId: string;
    service: string;
    address: string;
    date: string;
    time: string;
    price: number;
    paymentMethod: 'card' | 'cash';
    description?: string;
  }) {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getMyOrders(params?: {
    status?: string;
    encargadoId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.encargadoId) searchParams.append('encargadoId', params.encargadoId);
    
    const queryString = searchParams.toString();
    return this.request<Order[]>(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getOrderById(id: string) {
    return this.request<Order>(`/orders/${id}`);
  }

  async getOrderStats() {
    return this.request<{
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
      cancelled: number;
      totalEarnings: number;
      averageOrderValue: number;
    }>('/orders/stats');
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request<Order>(
      `/orders/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
  }

  async updateOrder(id: string, data: Partial<Order>) {
    return this.request<Order>(
      `/orders/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  async getOrderTransaction(id: string) {
    return this.request<{ transactionId: string }>(
      `/orders/${id}/transaction`
    );
  }

  async confirmOrderPayment(id: string, transactionId?: string) {
    return this.request<Order>(
      `/orders/${id}/confirm-payment`,
      {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      }
    );
  }

  async confirmCashPayment(id: string) {
    return this.request<Order>(
      `/orders/${id}/confirm-cash-payment`,
      {
        method: 'POST',
      }
    );
  }

  async cancelOrderAndPayment(id: string, transactionId?: string) {
    return this.request<Order>(
      `/orders/${id}/cancel-payment`,
      {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      }
    );
  }

  async addOrderReview(id: string, rating: number, comment?: string) {
    return this.request<{
      message: string;
      rating: number;
      reviewCount: number;
    }>(`/orders/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  // Promotions
  async getPromotions() {
    return this.request<Promotion[]>('/promotions');
  }

  async getPromotionsByCategory(categoryId: string) {
    return this.request<Promotion[]>(
      `/promotions/category/${categoryId}`
    );
  }

  // Banners
  async getBanners() {
    return this.request<Banner[]>('/banners');
  }

  // Reviews
  async getEncargadoReviews(encargadoId: string, params?: {
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/reviews/encargado/${encargadoId}${
      queryString ? `?${queryString}` : ''
    }`;
    
    return this.request<{
      reviews: Array<{
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        user: {
          name: string;
          avatar: string;
        };
      }>;
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(endpoint);
  }

  async getEncargadoReviewStats(encargadoId: string) {
    return this.request<{
      averageRating: number;
      totalReviews: number;
      distribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      };
    }>(`/reviews/encargado/${encargadoId}/stats`);
  }
  // Admin endpoints
  async getAdminDashboard() {
    return this.request<{
      totalRevenue: number;
      totalCommissions: number;
      totalWompiCosts: number;
      netProfit: number;
      totalOrders: number;
      completedOrders: number;
      activeProviders: number;
      activeClients: number;
      avgOrderValue: number;
      avgCommissionPercent: number;
    }>(`/admin/dashboard`);
  }

  async getAdminMonthlyRevenue(months: number = 6) {
    return this.request<Array<{
      month: string;
      revenue: number;
      commissions: number;
      wompiCosts: number;
      netProfit: number;
    }>>(`/admin/revenue/monthly?months=${months}`);
  }

  async getTopProviders(limit: number = 10) {
    return this.request<Array<{
      id: string;
      name: string;
      totalRevenue: number;
      totalOrders: number;
      avgRating: number;
      commissionsGenerated: number;
    }>>(`/admin/providers/top?limit=${limit}`);
  }

  async getPaymentMethodStats() {
    return this.request<Array<{
      method: string;
      count: number;
      totalRevenue: number;
      percentage: number;
    }>>(`/admin/payment-methods/stats`);
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export default
export default apiClient;
