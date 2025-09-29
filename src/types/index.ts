// Tipos principales de la aplicación Encárgate

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cliente' | 'encargado' | 'admin';
  avatar?: string;
  phone?: string;
  location?: string;
  joinDate?: string;
  verified?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  services: string[];
}

export interface Encargado {
  id: string;
  name: string;
  category: string;
  service: string;
  price: number;
  rating: number;
  reviewsCount: number;
  avatar: string;
  verified: boolean;
  available: boolean;
  location: string | {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  experience: string | number;
  description: string;
  services: (string | {
    id: string;
    name: string;
    category: any;
    description: string;
    basePrice: number;
    duration: number;
  })[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discount: number;
  category: string;
  color: string;
  gradient: string;
  active: boolean;
  validUntil: string;
  image?: string;
}

export interface Order {
  id: string;
  userId: string;
  encargadoId: string;
  service: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  date: string;
  rating?: number;
  review?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

// Tipos para formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'cliente' | 'encargado';
  phone?: string;
  location?: string;
  // Campos específicos para encargados
  categories?: string[];
  services?: string[];
  experience?: string;
  description?: string;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos para componentes
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  fullWidth?: boolean;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}
