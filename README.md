# Encárgate - Aplicación Web

Aplicación web que conecta usuarios con encargados verificados para servicios del hogar como plomería, electricidad, limpieza y más.

## Características

- **Landing Page Atractiva**: Página de bienvenida con información de la plataforma
- **Autenticación**: Sistema de login y registro con validaciones
- **Dashboard Principal**: Vista con categorías, promociones y encargados destacados
- **Búsqueda y Filtros**: Sistema avanzado de búsqueda con múltiples filtros
- **Perfiles de Encargados**: Cards detalladas con información, calificaciones y servicios
- **Responsive Design**: Optimizado para desktop y móvil
- **UI Moderna**: Componentes reutilizables con TailwindCSS

## Tecnologías

- **Framework**: Next.js 15 con App Router
- **Styling**: TailwindCSS con configuración personalizada
- **Iconos**: Lucide React
- **Componentes**: Headless UI
- **TypeScript**: Tipado completo
- **Fuentes**: Inter (Google Fonts)

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── page.tsx           # Landing page
│   ├── login/page.tsx     # Página de login
│   ├── register/page.tsx  # Página de registro
│   ├── home/page.tsx      # Dashboard principal
│   └── services/[id]/     # Página de servicios por categoría
├── components/            # Componentes React
│   ├── ui/               # Componentes UI base
│   ├── Navbar.tsx        # Navegación principal
│   ├── EncargadoCard.tsx # Card de encargado
│   └── ...
├── data/                 # Mock data
│   └── mockData.ts       # Datos de prueba
├── types/                # Definiciones TypeScript
│   └── index.ts          # Tipos principales
└── utils/                # Utilidades
```
## Rutas Principales

- `/` - Landing page con información de la plataforma
- `/login` - Iniciar sesión (credenciales demo: demo@encargate.com / demo123)
- `/register` - Crear nueva cuenta
- `/home` - Dashboard principal (requiere autenticación)
- `/services/[id]` - Listado de encargados por categoría

## Instalación y Desarrollo

1. **Clonar el repositorio**
```bash
cd encargate-app
```
2. **Instalar dependencias**
```bash
npm install
```
3. **Ejecutar en modo desarrollo**
```bash
npm run dev
```
4. **Abrir en el navegador**
```
http://localhost:3000
```
## Componentes UI

### Componentes Base
- `Button` - Botón con múltiples variantes y tamaños
- `Input` - Campo de entrada con iconos y validaciones
- `Card` - Contenedor con sombras y hover effects
- `Badge` - Etiquetas de estado y categorías

### Componentes Específicos
- `EncargadoCard` - Tarjeta de encargado con información completa
- `ServiceCategoryCard` - Tarjeta de categoría de servicio
- `PromotionCard` - Tarjeta de promoción
- `Navbar` - Navegación responsive con búsqueda

## Mock Data

El proyecto incluye datos de prueba realistas:
- 8 categorías de servicios
- 4 encargados con perfiles completos
- 3 promociones activas
- Sistema de calificaciones y reseñas

## Diseño

- **Colores**: Paleta personalizada con primary (azul), secondary (amarillo), success (verde)
- **Tipografía**: Inter como fuerte principal
- **Espaciado**: Sistema consistente basado en Tailwind
- **Animaciones**: Transiciones suaves y micro-interacción

## Configuración

### TailwindCSS
- Colores personalizados para la marca
- Sombras suaves (soft, medium, strong)
- Animaciones personalizadas
- Utilidades para line-clamp

### Next.js
- App Router habilitado
- TypeScript configurado
- Optimización de imágenes
- Fuentes optimizadas

## Responsive Design

- **Mobile First**: diseño optimizado para móviles
- **Breakpoints**: sm, md, lg, xl
- **Navegación**: Menú hamburguesa en móvil
- **Grid**: Layouts adaptativos según pantalla

## Próximos Pasos (Backend - Fase 2)

1. **API Routes**: Endpoints para autenticación y servicios
2. **Base de Datos**: PostgreSQL con Prisma ORM
3. **Autenticación**: JWT y sesiones
4. **Geolocalización**: Búsqueda por ubicación
5. **Pagos**: Integración con Stripe/PayPal
6. **Notificaciones**: Sistema de notificaciones en tiempo real

## Testing

Para probar la aplicación:
1. Navega por la landing page
2. Usa las credenciales demo para login
3. Explora el dashboard y categorías
4. Prueba los filtros y búsquedas
5. Verifica la responsividad en diferentes pantallas

## Licencia

Este proyecto es parte de un desarrollo privado para la aplicación Encárgate.
