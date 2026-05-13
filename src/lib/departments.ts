import { 
  ChartBar, 
  Clipboa
  ClipboardText,
  Buildi
  Package,
  Handshake
  Gear,
  textColor:
  icon: typ
}

    name: 'Engineering',
    bgColor: 'o
    borderColor:
    description: '
  HR: {
    color: 'oklch(0.62
    textColor: 'oklch
    icon: Users,
}

    bgColor: 'oklch(0.58 0.18 120 / 0.1)',
    borderColor:
    name: 'Engineering',
  Support: {
    color: 'oklch(0.63 0.16 200)',
    textColor: 'oklch(0.43 0.13 200)',
    icon: Users,
  },
    name: 'Operations',
    
  HR: {
    description
  Product: {
    color: 'oklch(0.64 0.20 180)',
    textColor: 'oklch(0.44 0.16 180)',
    icon: Package,
    icon: Users,
    name: 'Legal',
    
    borderCo
    description: 'Le
  Research: {
    bgColor: 'oklch(0.58 0.18 120 / 0.1)',
    textColor: 'oklch(0.46 0.15 280)',
    icon: Flask,
  },
    name: 'Executive',
    
  Support: {
    description: 'Ex
    color: 'oklch(0.63 0.16 200)',
    color: 'oklch(0.61 0.19 160)',
    textColor: 'oklch(0.43 0.13 200)',
    icon: Handshake,
    icon: Users,

  },
  bgColor: 'okl
    name: 'Operations',
  description: 'Other departments'

  if (!departmentName) return DEFAULT_
    borderColor: 'oklch(0.56 0.16 300 / 0.3)',
    icon: Gear,
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
    icon: ClipboardText,
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
    textColor: 'oklch(0.32 0.12 30)',
    borderColor: 'oklch(0.52 0.14 30 / 0.3)',
    icon: Briefcase,
    description: 'Executive leadership and strategy'
  },
  Partnerships: {
    name: 'Partnerships',
    color: 'oklch(0.61 0.19 160)',
    bgColor: 'oklch(0.61 0.19 160 / 0.1)',
    textColor: 'oklch(0.41 0.15 160)',
    borderColor: 'oklch(0.61 0.19 160 / 0.3)',
    icon: Handshake,
    description: 'Strategic partnerships and alliances'
  }
};

export const DEFAULT_DEPARTMENT_CONFIG: DepartmentConfig = {
  name: 'Other',
  color: 'oklch(0.55 0.08 220)',
  bgColor: 'oklch(0.55 0.08 220 / 0.1)',
  textColor: 'oklch(0.35 0.06 220)',
  borderColor: 'oklch(0.55 0.08 220 / 0.3)',
  icon: Buildings,
  description: 'Other departments'
};

export function getDepartmentConfig(departmentName?: string): DepartmentConfig {
  if (!departmentName) return DEFAULT_DEPARTMENT_CONFIG;
  return DEPARTMENT_CONFIGS[departmentName] || {

    name: departmentName



export function getAllDepartments(): DepartmentConfig[] {
  return Object.values(DEPARTMENT_CONFIGS);
}

export function getDepartmentIcon(departmentName?: string) {
  const config = getDepartmentConfig(departmentName);
  return config.icon;
}

export function getDepartmentColor(departmentName?: string): string {
  const config = getDepartmentConfig(departmentName);



export function getDepartmentBgColor(departmentName?: string): string {
  const config = getDepartmentConfig(departmentName);
  return config.bgColor;


export function getDepartmentTextColor(departmentName?: string): string {
  const config = getDepartmentConfig(departmentName);
  return config.textColor;
}

export function getDepartmentBorderColor(departmentName?: string): string {
  const config = getDepartmentConfig(departmentName);
  return config.borderColor;
}
