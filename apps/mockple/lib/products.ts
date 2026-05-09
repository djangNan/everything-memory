export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  blurb: string;
};

export const products: Product[] = [
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    category: "phones",
    price: 1199,
    blurb: "Titanium. So strong. So light. So Pro.",
  },
  {
    id: "macbook-air",
    name: "MacBook Air",
    category: "laptops",
    price: 999,
    blurb: "Lean. Mean. M3 machine.",
  },
  {
    id: "ipad",
    name: "iPad",
    category: "tablets",
    price: 449,
    blurb: "Lovable. Drawable. Magical.",
  },
  {
    id: "airpods",
    name: "AirPods Pro",
    category: "audio",
    price: 249,
    blurb: "Adaptive Audio. Now playing.",
  },
  {
    id: "apple-watch",
    name: "Apple Watch Ultra 2",
    category: "watches",
    price: 799,
    blurb: "The most rugged Apple Watch.",
  },
  {
    id: "imac",
    name: "iMac",
    category: "desktops",
    price: 1299,
    blurb: "Hello (again).",
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
