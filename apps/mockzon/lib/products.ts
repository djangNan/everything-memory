export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  blurb: string;
};

export const products: Product[] = [
  {
    id: "echo-dot",
    name: "Echo Dot (5th Gen)",
    category: "smart-home",
    price: 49,
    blurb: "Compact smart speaker with bigger sound.",
  },
  {
    id: "kindle",
    name: "Kindle Paperwhite",
    category: "ebook-readers",
    price: 159,
    blurb: "Glare-free 6.8\" display, 10-week battery.",
  },
  {
    id: "airpods-pro",
    name: "AirPods Pro (USB-C)",
    category: "audio",
    price: 229,
    blurb: "Active noise cancellation. Adaptive Audio.",
  },
  {
    id: "mx-master",
    name: "Logitech MX Master 3S",
    category: "accessories",
    price: 99,
    blurb: "Ergonomic, ultra-fast scrolling, quiet clicks.",
  },
  {
    id: "wh-1000xm5",
    name: "Sony WH-1000XM5",
    category: "audio",
    price: 348,
    blurb: "Industry-leading noise cancellation.",
  },
  {
    id: "lego-millennium-falcon",
    name: "LEGO Millennium Falcon",
    category: "toys",
    price: 169,
    blurb: "1,353 pieces. May the bricks be with you.",
  },
  {
    id: "levis-501",
    name: "Levi's 501 Original Jeans",
    category: "apparel",
    price: 69,
    blurb: "The blueprint of denim since 1873.",
  },
  {
    id: "yeti-tumbler",
    name: "YETI Rambler 30oz",
    category: "kitchen",
    price: 38,
    blurb: "Keeps cold drinks cold and hot drinks hot.",
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
