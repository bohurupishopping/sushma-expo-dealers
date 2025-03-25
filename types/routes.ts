export type AppRoute = '/' | '/orders' | '/finance' | '/profile' | '/processing';

export type NavItem = {
  title: string;
  description: string;
  icon: React.ElementType;
  route: AppRoute;
  color: string;
  gradient: [string, string];
}; 