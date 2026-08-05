export const supportedNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/facilities", label: "Facilities" },
  { href: "/inventory", label: "Inventory" },
  { href: "/purchase-orders", label: "Purchase Orders" },
] as const;

export const getRouteLabel = (pathname: string) => {
  const route = supportedNavigation.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return route?.label ?? "VitalTrack";
};
