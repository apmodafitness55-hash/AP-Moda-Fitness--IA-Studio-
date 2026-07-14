import { Product, Sale, Client, Transaction } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Legging Glow Cós Anatômico',
    sku: 'LEG-GLOW-001',
    category: 'Calças e Leggings',
    price: 119.90,
    cost: 45.00,
    stock: 45,
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=80',
    salesCount: 22,
    colors: ['Preto', 'Bordô', 'Azul Marinho'],
    sizes: ['P', 'M', 'G'],
    description: 'Legging de alta compressão com cós anatômico modelador, ideal para treinos de alta intensidade.'
  },
  {
    id: 'prod-2',
    name: 'Top Cross Alta Sustentação',
    sku: 'TOP-CROSS-002',
    category: 'Tops',
    price: 89.90,
    cost: 30.00,
    stock: 38,
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80',
    salesCount: 15,
    colors: ['Preto', 'Rosa Neon', 'Branco'],
    sizes: ['P', 'M', 'G'],
    description: 'Top fitness com alças cruzadas que garantem excelente suporte e sustentação durante os treinos.'
  },
  {
    id: 'prod-3',
    name: 'Shorts Seamless Sculpt',
    sku: 'SH-SEAM-003',
    category: 'Shorts',
    price: 99.90,
    cost: 35.00,
    stock: 50,
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=600&q=80',
    salesCount: 19,
    colors: ['Cinza Mescla', 'Lilás', 'Verde Militar'],
    sizes: ['P', 'M', 'G'],
    description: 'Shorts sem costura com efeito sculpt que modela a silhueta com total conforto.'
  },
  {
    id: 'prod-4',
    name: 'Legging Ativa All-Black Cós Alto',
    sku: 'LEG-BLK-004',
    category: 'Calças e Leggings',
    price: 159.90,
    cost: 55.00,
    stock: 30,
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=600&q=80',
    salesCount: 30,
    colors: ['Preto'],
    sizes: ['P', 'M', 'G'],
    description: 'Legging All-Black com costuras reforçadas e bolso lateral discreto no cós.'
  },
  {
    id: 'prod-5',
    name: 'Top Sport Confort Alta Sustentação',
    sku: 'TOP-CONF-005',
    category: 'Tops',
    price: 99.90,
    cost: 32.00,
    stock: 25,
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    salesCount: 25,
    colors: ['Preto', 'Azul Bebê', 'Lilás'],
    sizes: ['P', 'M', 'G'],
    description: 'Top com tecido respirável e toque suave, alças largas e bojo removível.'
  },
  {
    id: 'prod-6',
    name: 'Shorts Biker Anatômico Alta Compressão',
    sku: 'SH-BIK-006',
    category: 'Shorts',
    price: 89.90,
    cost: 28.00,
    stock: 40,
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80',
    salesCount: 18,
    colors: ['Cinza Chumbo', 'Uva', 'Preto'],
    sizes: ['P', 'M', 'G'],
    description: 'Shorts modelo ciclista biker de média-alta compressão com tecido de toque gelado.'
  },
  {
    id: 'prod-7',
    name: 'Macacão Wave Sculpt Sem Costura',
    sku: 'MAC-WAVE-007',
    category: 'Macacões',
    price: 249.90,
    cost: 80.00,
    stock: 15,
    minStock: 3,
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80',
    salesCount: 12,
    colors: ['Preto', 'Azul Petróleo'],
    sizes: ['P', 'M', 'G'],
    description: 'Macacão fitness inteiriço premium com textura wave modeladora e costas abertas cruzadas.'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Gabriela Souza',
    email: 'gabriela.souza@gmail.com',
    phone: '(21) 98765-4321',
    channel: 'WhatsApp',
    totalSpent: 409.80,
    ordersCount: 2,
    createdAt: '2026-06-10T14:30:00Z',
    cashbackBalance: 20.49,
    vip: true
  },
  {
    id: 'cli-2',
    name: 'Ana Costa',
    email: 'ana.costa@outlook.com',
    phone: '(21) 99123-4567',
    channel: 'Instagram',
    totalSpent: 159.90,
    ordersCount: 1,
    createdAt: '2026-06-11T16:20:00Z',
    cashbackBalance: 8.00,
    vip: false
  },
  {
    id: 'cli-3',
    name: 'Beatriz Pereira',
    email: 'beatriz.p@gmail.com',
    phone: '(31) 98989-1234',
    channel: 'E-commerce',
    totalSpent: 189.80,
    ordersCount: 1,
    createdAt: '2026-06-12T10:15:00Z',
    cashbackBalance: 9.49,
    vip: false
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'ven-1',
    clientName: 'Gabriela Souza',
    channel: 'WhatsApp',
    items: [
      { productId: 'prod-1', name: 'Legging Glow Cós Anatômico', quantity: 1, price: 119.90, cost: 45.00 },
      { productId: 'prod-2', name: 'Top Cross Alta Sustentação', quantity: 1, price: 89.90, cost: 30.00 }
    ],
    total: 209.80,
    costTotal: 75.00,
    status: 'Concluída',
    createdAt: '2026-06-10T14:35:00Z',
    payments: [{ method: 'PIX', amount: 209.80 }],
    salesperson: 'Ana Carolina',
    deliveryMethod: 'Motoboy'
  },
  {
    id: 'ven-2',
    clientName: 'Ana Costa',
    channel: 'Instagram',
    items: [
      { productId: 'prod-4', name: 'Legging Ativa All-Black Cós Alto', quantity: 1, price: 159.90, cost: 55.00 }
    ],
    total: 159.90,
    costTotal: 55.00,
    status: 'Concluída',
    createdAt: '2026-06-11T16:25:00Z',
    payments: [{ method: 'Cartão de Crédito', amount: 159.90 }],
    salesperson: 'Beatriz Rocha',
    deliveryMethod: 'Correios'
  },
  {
    id: 'ven-3',
    clientName: 'Beatriz Pereira',
    channel: 'E-commerce',
    items: [
      { productId: 'prod-5', name: 'Top Sport Confort Alta Sustentação', quantity: 1, price: 99.90, cost: 32.00 },
      { productId: 'prod-6', name: 'Shorts Biker Anatômico Alta Compressão', quantity: 1, price: 89.90, cost: 28.00 }
    ],
    total: 189.80,
    costTotal: 60.00,
    status: 'Concluída',
    createdAt: '2026-06-12T10:20:00Z',
    payments: [{ method: 'PIX', amount: 189.80 }],
    salesperson: 'Juliana Costa',
    deliveryMethod: 'Retirada em Loja'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tr-1',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda no PIX - Gabriela Souza',
    amount: 209.80,
    date: '2026-06-10T14:35:00Z',
    status: 'pago'
  },
  {
    id: 'tr-2',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda no Crédito - Ana Costa',
    amount: 159.90,
    date: '2026-06-11T16:25:00Z',
    status: 'pago'
  },
  {
    id: 'tr-3',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda no PIX - Beatriz Pereira',
    amount: 189.80,
    date: '2026-06-12T10:20:00Z',
    status: 'pago'
  },
  {
    id: 'tr-4',
    type: 'Outflow',
    category: 'Insumos',
    description: 'Compra de Embalagens Personalizadas',
    amount: 150.00,
    date: '2026-06-13T09:00:00Z',
    status: 'pago'
  }
];
