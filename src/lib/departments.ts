import { 
  Users,
  Build
  Buildings,
  Clipbo

  name: stri
  bgColor
  borderColor: 
  description: string;

  Engineering: {
    color: 'okl
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: typeof Users;
  description: string;
}

export const DEPARTMENT_CONFIGS: Record<string, DepartmentConfig> = {
  Engineering: {
    name: 'Engineering',
    color: 'oklch(0.60 0.20 260)',
    bgColor: 'oklch(0.60 0.20 260 / 0.1)',
    textColor: 'oklch(0.40 0.16 260)',
    borderColor: 'oklch(0.60 0.20 260 / 0.3)',
    color: 'okl
    description: 'Software engineering and development'
    
    textColor:
    name: 'Marketing',
    color: 'oklch(0.65 0.22 340)',
    bgColor: 'oklch(0.65 0.22 340 / 0.1)',
    textColor: 'oklch(0.45 0.18 340)',
    borderColor: 'oklch(0.65 0.22 340 / 0.3)',
    description: 'Busine
    description: 'Marketing and brand management'
    
  Sales: {
    name: 'Sales',
    color: 'oklch(0.58 0.18 120)',
    bgColor: 'oklch(0.58 0.18 120 / 0.1)',
    textColor: 'oklch(0.38 0.14 120)',
    borderColor: 'oklch(0.50 0.12 240 / 0.3)',
    icon: Handshake,
    description: 'Sales and business development'
  },
    tex
    name: 'HR',
  },
    name: 'Executive',
    bgColor: 'oklch(0.52 0.14 30 / 0.1
    borderColor: 'oklch(0.52 0.14 30 / 0.3)',
    description:
    description: 'Human resources and people operations'
    
  Support: {
    name: 'Support',
    color: 'oklch(0.63 0.16 200)',

    textColor: 'oklch(0.43 0.13 200)',
    borderColor: 'oklch(0.63 0.16 200 / 0.3)',
    icon: Users,
    description: 'Customer support and success'
  },
  if (!departme
    name: 'Operations',
    color: 'oklch(0.52 0.14 30)',
    ...DEFAULT_DEPARTMENT_CONFIG,
  };

  const config = get
    description: 'Business operations and processes'
expo
  Product: {
    name: 'Product',
    color: 'oklch(0.64 0.20 180)',
  'Legal',
    textColor: 'oklch(0.44 0.16 180)',
    borderColor: 'oklch(0.64 0.20 180 / 0.3)',
    icon: Package,
    description: 'Product strategy and development'
  },

    name: 'Legal',

    bgColor: 'oklch(0.50 0.12 240 / 0.1)',

    borderColor: 'oklch(0.50 0.12 240 / 0.3)',

    description: 'Legal compliance and contracts'

  Research: {
    name: 'Research',
    color: 'oklch(0.66 0.18 280)',

    textColor: 'oklch(0.46 0.15 280)',
    borderColor: 'oklch(0.66 0.18 280 / 0.3)',
    icon: Flask,
    description: 'Research and development'
  },

    name: 'Executive',

    bgColor: 'oklch(0.52 0.14 30 / 0.1)',

    borderColor: 'oklch(0.52 0.14 30 / 0.3)',

    description: 'Executive leadership and strategy'

  Partnerships: {
    name: 'Partnerships',
    color: 'oklch(0.61 0.19 160)',

    textColor: 'oklch(0.41 0.16 160)',
    borderColor: 'oklch(0.61 0.19 160 / 0.3)',
    icon: Handshake,
    description: 'Strategic partnerships and alliances'
  }


const DEFAULT_DEPARTMENT_CONFIG: DepartmentConfig = {
  name: 'Other',

  bgColor: 'oklch(0.55 0.10 220 / 0.1)',

  borderColor: 'oklch(0.55 0.10 220 / 0.3)',

  description: 'Other department'


export function getDepartmentConfig(departmentName?: string): DepartmentConfig {
  if (!departmentName) return DEFAULT_DEPARTMENT_CONFIG;

  const config = DEPARTMENT_CONFIGS[departmentName];
  if (config) return config;
  

    ...DEFAULT_DEPARTMENT_CONFIG,

  };


export function getDepartmentIcon(departmentName?: string) {
  const config = getDepartmentConfig(departmentName);

}

export const COMMON_DEPARTMENTS = [

  'Marketing',
  'Sales',
  'HR',

  'Operations',

  'Legal',

  'Executive',

];
