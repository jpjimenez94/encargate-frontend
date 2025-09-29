import { ServiceCategory, Encargado, Promotion, Service } from '@/types';

// Categorías de servicios
export const serviceCategories: ServiceCategory[] = [
  {
    id: '1',
    name: 'Plomería',
    description: 'Servicios de plomería y fontanería',
    icon: '🔧',
    color: '#3B82F6',
    services: []
  },
  {
    id: '2',
    name: 'Electricidad',
    description: 'Servicios eléctricos y instalaciones',
    icon: '⚡',
    color: '#F59E0B',
    services: []
  },
  {
    id: '3',
    name: 'Limpieza',
    description: 'Servicios de limpieza doméstica y comercial',
    icon: '🧽',
    color: '#10B981',
    services: []
  },
  {
    id: '4',
    name: 'Jardinería',
    description: 'Mantenimiento de jardines y áreas verdes',
    icon: '🌱',
    color: '#059669',
    services: []
  },
  {
    id: '5',
    name: 'Carpintería',
    description: 'Trabajos en madera y muebles',
    icon: '🔨',
    color: '#8B5CF6',
    services: []
  },
  {
    id: '6',
    name: 'Pintura',
    description: 'Servicios de pintura interior y exterior',
    icon: '🎨',
    color: '#EF4444',
    services: []
  },
  {
    id: '7',
    name: 'Aire Acondicionado',
    description: 'Instalación y mantenimiento de AC',
    icon: '❄️',
    color: '#06B6D4',
    services: []
  },
  {
    id: '8',
    name: 'Cerrajería',
    description: 'Servicios de cerrajería y seguridad',
    icon: '🔐',
    color: '#6B7280',
    services: []
  }
];

// Servicios específicos
export const services: Service[] = [
  // Plomería
  {
    id: '1',
    name: 'Reparación de tuberías',
    category: serviceCategories[0],
    description: 'Reparación de fugas y tuberías dañadas',
    basePrice: 150,
    duration: 120
  },
  {
    id: '2',
    name: 'Instalación de grifos',
    category: serviceCategories[0],
    description: 'Instalación y cambio de grifos',
    basePrice: 80,
    duration: 60
  },
  // Electricidad
  {
    id: '3',
    name: 'Instalación eléctrica',
    category: serviceCategories[1],
    description: 'Instalaciones eléctricas residenciales',
    basePrice: 200,
    duration: 180
  },
  {
    id: '4',
    name: 'Reparación de enchufes',
    category: serviceCategories[1],
    description: 'Reparación y cambio de enchufes',
    basePrice: 50,
    duration: 30
  },
  // Limpieza
  {
    id: '5',
    name: 'Limpieza profunda',
    category: serviceCategories[2],
    description: 'Limpieza completa del hogar',
    basePrice: 120,
    duration: 240
  },
  {
    id: '6',
    name: 'Limpieza de oficinas',
    category: serviceCategories[2],
    description: 'Limpieza de espacios comerciales',
    basePrice: 100,
    duration: 180
  }
];

// Encargados mock
export const encargados: Encargado[] = [
  {
    id: '1',
    name: 'Carlos Rodríguez',
    email: 'carlos@example.com',
    phone: '+1234567890',
    avatar: '/assets/perfil1.svg',
    rating: 4.8,
    reviewsCount: 127,
    services: [services[0], services[1]],
    location: {
      address: 'Av. Principal 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '01000'
    },
    description: 'Plomero con más de 10 años de experiencia. Especializado en reparaciones de emergencia.',
    experience: 10,
    verified: true,
    available: true,
    priceRange: {
      min: 50,
      max: 300
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-09-27')
  },
  {
    id: '2',
    name: 'María González',
    email: 'maria@example.com',
    phone: '+1234567891',
    avatar: '/assets/perfil2.svg',
    rating: 4.9,
    reviewsCount: 89,
    services: [services[2], services[3]],
    location: {
      address: 'Calle Reforma 456',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44100'
    },
    description: 'Electricista certificada con especialización en instalaciones residenciales y comerciales.',
    experience: 8,
    verified: true,
    available: true,
    priceRange: {
      min: 80,
      max: 400
    },
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2024-09-26')
  },
  {
    id: '3',
    name: 'Ana Martínez',
    email: 'ana@example.com',
    phone: '+1234567892',
    avatar: '/assets/perfil4.svg',
    rating: 4.7,
    reviewsCount: 156,
    services: [services[4], services[5]],
    location: {
      address: 'Blvd. Insurgentes 789',
      city: 'Monterrey',
      state: 'Nuevo León',
      zipCode: '64000'
    },
    description: 'Servicio de limpieza profesional con equipo especializado y productos ecológicos.',
    experience: 6,
    verified: true,
    available: false,
    priceRange: {
      min: 60,
      max: 250
    },
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2024-09-25')
  },
  {
    id: '4',
    name: 'Roberto Silva',
    email: 'roberto@example.com',
    phone: '+1234567893',
    rating: 4.6,
    reviewsCount: 73,
    services: [services[0], services[2]],
    location: {
      address: 'Av. Juárez 321',
      city: 'Puebla',
      state: 'Puebla',
      zipCode: '72000'
    },
    description: 'Técnico multiservicios con experiencia en plomería y electricidad básica.',
    experience: 12,
    verified: true,
    available: true,
    priceRange: {
      min: 70,
      max: 350
    },
    createdAt: new Date('2022-11-05'),
    updatedAt: new Date('2024-09-24')
  }
];

// Promociones
export const promotions: Promotion[] = [
  {
    id: '1',
    title: '20% OFF en Plomería',
    description: 'Descuento especial en todos los servicios de plomería durante este mes',
    discount: 20,
    validUntil: new Date('2024-10-31'),
    image: '/assets/card-coupon.svg',
    serviceCategories: ['1'],
    active: true
  },
  {
    id: '2',
    title: 'Limpieza Gratis',
    description: 'Contrata 3 servicios de limpieza y el 4to es gratis',
    discount: 25,
    validUntil: new Date('2024-11-15'),
    image: '/assets/card-coupon-1.svg',
    serviceCategories: ['3'],
    active: true
  },
  {
    id: '3',
    title: 'Electricista Express',
    description: 'Servicio de electricista en menos de 2 horas con 15% de descuento',
    discount: 15,
    validUntil: new Date('2024-10-20'),
    image: '/assets/card-coupon-2.svg',
    serviceCategories: ['2'],
    active: true
  }
];

// Función para obtener encargados por categoría
export const getEncargadosByCategory = (categoryId: string): Encargado[] => {
  return encargados.filter(encargado => 
    encargado.services.some(service => service.category.id === categoryId)
  );
};

// Función para obtener encargados destacados
export const getFeaturedEncargados = (): Encargado[] => {
  return encargados
    .filter(encargado => encargado.verified && encargado.available)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
};

// Función para buscar encargados
export const searchEncargados = (query: string): Encargado[] => {
  const lowerQuery = query.toLowerCase();
  return encargados.filter(encargado => 
    encargado.name.toLowerCase().includes(lowerQuery) ||
    encargado.description.toLowerCase().includes(lowerQuery) ||
    encargado.services.some(service => 
      service.name.toLowerCase().includes(lowerQuery) ||
      service.category.name.toLowerCase().includes(lowerQuery)
    )
  );
};
