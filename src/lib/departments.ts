import { 
  Users,
  Buildings,
  Briefcase,
  Handshake,
  Package,
  Flask,
  Scales,
  ChartLine
} from '@phosphor-icons/react';

export interface DepartmentConfig {
  name: string;
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
    icon: Buildings,
    description: 'Software engineering and development'
  },
  Marketing: {
    name: 'Marketing',
    color: 'oklch(0.65 0.22 340)',
    bgColor: 'oklch(0.65 0.22 340 / 0.1)',
    textColor: 'oklch(0.45 0.18 340)',
    borderColor: 'oklch(0.65 0.22 340 / 0.3)',
    icon: ChartLine,
    description: 'Marketing and brand management'
  },
  Sales: {
    name: 'Sales',
    color: 'oklch(0.58 0.18 120)',
    bgColor: 'oklch(0.58 0.18 120 / 0.1)',
    textColor: 'oklch(0.38 0.14 120)',
    borderColor: 'oklch(0.58 0.18 120 / 0.3)',
    icon: Handshake,
    description: 'Sales and business development'
  },
  HR: {
    name: 'HR',
    color: 'oklch(0.62 0.19 280)',
    bgColor: 'oklch(0.62 0.19 280 / 0.1)',
    textColor: 'oklch(0.42 0.15 280)',
    borderColor: 'oklch(0.62 0.19 280 / 0.3)',
    icon: Users,
    description: 'Human resources and people operations'
  },
  Support: {
    name: 'Support',
    color: 'oklch(0.63 0.16 200)',
    bgColor: 'oklch(0.63 0.16 200 / 0.1)',
    textColor: 'oklch(0.43 0.13 200)',
    borderColor: 'oklch(0.63 0.16 200 / 0.3)',
    icon: Users,
    description: 'Customer support and success'
  },
  Operations: {
    name: 'Operations',
    color: 'oklch(0.52 0.14 30)',
    bgColor: 'oklch(0.52 0.14 30 / 0.1)',
    textColor: 'oklch(0.32 0.10 30)',
    borderColor: 'oklch(0.52 0.14 30 / 0.3)',
    icon: Briefcase,
    description: 'Business operations and processes'
  },
  Product: {
    name: 'Product',
    color: 'oklch(0.64 0.20 180)',
    bgColor: 'oklch(0.64 0.20 180 / 0.1)',
    textColor: 'oklch(0.44 0.16 180)',
    borderColor: 'oklch(0.64 0.20 180 / 0.3)',
    icon: Package,
    description: 'Product strategy and development'
  },
  Legal: {
    name: 'Legal',
    color: 'oklch(0.50 0.12 240)',
    bgColor: 'oklch(0.50 0.12 240 / 0.1)',
    textColor: 'oklch(0.30 0.10 240)',
    borderColor: 'oklch(0.50 0.12 240 / 0.3)',
    icon: Scales,
    description: 'Legal compliance and contracts'
  },
  Research: {
    name: 'Research',
    color: 'oklch(0.66 0.18 280)',
    bgColor: 'oklch(0.66 0.18 280 / 0.1)',
    textColor: 'oklch(0.46 0.15 280)',
    borderColor: 'oklch(0.66 0.18 280 / 0.3)',
    icon: Flask,
    description: 'Research and development'
  },
  Executive: {
    name: 'Executive',
    color: 'oklch(0.52 0.14 30)',
    bgColor: 'oklch(0.52 0.14 30 / 0.1)',
    textColor: 'oklch(0.32 0.10 30)',
    borderColor: 'oklch(0.52 0.14 30 / 0.3)',
    icon: Briefcase,
    description: 'Executive leadership and strategy'
  },
  Partnerships: {
    name: 'Partnerships',
    color: 'oklch(0.61 0.19 160)',
    bgColor: 'oklch(0.61 0.19 160 / 0.1)',
    textColor: 'oklch(0.41 0.16 160)',
    borderColor: 'oklch(0.61 0.19 160 / 0.3)',
    icon: Handshake,
    description: 'Strategic partnerships and alliances'
  }
};

const DEFAULT_DEPARTMENT_CONFIG: DepartmentConfig = {
  name: 'Other',
  color: 'oklch(0.55 0.10 220)',
  bgColor: 'oklch(0.55 0.10 220 / 0.1)',
  textColor: 'oklch(0.35 0.08 220)',
  borderColor: 'oklch(0.55 0.10 220 / 0.3)',
  icon: Buildings,
  description: 'Other department'
};

export function getDepartmentConfig(departmentName?: string): DepartmentConfig {
  if (!departmentName) return DEFAULT_DEPARTMENT_CONFIG;

  const config = DEPARTMENT_CONFIGS[departmentName];
  if (config) return config;
  
  return {
    ...DEFAULT_DEPARTMENT_CONFIG,
    name: departmentName
  };
}

export function getDepartmentIcon(departmentName?: string) {
  const config = getDepartmentConfig(departmentName);
  return config.icon;
}

export function getAllDepartments(): string[] {
  return Object.keys(DEPARTMENT_CONFIGS);
}

export const COMMON_DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'HR',
  'Support',
  'Operations',
  'Product',
  'Legal',
  'Research',
  'Executive',
  'Partnerships'
];
