import { Product, Sale, Client, Transaction } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    "id": "prod-1783018503677",
    "name": "Calça Legging",
    "sku": "CALÇA-LEGG-SCUL",
    "category": "Leggings",
    "price": 49.99,
    "cost": 19,
    "stock": 20,
    "image": "https://i.ibb.co/HDJgD4rc/1000568172-jpg.jpg",
    "images": [
      "https://i.ibb.co/HDJgD4rc/1000568172-jpg.jpg",
      "https://i.ibb.co/wNWHZHvr/1000568173-jpg.jpg",
      "https://i.ibb.co/s9xKPwRj/1000568174-jpg.jpg",
      "https://i.ibb.co/My0W0wmG/1000568175-jpg.jpg"
    ],
    "description": "Confeccionadas em tecido suplex power de 310g, nossas peças garantem alta elasticidade, ajuste perfeito ao corpo e zero transparência. O tecido é resistente, confortável e ideal para quem busca performance e estilo.\n\n\nDetalhes:\n✔️ Tecido: Suplex Power 310g\n✔️ Composição: 90% Poliéster, 10% Elastano\n✔️ Bojo: Removível\n✔️ Elasticidade incrível e modelagem ajustada\n✔️ Zero transparência e alta durabilidade\n\n\nTamanhos:\n\nP --> Veste do\t34\tao\t36\nM\t--> Veste do\t38\tao\t40\nG\t--> Veste do\t42\tao\t44\nPs\t--> Veste do\t46\tao\t50\n \nCuidados:\n🧼 Lavar à mão com sabão neutro\n🚫 Não deixar de molho\n⚠️ As cor1es podem variar conforme o brilho da tela",
    "colors": [
      "Vermelho",
      "Azul Marinho",
      "Verde",
      "Fucsia",
      "Roxo",
      "Marrom",
      "Preto",
      "Lilás",
      "Bege",
      "Rosa",
      "Cinza"
    ],
    "sizes": [
      "P",
      "M"
    ],
    "created_at": "2026-07-02T18:55:04.135435+00:00",
    "size_colors": {},
    "minStock": 5,
    "salesCount": 0,
    "videoUrl": "",
    "color_stocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 0,
      "Cinza": 0,
      "Preto": 4,
      "Verde": 4,
      "Fucsia": 4,
      "Lilás": 0,
      "Marrom": 0,
      "Vermelho": 4,
      "Azul Marinho": 3
    },
    "size_color_stocks": {
      "M": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 2,
        "Verde": 2,
        "Fucsia": 2,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 2,
        "Azul Marinho": 1
      },
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 2,
        "Verde": 2,
        "Fucsia": 2,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 2,
        "Azul Marinho": 2
      }
    },
    "sizeColors": {},
    "colorStocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 0,
      "Cinza": 0,
      "Preto": 4,
      "Verde": 4,
      "Fucsia": 4,
      "Lilás": 0,
      "Marrom": 0,
      "Vermelho": 4,
      "Azul Marinho": 3
    },
    "sizeColorStocks": {
      "M": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 2,
        "Verde": 2,
        "Fucsia": 2,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 2,
        "Azul Marinho": 1
      },
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 2,
        "Verde": 2,
        "Fucsia": 2,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 2,
        "Azul Marinho": 2
      }
    }
  },
  {
    "id": "prod-1783017531559",
    "name": "Conj. Run Top & Calça",
    "sku": "CONJ-RUM-TOP+CALÇA-SCUL",
    "category": "Conjuntos",
    "price": 129.9,
    "cost": 39,
    "stock": 7,
    "image": "https://i.ibb.co/LhHzK5LR/1000568169-jpg.jpg",
    "images": [
      "https://i.ibb.co/LhHzK5LR/1000568169-jpg.jpg",
      "https://i.ibb.co/Xr00T2Xg/1000568168-jpg.jpg",
      "https://i.ibb.co/tp526HqS/1000568165-jpg.jpg",
      "https://i.ibb.co/ZRjQzpSd/1000568170-jpg.jpg",
      "https://i.ibb.co/TMNN4GR0/1000568171-jpg.jpg"
    ],
    "description": "Confeccionadas em tecido suplex power de 310g, nossas peças garantem alta elasticidade, ajuste perfeito ao corpo e zero transparência. O tecido é resistente, confortável e ideal para quem busca performance e estilo.\n\n\nDetalhes:\n✔️ Tecido: Suplex Power 310g\n✔️ Composição: 90% Poliéster, 10% Elastano\n✔️ Bojo: Removível\n✔️ Elasticidade incrível e modelagem ajustada\n✔️ Zero transparência e alta durabilidade\n\n\nTamanhos:\n\nP\t--> Veste do\t34\tao\t36\nM\t--i Veste do\t38\tao\t40\nG\t--> Veste do\t42\tao\t44\nPs\t--> Veste do\t46\tao\t50\n \nCuidados:\n🧼 Lavar à mão com sabão neutro\n🚫 Não deixar de molho\n⚠️ As cor1es podem variar conforme o brilho da tela",
    "colors": [
      "Vermelho",
      "Azul Marinho",
      "Verde",
      "Fucsia",
      "Roxo",
      "Marrom",
      "Preto",
      "Lilás",
      "Bege",
      "Rosa",
      "Cinza"
    ],
    "sizes": [
      "P",
      "M"
    ],
    "created_at": "2026-07-02T18:38:52.416236+00:00",
    "size_colors": {},
    "minStock": 5,
    "salesCount": 0,
    "videoUrl": "",
    "color_stocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 0,
      "Cinza": 1,
      "Preto": 1,
      "Verde": 2,
      "Fucsia": 0,
      "Lilás": 0,
      "Marrom": 1,
      "Vermelho": 2,
      "Azul Marinho": 0
    },
    "size_color_stocks": {
      "M": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 1,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 1,
        "Azul Marinho": 0
      },
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 1,
        "Preto": 0,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 1,
        "Vermelho": 1,
        "Azul Marinho": 0
      }
    },
    "sizeColors": {},
    "colorStocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 0,
      "Cinza": 1,
      "Preto": 1,
      "Verde": 2,
      "Fucsia": 0,
      "Lilás": 0,
      "Marrom": 1,
      "Vermelho": 2,
      "Azul Marinho": 0
    },
    "sizeColorStocks": {
      "M": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 1,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 1,
        "Azul Marinho": 0
      },
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 1,
        "Preto": 0,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 1,
        "Vermelho": 1,
        "Azul Marinho": 0
      }
    }
  },
  {
    "id": "prod-1783019204672",
    "name": "Conj. Top & Short EBB",
    "sku": "CONJ-TOP+SHORT-EBB-SCUL",
    "category": "Conjuntos EBB (Empina Bumbum)",
    "price": 74.9,
    "cost": 28,
    "stock": 9,
    "image": "https://i.ibb.co/Zp32MkxN/1000568201-jpg.jpg",
    "images": [
      "https://i.ibb.co/Zp32MkxN/1000568201-jpg.jpg",
      "https://i.ibb.co/99Np0v6Y/1000568202-jpg.jpg",
      "https://i.ibb.co/bgJhqmTM/1000568209-jpg.jpg",
      "https://i.ibb.co/21gdGL63/1000568210-jpg.jpg",
      "https://i.ibb.co/gZLfmq3k/1000568211-jpg.jpg",
      "https://i.ibb.co/WpjtXg4k/1000568212-jpg.jpg"
    ],
    "description": "Confeccionadas em tecido suplex power de 310g, nossas peças garantem alta elasticidade, ajuste perfeito ao corpo e zero transparência. O tecido é resistente, confortável e ideal para quem busca performance e estilo.\n\n\nDetalhes:\n✔️ Tecido: Suplex Power 310g\n✔️ Composição: 90% Poliéster, 10% Elastano\n✔️ Bojo: Removível\n✔️ Elasticidade incrível e modelagem ajustada\n✔️ Zero transparência e alta durabilidade\n\n\nTamanhos:\n\nP --> Veste do\t34\tao\t36\nM\t--> Veste do\t38\tao\t40\nG\t--> Veste do\t42\tao\t44\nPs\t--> Veste do\t46\tao\t50\n \nCuidados:\n🧼 Lavar à mão com sabão neutro\n🚫 Não deixar de molho\n⚠️ As cor1es podem variar conforme o brilho da tela",
    "colors": [
      "Vermelho",
      "Azul Marinho",
      "Verde",
      "Fucsia",
      "Roxo",
      "Marrom",
      "Preto",
      "Lilás",
      "Bege",
      "Rosa",
      "Cinza"
    ],
    "sizes": [
      "P",
      "M"
    ],
    "created_at": "2026-07-02T19:06:44.834524+00:00",
    "size_colors": {},
    "minStock": 5,
    "salesCount": 0,
    "videoUrl": "",
    "color_stocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 2,
      "Cinza": 0,
      "Preto": 3,
      "Verde": 2,
      "Fucsia": 0,
      "Lilás": 0,
      "Marrom": 0,
      "Vermelho": 1,
      "Azul Marinho": 1
    },
    "size_color_stocks": {
      "M": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 1,
        "Cinza": 0,
        "Preto": 2,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 0,
        "Azul Marinho": 1
      },
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 1,
        "Cinza": 0,
        "Preto": 1,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 1,
        "Azul Marinho": 0
      }
    },
    "sizeColors": {},
    "colorStocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 2,
      "Cinza": 0,
      "Preto": 3,
      "Verde": 2,
      "Fucsia": 0,
      "Lilás": 0,
      "Marrom": 0,
      "Vermelho": 1,
      "Azul Marinho": 1
    },
    "sizeColorStocks": {
      "M": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 1,
        "Cinza": 0,
        "Preto": 2,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 0,
        "Azul Marinho": 1
      },
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 1,
        "Cinza": 0,
        "Preto": 1,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 1,
        "Azul Marinho": 0
      }
    }
  },
  {
    "id": "prod-1783020106428",
    "name": "Top Alça Sem Bojo - Slim Fit",
    "sku": "TOP-SCUL",
    "category": "Tops",
    "price": 35.9,
    "cost": 8.5,
    "stock": 13,
    "image": "https://i.ibb.co/m58BgDwx/1000568220-jpg.jpg",
    "images": [
      "https://i.ibb.co/m58BgDwx/1000568220-jpg.jpg",
      "https://i.ibb.co/prdxL6M2/1000568219-jpg.jpg",
      "https://i.ibb.co/201vr0Sr/1000568222-jpg.jpg",
      "https://i.ibb.co/mrg5q3CH/1000568221-jpg.jpg",
      "https://i.ibb.co/99Np0v6Y/1000568202-jpg.jpg"
    ],
    "description": "Confeccionadas em tecido suplex power de 310g, nossas peças garantem alta elasticidade, ajuste perfeito ao corpo e zero transparência. O tecido é resistente, confortável e ideal para quem busca performance e estilo.\n\n\nDetalhes:\n✔️ Tecido: Suplex Power 310g\n✔️ Composição: 90% Poliéster, 10% Elastano\n✔️ Bojo: Removível\n✔️ Elasticidade incrível e modelagem ajustada\n✔️ Zero transparência e alta durabilidade\n\n\nTamanhos:\n\nP --> Veste do\t34\tao\t36\nM\t--> Veste do\t38\tao\t40\nG\t--> Veste do\t42\tao\t44\nPs\t--> Veste do\t46\tao\t50\n \nCuidados:\n🧼 Lavar à mão com sabão neutro\n🚫 Não deixar de molho\n⚠️ As cor1es podem variar conforme o brilho da tela",
    "colors": [
      "Vermelho",
      "Azul Marinho",
      "Verde",
      "Fucsia",
      "Roxo",
      "Marrom",
      "Preto",
      "Lilás",
      "Bege",
      "Rosa",
      "Cinza"
    ],
    "sizes": [
      "P"
    ],
    "created_at": "2026-07-02T19:21:46.994861+00:00",
    "size_colors": {},
    "minStock": 5,
    "salesCount": 1,
    "videoUrl": "",
    "color_stocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 0,
      "Cinza": 0,
      "Preto": 3,
      "Verde": 3,
      "Fucsia": 0,
      "Lilás": 0,
      "Marrom": 3,
      "Vermelho": 1,
      "Azul Marinho": 2
    },
    "size_color_stocks": {
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 3,
        "Verde": 3,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 3,
        "Vermelho": 1,
        "Azul Marinho": 2
      }
    },
    "sizeColors": {},
    "colorStocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 0,
      "Cinza": 0,
      "Preto": 3,
      "Verde": 3,
      "Fucsia": 0,
      "Lilás": 0,
      "Marrom": 3,
      "Vermelho": 1,
      "Azul Marinho": 2
    },
    "sizeColorStocks": {
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 3,
        "Verde": 3,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 3,
        "Vermelho": 1,
        "Azul Marinho": 2
      }
    }
  },
  {
    "id": "prod-1782180430648",
    "name": "Conj. Top & Short - Slim Fit",
    "sku": "CTSHOR",
    "category": "Conjuntos",
    "price": 72.9,
    "cost": 28,
    "stock": 4,
    "image": "https://i.ibb.co/TD0d9fhc/1000568002-jpg.jpg",
    "images": [
      "https://i.ibb.co/TD0d9fhc/1000568002-jpg.jpg",
      "https://i.ibb.co/r2NfRMpY/1000568001-jpg.jpg",
      "https://i.ibb.co/Fbgc6852/1000567988-jpg.jpg",
      "https://i.ibb.co/5Xn1PYDC/1000567989-jpg.jpg"
    ],
    "description": "Confeccionadas em tecido suplex power de 310g, nossas peças garantem alta elasticidade, ajuste perfeito ao corpo e zero transparência. O tecido é resistente, confortável e ideal para quem busca performance e estilo.\n\n\nDetalhes:\n✔️ Tecido: Suplex Power 310g\n✔️ Composição: 90% Poliéster, 10% Elastano\n✔️ Bojo: Removível\n✔️ Elasticidade incrível e modelagem ajustada\n✔️ Zero transparência e alta durabilidade\n\n\nTamanhos:\n\nP --> Veste do\t34\tao\t36\nM\t--> Veste do\t38\tao\t40\nG\t--> Veste do\t42\tao\t44\nPs\t--> Veste do\t46\tao\t50\n \nCuidados:\n🧼 Lavar à mão com sabão neutro\n🚫 Não deixar de molho\n⚠️ As cor1es podem variar conforme o brilho da tela",
    "colors": [
      "Vermelho",
      "Azul Marinho",
      "Verde",
      "Fucsia",
      "Roxo",
      "Marrom",
      "Preto",
      "Lilás",
      "Bege",
      "Rosa",
      "Cinza"
    ],
    "sizes": [
      "P",
      "M"
    ],
    "created_at": "2026-06-25T18:15:37.637129+00:00",
    "size_colors": {},
    "minStock": 1,
    "salesCount": 0,
    "videoUrl": "",
    "color_stocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 0,
      "Cinza": 0,
      "Preto": 2,
      "Verde": 1,
      "Fucsia": 1,
      "Lilás": 0,
      "Marrom": 0,
      "Vermelho": 0,
      "Azul Marinho": 0
    },
    "size_color_stocks": {
      "M": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 1,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 0,
        "Azul Marinho": 0
      },
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 1,
        "Verde": 0,
        "Fucsia": 1,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 0,
        "Azul Marinho": 0
      }
    },
    "sizeColors": {},
    "colorStocks": {
      "Bege": 0,
      "Rosa": 0,
      "Roxo": 0,
      "Cinza": 0,
      "Preto": 2,
      "Verde": 1,
      "Fucsia": 1,
      "Lilás": 0,
      "Marrom": 0,
      "Vermelho": 0,
      "Azul Marinho": 0
    },
    "sizeColorStocks": {
      "M": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 1,
        "Verde": 1,
        "Fucsia": 0,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 0,
        "Azul Marinho": 0
      },
      "P": {
        "Bege": 0,
        "Rosa": 0,
        "Roxo": 0,
        "Cinza": 0,
        "Preto": 1,
        "Verde": 0,
        "Fucsia": 1,
        "Lilás": 0,
        "Marrom": 0,
        "Vermelho": 0,
        "Azul Marinho": 0
      }
    }
  },
  {
    "id": "prod-1782562708664",
    "name": "Blusa Dry-Fit 100% Poliamida",
    "sku": "BLU-POLI-SCUL",
    "category": "Blusa Dry-Fit",
    "price": 44.9,
    "cost": 18,
    "stock": 28,
    "image": "https://i.ibb.co/wFq85JLW/1000536691.jpg",
    "images": [
      "https://i.ibb.co/wFq85JLW/1000536691.jpg",
      "https://i.ibb.co/8L3JKttr/1000536692.jpg"
    ],
    "description": "DESCRIÇÃO\nFeitas com tecido 100% poliamida, nossas regatas e blusas são super macias, leves e respiráveis. Perfeitas para atividades físicas, elas secam rapidamente e proporcionam conforto ao longo do dia.\n\nDetalhes:\n\n✔️ Tecido: Poliamida 100%\n✔️ Gramatura: 280g\n✔️ Toque macio e Respirável\n\n\nTamanhos Disponíveis:\n\nP – Veste do 34 ao 36\nM – Veste do 38 ao 40\nG – Veste do 42 ao 44\nPlus Size – Veste do 46 ao 50\n\nCuidados:\n🧼 Lavar à mão com sabão neutro\n🚫 Não deixar de molho\n⚠️ As cores podem variar conforme o brilho da tela",
    "colors": [
      "Preto",
      "Lilás",
      "Marrom",
      "Verde",
      "Vermelho",
      "Fucsia"
    ],
    "sizes": [
      "P",
      "M"
    ],
    "created_at": "2026-06-27T12:18:28.884371+00:00",
    "size_colors": {},
    "minStock": 5,
    "salesCount": 0,
    "videoUrl": "",
    "color_stocks": {
      "Preto": 3,
      "Verde": 8,
      "Fucsia": 4,
      "Lilás": 5,
      "Marrom": 3,
      "Vermelho": 3
    },
    "size_color_stocks": {
      "M": {
        "Preto": 3,
        "Verde": 4,
        "Fucsia": 3,
        "Lilás": 3,
        "Marrom": 0,
        "Vermelho": 3
      },
      "P": {
        "Preto": 0,
        "Verde": 4,
        "Fucsia": 1,
        "Lilás": 2,
        "Marrom": 3,
        "Vermelho": 0
      }
    },
    "sizeColors": {},
    "colorStocks": {
      "Preto": 3,
      "Verde": 8,
      "Fucsia": 4,
      "Lilás": 5,
      "Marrom": 3,
      "Vermelho": 3
    },
    "sizeColorStocks": {
      "M": {
        "Preto": 3,
        "Verde": 4,
        "Fucsia": 3,
        "Lilás": 3,
        "Marrom": 0,
        "Vermelho": 3
      },
      "P": {
        "Preto": 0,
        "Verde": 4,
        "Fucsia": 1,
        "Lilás": 2,
        "Marrom": 3,
        "Vermelho": 0
      }
    }
  },
  {
    "id": "prod-1782825544494",
    "name": "Cropped Dry-Fit 100% Poliamida",
    "sku": "CROP-POLI-SCUL",
    "category": "Regatas",
    "price": 37.9,
    "cost": 13,
    "stock": 19,
    "image": "https://i.ibb.co/TD0d9fhc/1000568002-jpg.jpg",
    "images": [
      "https://i.ibb.co/TD0d9fhc/1000568002-jpg.jpg"
    ],
    "description": "0\n\nPágina inicial\n Coleção Gym Fit\n Cropped Dry Fit\nCropped Dry Fit\nCód.: CRO01\n\n (0)\nR$11,00\nAzul Marinho\nM\n\nAvise-meAzul Royal\nM\n\n33\nBranco\nM\n\n5\nChumbo\nM\n\n9\nFúcsia\nM\n\n86\nLilás\nM\n\n82\nPreto\nM\n\n26\nRosa Chiclete\nM\n\n9\nRosa Neon\nM\n\nAvise-meRosa Pink\nM\n\nAvise-meVerde Neon\nM\n\nAvise-meVermelho\nM\n\n61\nADICIONAR AO CARRINHO\nCalcular frete e prazo\n\nDigite seu CEP\nOK\nDESCRIÇÃO\nFeitas com tecido 100% poliamida, nossas regatas e blusas são super macias, leves e respiráveis. Perfeitas para atividades físicas, elas secam rapidamente e proporcionam conforto ao longo do dia.\n\nDetalhes:\n\n✔️ Tecido: Poliamida 100%\n✔️ Gramatura: 280g\n✔️ Toque macio e Respirável\n\n\nTamanhos Disponíveis:\n\nP – Veste do 34 ao 36\nM – Veste do 38 ao 40\nG – Veste do 42 ao 44\nPlus Size – Veste do 46 ao 50\n\nCuidados:\n🧼 Lavar à mão com sabão neutro\n🚫 Não deixar de molho\n⚠️ As cores podem variar conforme o brilho da tela",
    "colors": [
      "VERMELHO",
      "AZUL MARINHO",
      "VERDE",
      "FUCSIA",
      "MARROM",
      "PRETO",
      "Lilás",
      "BEGE",
      "ROSA"
    ],
    "sizes": [
      "M"
    ],
    "created_at": "2026-06-30T13:19:09.120612+00:00",
    "size_colors": {},
    "minStock": 5,
    "salesCount": 0,
    "videoUrl": "",
    "color_stocks": {
      "BEGE": 2,
      "ROSA": 1,
      "PRETO": 3,
      "VERDE": 2,
      "FUCSIA": 2,
      "Lilás": 2,
      "MARROM": 1,
      "VERMELHO": 3,
      "AZUL MARINHO": 1
    },
    "size_color_stocks": {
      "M": {
        "BEGE": 2,
        "ROSA": 1,
        "PRETO": 3,
        "VERDE": 2,
        "FUCSIA": 2,
        "Lilás": 2,
        "MARROM": 1,
        "VERMELHO": 3,
        "AZUL MARINHO": 1
      }
    },
    "sizeColors": {},
    "colorStocks": {
      "BEGE": 2,
      "ROSA": 1,
      "PRETO": 3,
      "VERDE": 2,
      "FUCSIA": 2,
      "Lilás": 2,
      "MARROM": 1,
      "VERMELHO": 3,
      "AZUL MARINHO": 1
    },
    "sizeColorStocks": {
      "M": {
        "BEGE": 2,
        "ROSA": 1,
        "PRETO": 3,
        "VERDE": 2,
        "FUCSIA": 2,
        "Lilás": 2,
        "MARROM": 1,
        "VERMELHO": 3,
        "AZUL MARINHO": 1
      }
    }
  },
  {
    "id": "prod-macacao-curto-run",
    "name": "Macacão Curto - Run",
    "sku": "MAC-RUN-CURTO-01",
    "category": "Macacões",
    "price": 72.90,
    "compare_at_price": 89.90,
    "cost": 32.00,
    "stock": 0,
    "minStock": 5,
    "salesCount": 14,
    "image": "",
    "images": [],
    "description": "Macacão fitness curto Coleção Run de alta sustentação e modelagem impecável. Tecido com toque aveludado e compressão na medida certa.\n\nDetalhes:\n✔️ Compressão anatômica\n✔️ Modelagem confortável sem transparência\n✔️ Ideal para treinos de corrida e academia",
    "colors": [
      "Roxo",
      "Preto",
      "Azul Marinho"
    ],
    "sizes": [
      "P",
      "M",
      "G"
    ],
    "created_at": "2026-07-02T19:30:00.000Z"
  },
  {
    "id": "prod-macacao-longo-run",
    "name": "Macacão Longo - Run",
    "sku": "MAC-RUN-LONGO-02",
    "category": "Macacões",
    "price": 74.90,
    "compare_at_price": 94.90,
    "cost": 34.00,
    "stock": 0,
    "minStock": 5,
    "salesCount": 18,
    "image": "",
    "images": [],
    "description": "Macacão longo modelador Coleção Run. Cós duplo com alta compressão, valoriza a silhueta e proporciona conforto máximo nos treinos.\n\nDetalhes:\n✔️ Modela sem marcar\n✔️ Tecido térmico e respirável\n✔️ Zero transparência garantida",
    "colors": [
      "Marrom",
      "Preto",
      "Verde Militar"
    ],
    "sizes": [
      "P",
      "M",
      "G"
    ],
    "created_at": "2026-07-02T19:35:00.000Z"
  },
  {
    "id": "prod-conj-top-calca-slim",
    "name": "conj top + calça slim",
    "sku": "CONJ-TOP-CALCA-SLIM",
    "category": "Conjuntos",
    "price": 59.90,
    "compare_at_price": 89.90,
    "cost": 25.00,
    "stock": 0,
    "minStock": 5,
    "salesCount": 16,
    "image": "",
    "images": [],
    "description": "Conjunto completo Top + Calça Slim Fit de alta compressão modeladora com caimento perfeito.",
    "colors": [
      "Preto",
      "Cinza",
      "Azul Marinho"
    ],
    "sizes": [
      "P",
      "M"
    ],
    "created_at": "2026-07-02T19:40:00.000Z"
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-amaro',
    name: 'Amaro Honório Pereira Neto',
    email: 'amaro.honorio@gmail.com',
    phone: '84 99146-8136',
    cpf: '016.956.564-58',
    channel: 'Loja Online',
    addressStreet: 'Travessa José Jorge',
    addressNum: '51',
    addressBairro: 'Centro',
    addressCidade: 'São José de Mipibu',
    addressEstado: 'RN',
    addressCep: '59162-000',
    totalSpent: 363.80,
    ordersCount: 2,
    createdAt: '2026-07-20T21:04:15.059Z'
  },
  {
    id: 'cli-cinthia',
    name: 'Cinthia Rodrigues da Silva',
    email: 'cinthia.rodrigues@gmail.com',
    phone: '(84) 99198-2963',
    channel: 'Loja Online',
    totalSpent: 51.21,
    ordersCount: 1,
    createdAt: '2026-07-10T21:58:05.892Z'
  },
  {
    id: 'cli-pericles',
    name: 'pericles ramos',
    email: 'pericles.ramos@gmail.com',
    phone: '(84) 99198-2963',
    channel: 'Loja Online',
    totalSpent: 44.90,
    ordersCount: 1,
    createdAt: '2026-07-10T14:06:08.324Z'
  },
  {
    id: 'cli-carla',
    name: 'Carla Oliveira',
    email: 'carla.oliveira@gmail.com',
    phone: '(84) 99198-2963',
    channel: 'PDV',
    totalSpent: 209.80,
    ordersCount: 1,
    createdAt: '2026-07-10T14:04:54.907Z'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'V-00892',
    clientName: 'Cinthia Rodrigues da Silva',
    clientDoc: '',
    channel: 'Loja Online',
    items: [
      {
        productId: 'prod-1783018503677',
        name: 'Calça Legging',
        quantity: 1,
        price: 51.21,
        cost: 19.00
      }
    ],
    total: 51.21,
    costTotal: 19.00,
    status: 'Concluída',
    createdAt: '2026-07-10T21:58:05.892Z',
    payments: [{ method: 'PIX', amount: 51.21 }],
    salesperson: 'E-commerce',
    deliveryMethod: 'Correios',
    address: 'Travessa Jose Jorge, 51, Centro - Sao Jose de Mipibu/RN',
    tipo_envio: 'correios',
    status_logistico: 'pendente',
    valor_bruto: 51.21,
    taxa_financeira: 0.00,
    valor_liquido: 51.21
  },
  {
    id: 'V-00688',
    clientName: 'pericles ramos',
    clientDoc: '',
    channel: 'Loja Online',
    items: [
      {
        productId: 'prod-1783018503677',
        name: 'Calça Legging',
        quantity: 1,
        price: 47.49,
        cost: 19.00
      }
    ],
    total: 47.49,
    costTotal: 19.00,
    status: 'Cancelada',
    createdAt: '2026-07-10T21:13:14.688Z',
    payments: [{ method: 'PIX', amount: 47.49 }],
    salesperson: 'E-commerce',
    deliveryMethod: 'Correios',
    notes: 'Venda estornada / cancelada pelo cliente'
  },
  {
    id: 'V-00398',
    clientName: 'pericles',
    clientDoc: '',
    channel: 'Loja Online',
    items: [
      {
        productId: 'prod-1783018503677',
        name: 'Calça Legging',
        quantity: 1,
        price: 44.90,
        cost: 19.00
      }
    ],
    total: 44.90,
    costTotal: 19.00,
    status: 'Concluída',
    createdAt: '2026-07-10T14:18:42.398Z',
    payments: [{ method: 'InfinitePay', amount: 44.90 }],
    salesperson: 'E-commerce',
    deliveryMethod: 'Correios'
  },
  {
    id: 'V-00012',
    clientName: 'pericles',
    clientDoc: '',
    channel: 'Loja Online',
    items: [
      {
        productId: 'prod-1783018503677',
        name: 'Calça Legging',
        quantity: 1,
        price: 37.90,
        cost: 19.00
      }
    ],
    total: 37.90,
    costTotal: 19.00,
    status: 'Cancelada',
    createdAt: '2026-07-10T14:07:34.012Z',
    payments: [{ method: 'InfinitePay', amount: 37.90 }],
    salesperson: 'E-commerce',
    notes: 'Venda estornada'
  },
  {
    id: 'V-00324',
    clientName: 'pericles',
    clientDoc: '',
    channel: 'Loja Online',
    items: [
      {
        productId: 'prod-1783018503677',
        name: 'Calça Legging',
        quantity: 1,
        price: 37.90,
        cost: 19.00
      }
    ],
    total: 37.90,
    costTotal: 19.00,
    status: 'Cancelada',
    createdAt: '2026-07-10T14:06:08.324Z',
    payments: [{ method: 'InfinitePay', amount: 37.90 }],
    salesperson: 'E-commerce',
    notes: 'Venda estornada'
  },
  {
    id: 'SALE-COND-1783692294907',
    clientName: 'Carla Oliveira',
    clientDoc: '',
    channel: 'PDV',
    items: [
      {
        productId: 'prod-1783017531559',
        name: 'Conj. Run Top & Calça',
        quantity: 1,
        price: 129.90,
        cost: 39.00
      },
      {
        productId: 'prod-1783017014631',
        name: 'Conj. Top & Short EBB',
        quantity: 1,
        price: 49.90,
        cost: 20.00
      },
      {
        productId: 'prod-1783018784358',
        name: 'Top Alça Sem Bojo - Slim Fit',
        quantity: 1,
        price: 30.00,
        cost: 10.00
      }
    ],
    total: 209.80,
    costTotal: 69.00,
    status: 'Concluída',
    createdAt: '2026-07-10T14:04:54.907Z',
    payments: [{ method: 'Dinheiro', amount: 209.80 }],
    salesperson: 'AP Moda Fitness'
  },
  {
    id: 'ped-web-6664',
    clientName: 'Amaro Honório Pereira Neto',
    clientDoc: '016.956.564-58',
    channel: 'Loja Online',
    items: [
      {
        productId: 'prod-7',
        name: 'Macacão Wave Sculpt Sem Costura (Preto - P)',
        quantity: 1,
        price: 249.90,
        cost: 80.00
      }
    ],
    total: 249.90,
    costTotal: 80.00,
    status: 'Pendente',
    createdAt: '2026-07-20T21:08:17.598Z',
    payments: [{ method: 'Cartão de Crédito', amount: 249.90 }],
    deliveryMethod: 'motoboy',
    address: 'Travessa José Jorge, 51 - Bairro: Centro - São José de Mipibu/RN - CEP: 59162-000',
    notes: 'Cor: Preto | CPF: 016.956.564-58'
  },
  {
    id: 'ped-web-8418',
    clientName: 'Amaro Honório Pereira Neto',
    clientDoc: '016.956.564-58',
    channel: 'Loja Online',
    items: [
      {
        productId: 'prod-1',
        name: 'Legging Glow Cós Anatômico (Preto - P)',
        quantity: 1,
        price: 119.90,
        cost: 45.00
      }
    ],
    total: 113.90,
    costTotal: 45.00,
    status: 'Pendente',
    createdAt: '2026-07-20T21:04:15.059Z',
    payments: [{ method: 'PIX', amount: 113.90 }],
    deliveryMethod: 'motoboy',
    address: 'Travessa José Jorge, 51 - Bairro: Centro - São José de Mipibu/RN - CEP: 59162-000',
    notes: 'Cor: Preto | CPF: 016.956.564-58'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't-1783692294908',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda SALE-COND-1783692294907 para Carla Oliveira',
    amount: 209.80,
    date: '2026-07-10T14:04:54.907Z',
    status: 'pago'
  },
  {
    id: 't-1783692368325',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda V-00324 para pericles (Link de Pagamento (InfinitePay): R$ 37,90)',
    amount: 37.90,
    date: '2026-07-10T14:06:08.324Z',
    status: 'pago'
  },
  {
    id: 't-1783692454013',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda V-00012 para pericles (Link de Pagamento (InfinitePay): R$ 37,90)',
    amount: 37.90,
    date: '2026-07-10T14:07:34.012Z',
    status: 'pago'
  },
  {
    id: 't-refund-1783693043809',
    type: 'Outflow',
    category: 'Venda Cancelada',
    description: 'Estorno de venda #V-00012 - Cliente pericles',
    amount: 37.90,
    date: '2026-07-10T14:17:23.809Z',
    status: 'pago'
  },
  {
    id: 't-refund-1783693050958',
    type: 'Outflow',
    category: 'Venda Cancelada',
    description: 'Estorno de venda #V-00324 - Cliente pericles',
    amount: 37.90,
    date: '2026-07-10T14:17:30.958Z',
    status: 'pago'
  },
  {
    id: 't-1783693122399',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda V-00398 para pericles (Link de Pagamento (InfinitePay): R$ 44,90)',
    amount: 44.90,
    date: '2026-07-10T14:18:42.398Z',
    status: 'pago'
  },
  {
    id: 't-1783717994689',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda V-00688 para pericles ramos (PIX: R$ 47,49)',
    amount: 47.49,
    date: '2026-07-10T21:13:14.688Z',
    status: 'pago'
  },
  {
    id: 't-refund-1783718215539',
    type: 'Outflow',
    category: 'Venda Cancelada',
    description: 'Estorno de venda #V-00688 - Cliente pericles ramos',
    amount: 47.49,
    date: '2026-07-10T21:16:55.539Z',
    status: 'pago'
  },
  {
    id: 't-1783720685893',
    type: 'Inflow',
    category: 'Venda',
    description: 'Venda V-00892 para Cinthia Rodrigues da Silva (PIX: R$ 51,21)',
    amount: 51.21,
    date: '2026-07-10T21:58:05.892Z',
    status: 'pago'
  },
  {
    id: 't-ped-web-6664',
    type: 'Inflow',
    category: 'Venda',
    description: 'Pedido Online #ped-web-6664 - Amaro Honório Pereira Neto (Cartão de Crédito: R$ 249,90)',
    amount: 249.90,
    date: '2026-07-20T21:08:17.598Z',
    status: 'pago'
  },
  {
    id: 't-ped-web-8418',
    type: 'Inflow',
    category: 'Venda',
    description: 'Pedido Online #ped-web-8418 - Amaro Honório Pereira Neto (PIX: R$ 113,90)',
    amount: 113.90,
    date: '2026-07-20T21:04:15.059Z',
    status: 'pago'
  }
];

export const INITIAL_ONLINE_ORDERS = [
  {
    id: 'ped-web-6664',
    clientName: 'Amaro Honório Pereira Neto',
    phone: '84 99146-8136',
    cpf: '016.956.564-58',
    items: [
      {
        productName: 'Macacão Wave Sculpt Sem Costura (Preto - P)',
        productId: 'prod-7',
        quantity: 1,
        price: 249.90,
        color: 'Preto',
        size: 'P'
      }
    ],
    total: 249.90,
    status: 'Pendente',
    status_pagamento: 'pendente',
    createdAt: '2026-07-20T21:08:17.598Z',
    address: 'Travessa José Jorge, 51 - Bairro: Centro - São José de Mipibu/RN - CEP: 59162-000',
    deliveryFee: 0,
    deliveryMethod: 'motoboy',
    selectedFreightId: '',
    selectedFreightName: '',
    paymentMethod: 'cartao',
    notes: 'Cor: Preto | CPF: 016.956.564-58 | Pg: Cartão (1x) | Obs: '
  },
  {
    id: 'ped-web-8418',
    clientName: 'Amaro Honório Pereira Neto',
    phone: '84 99146-8136',
    cpf: '016.956.564-58',
    items: [
      {
        productName: 'Legging Glow Cós Anatômico (Preto - P)',
        productId: 'prod-1',
        quantity: 1,
        price: 119.90,
        color: 'Preto',
        size: 'P'
      }
    ],
    total: 113.90,
    status: 'Pendente',
    status_pagamento: 'pendente',
    createdAt: '2026-07-20T21:04:15.059Z',
    address: 'Travessa José Jorge, 51 - Bairro: Centro - São José de Mipibu/RN - CEP: 59162-000',
    deliveryFee: 0,
    deliveryMethod: 'motoboy',
    selectedFreightId: '',
    selectedFreightName: '',
    paymentMethod: 'pix',
    notes: 'Cor: Preto | CPF: 016.956.564-58 | Pg: PIX | Obs: '
  }
];

export const INITIAL_TEAM_MEMBERS = [
  { 
    id: 'usr-1', 
    name: 'AP Moda Fitness', 
    login: 'admin', 
    role: 'Admin', 
    password: 'Ap01695*', 
    details: 'Administradora Geral', 
    createdAt: '2026-06-22T16:06:26.630674+00:00', 
    avatar: 'https://i.ibb.co/7tVk1tjm/1000533457.png' 
  }
];

