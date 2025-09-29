import { Category, Encargado, Promotion, User, Order } from '@/types';

// Datos mock directamente en TypeScript para evitar conflictos con HMR
const mockData = {
  categories: [
    {
      id: "hogar",
      name: "Hogar",
      icon: "🏠",
      color: "#8B5CF6",
      description: "Servicios para el hogar",
      services: ["Limpieza", "Plomería", "Electricidad", "Carpintería"]
    },
    {
      id: "belleza",
      name: "Belleza",
      icon: "💄",
      color: "#F97316",
      description: "Servicios de belleza y cuidado personal",
      services: ["Peluquería", "Manicure", "Masajes", "Estética"]
    },
    {
      id: "educacion",
      name: "Educación",
      icon: "📚",
      color: "#3B82F6",
      description: "Servicios educativos y tutorías",
      services: ["Tutorías", "Clases particulares", "Idiomas"]
    },
    {
      id: "cuidado",
      name: "Cuidado Infantil",
      icon: "⭐",
      color: "#EAB308",
      description: "Cuidado de niños y bebés",
      services: ["Niñera", "Cuidado de bebés", "Actividades infantiles"]
    },
    {
      id: "tecnologia",
      name: "Tecnología",
      icon: "💻",
      color: "#EF4444",
      description: "Servicios tecnológicos",
      services: ["Reparación PC", "Instalación software", "Soporte técnico"]
    },
    {
      id: "profesionales",
      name: "Profesionales",
      icon: "💼",
      color: "#22C55E",
      description: "Servicios profesionales",
      services: ["Contabilidad", "Legal", "Consultoría"]
    },
    {
      id: "mascotas",
      name: "Mascotas",
      icon: "🐾",
      color: "#14B8A6",
      description: "Cuidado de mascotas",
      services: ["Veterinaria", "Peluquería canina", "Paseo de perros"]
    },
    {
      id: "mas",
      name: "Más",
      icon: "➕",
      color: "#6B7280",
      description: "Otros servicios",
      services: ["Otros"]
    }
  ] as Category[],
  encargados: [
    {
      id: "1",
      name: "Miguel Paredes",
      category: "hogar",
      service: "Plomería",
      price: 254.99,
      rating: 5.0,
      reviewsCount: 127,
      avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face&auto=format",
      verified: true,
      available: true,
      location: "Bogotá, Colombia",
      experience: "5 años",
      description: "Plomero certificado con amplia experiencia en reparaciones residenciales y comerciales.",
      services: ["Reparación de tuberías", "Instalación de grifos", "Destapado de cañerías"],
      priceRange: { min: 50, max: 300 }
    },
    {
      id: "2",
      name: "Julián Herrera",
      category: "hogar",
      service: "Electricista",
      price: 354.99,
      rating: 5.0,
      reviewsCount: 89,
      avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=150&h=150&fit=crop&crop=face&auto=format",
      verified: true,
      available: true,
      location: "Medellín, Colombia",
      experience: "8 años",
      description: "Electricista profesional especializado en instalaciones residenciales y comerciales.",
      services: ["Instalación eléctrica", "Reparación de circuitos", "Iluminación LED"],
      priceRange: { min: 80, max: 500 }
    },
    {
      id: "3",
      name: "Andrés Salazar",
      category: "hogar",
      service: "Carpintería",
      price: 264.99,
      rating: 5.0,
      reviewsCount: 156,
      avatar: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=150&h=150&fit=crop&crop=face&auto=format",
      verified: true,
      available: false,
      location: "Cali, Colombia",
      experience: "10 años",
      description: "Carpintero experto en muebles a medida y reparaciones de madera.",
      services: ["Muebles a medida", "Reparación de puertas", "Instalación de closets"],
      priceRange: { min: 100, max: 400 }
    },
    {
      id: "4",
      name: "Carolina López",
      category: "belleza",
      service: "Peluquería",
      price: 180.00,
      rating: 4.8,
      reviewsCount: 203,
      avatar: "https://images.unsplash.com/photo-1594824388853-e0c5c9e1e4c5?w=150&h=150&fit=crop&crop=face&auto=format",
      verified: true,
      available: true,
      location: "Bogotá, Colombia",
      experience: "6 años",
      description: "Estilista profesional especializada en cortes modernos y coloración.",
      services: ["Corte de cabello", "Coloración", "Peinados para eventos"],
      priceRange: { min: 50, max: 250 }
    },
    {
      id: "5",
      name: "Roberto Martínez",
      category: "tecnologia",
      service: "Soporte Técnico",
      price: 120.00,
      rating: 4.9,
      reviewsCount: 78,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format",
      verified: true,
      available: true,
      location: "Medellín, Colombia",
      experience: "4 años",
      description: "Técnico en sistemas especializado en reparación de computadores y redes.",
      services: ["Reparación PC", "Instalación software", "Configuración redes"],
      priceRange: { min: 60, max: 200 }
    }
  ] as Encargado[],
  promotions: [
    {
      id: "1",
      title: "40% OFF",
      subtitle: "Limpieza Profunda",
      description: "Descuento especial en servicios de limpieza para el hogar",
      discount: 40,
      category: "hogar",
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      active: true,
      validUntil: "2024-12-31",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&h=100&fit=crop&auto=format"
    },
    {
      id: "2",
      title: "15% OFF",
      subtitle: "Servicios",
      description: "Descuento en todos los servicios profesionales",
      discount: 15,
      category: "all",
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      active: true,
      validUntil: "2024-11-30",
      image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=100&h=100&fit=crop&auto=format"
    }
  ] as Promotion[],
  users: [
    {
      id: "1",
      name: "Juan Jiménez",
      email: "jpjimenez94@gmail.com",
      role: "cliente" as const,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format",
      phone: "+57 300 123 4567",
      location: "Bogotá, Colombia",
      joinDate: "2024-01-15",
      verified: true
    }
  ] as User[],
  orders: [
    {
      id: "1",
      userId: "1",
      encargadoId: "1",
      service: "Reparación de tubería",
      status: "completed" as const,
      price: 254.99,
      date: "2024-03-15",
      rating: 5,
      review: "Excelente servicio, muy profesional y puntual."
    }
  ] as Order[]
};

// Servicio de datos mock para desarrollo
export class MockDataService {
  private static instance: MockDataService;
  private data: typeof mockData;

  private constructor() {
    this.data = mockData;
  }

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  // Categorías
  getCategories(): Category[] {
    return this.data.categories;
  }

  getCategoryById(id: string): Category | undefined {
    return this.data.categories.find(cat => cat.id === id);
  }

  // Encargados
  getEncargados(): Encargado[] {
    return this.data.encargados;
  }

  getEncargadoById(id: string): Encargado | undefined {
    return this.data.encargados.find(enc => enc.id === id);
  }

  getEncargadosByCategory(categoryId: string): Encargado[] {
    return this.data.encargados.filter(enc => enc.category === categoryId);
  }

  getFeaturedEncargados(limit: number = 3): Encargado[] {
    return this.data.encargados
      .filter(enc => enc.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  searchEncargados(query: string): Encargado[] {
    const searchTerm = query.toLowerCase();
    return this.data.encargados.filter(enc => 
      enc.name.toLowerCase().includes(searchTerm) ||
      enc.service.toLowerCase().includes(searchTerm) ||
      enc.services.some(service => service.toLowerCase().includes(searchTerm))
    );
  }

  // Promociones
  getPromotions(): Promotion[] {
    return this.data.promotions;
  }

  getActivePromotions(): Promotion[] {
    return this.data.promotions.filter(promo => promo.active);
  }

  getPromotionsByCategory(categoryId: string): Promotion[] {
    return this.data.promotions.filter(promo => 
      promo.category === categoryId || promo.category === 'all'
    );
  }

  // Usuarios
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(user => user.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(user => user.email === email);
  }

  // Órdenes
  getOrders(): Order[] {
    return this.data.orders;
  }

  getOrdersByUserId(userId: string): Order[] {
    return this.data.orders.filter(order => order.userId === userId);
  }

  getOrdersByEncargadoId(encargadoId: string): Order[] {
    return this.data.orders.filter(order => order.encargadoId === encargadoId);
  }

  // Métodos de simulación para autenticación
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = this.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }
    
    // En un entorno real, verificarías la contraseña hasheada
    if (password === 'demo123') {
      return { success: true, user };
    }
    
    return { success: false, error: 'Contraseña incorrecta' };
  }

  async register(userData: Omit<User, 'id' | 'joinDate' | 'verified'>): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar si el email ya existe
    if (this.getUserByEmail(userData.email)) {
      return { success: false, error: 'El email ya está registrado' };
    }
    
    // Crear nuevo usuario
    const newUser: User = {
      ...userData,
      id: (this.data.users.length + 1).toString(),
      joinDate: new Date().toISOString().split('T')[0],
      verified: false
    };
    
    this.data.users.push(newUser);
    return { success: true, user: newUser };
  }

  // Método para crear una orden
  async createOrder(orderData: Omit<Order, 'id'>): Promise<{ success: boolean; order?: Order; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newOrder: Order = {
      ...orderData,
      id: (this.data.orders.length + 1).toString()
    };
    
    this.data.orders.push(newOrder);
    return { success: true, order: newOrder };
  }

  // Estadísticas útiles
  getStats() {
    return {
      totalEncargados: this.data.encargados.length,
      totalCategories: this.data.categories.length,
      totalUsers: this.data.users.length,
      totalOrders: this.data.orders.length,
      averageRating: this.data.encargados.reduce((sum, enc) => sum + enc.rating, 0) / this.data.encargados.length,
      availableEncargados: this.data.encargados.filter(enc => enc.available).length
    };
  }
}

// Exportar instancia singleton
export const mockDataService = MockDataService.getInstance();

// Funciones helper para uso directo
export const getCategories = () => mockDataService.getCategories();
export const getEncargados = () => mockDataService.getEncargados();
export const getFeaturedEncargados = (limit?: number) => mockDataService.getFeaturedEncargados(limit);
export const getActivePromotions = () => mockDataService.getActivePromotions();
export const searchEncargados = (query: string) => mockDataService.searchEncargados(query);
export const getCategoryById = (id: string) => mockDataService.getCategoryById(id);
export const getEncargadoById = (id: string) => mockDataService.getEncargadoById(id);
export const getEncargadosByCategory = (categoryId: string) => mockDataService.getEncargadosByCategory(categoryId);
