export interface NavigationItem {
  title: string;
  url: string;
  isActive?: boolean;
}

export interface NavigationSection {
  title: string;
  url: string;
  items?: NavigationItem[];
}
