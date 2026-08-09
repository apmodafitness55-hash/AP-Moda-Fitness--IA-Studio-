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

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_TEAM_MEMBERS = [
  { 
    id: 'usr-1', 
    name: 'Ana Paula Admin', 
    login: 'admin', 
    role: 'Admin', 
    password: 'Ap01695*', 
    details: 'Administradora Geral', 
    createdAt: '2026-01-01T00:00:00.000Z', 
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'usr-2', 
    name: 'Carla Oliveira', 
    login: 'carla', 
    role: 'Vendedor', 
    password: '123456', 
    details: 'Vendedora Sênior', 
    createdAt: '2026-01-02T00:00:00.000Z', 
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'usr-3', 
    name: 'Mariana Santos', 
    login: 'mariana', 
    role: 'Vendedor', 
    password: '123456', 
    details: 'Vendedora WhatsApp e Loja', 
    createdAt: '2026-01-03T00:00:00.000Z', 
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'usr-4', 
    name: 'Lucas Silva', 
    login: 'lucas', 
    role: 'Entregador', 
    password: '123456', 
    details: 'Entregador / Motoboy Express', 
    createdAt: '2026-01-04T00:00:00.000Z', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'usr-5', 
    name: 'Juliana Costa', 
    login: 'juliana', 
    role: 'Gerente', 
    password: '123456', 
    details: 'Gerente Comercial', 
    createdAt: '2026-01-05T00:00:00.000Z', 
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' 
  },
  { 
    id: 'usr-6', 
    name: 'Camila Parceira', 
    login: 'camila', 
    role: 'Parceiro', 
    password: '123456', 
    details: 'Influenciadora @camila_fit', 
    couponCode: 'CAMILA10', 
    createdAt: '2026-01-06T00:00:00.000Z', 
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' 
  }
];

