export interface StoreConfig {
  name: string;
  slogan: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  fullAddress: string;
  phone: string;
  pixKey: string;
  footer: string;
  logoUrl: string;
  instagram: string;
  instagramUrl: string;
}

export function formatInstagramHandle(input: string): string {
  if (!input) return '@ap2_moda_fitness';
  let cleaned = input.trim();
  if (cleaned.includes('instagram.com/')) {
    cleaned = cleaned.split('instagram.com/')[1].split('/')[0].split('?')[0];
  }
  cleaned = cleaned.replace(/^@+/, '').replace(/\/+$/, '').trim();
  return cleaned ? `@${cleaned}` : '@ap2_moda_fitness';
}

export function getInstagramProfileUrl(input: string): string {
  if (!input) return 'https://www.instagram.com/ap2_moda_fitness/';
  let cleaned = input.trim();
  if (cleaned.includes('instagram.com/')) {
    const handlePart = cleaned.split('instagram.com/')[1].split('/')[0].split('?')[0].replace(/^@+/, '').replace(/\/+$/, '').trim();
    if (handlePart) return `https://www.instagram.com/${handlePart}/`;
  }
  const handle = cleaned.replace(/^@+/, '').replace(/\/+$/, '').trim();
  return handle ? `https://www.instagram.com/${handle}/` : 'https://www.instagram.com/ap2_moda_fitness/';
}

export function getStoreConfig(): StoreConfig {
  const nameVal = localStorage.getItem('ap_store_name');
  const name = (!nameVal || nameVal === 'AP Moda Fitness' ? 'AP2 Moda Fitness' : nameVal).trim();
  const slogan = (localStorage.getItem('ap_store_slogan') || 'Onde o seu limite vira ponto de partida').trim();
  let cnpj = (localStorage.getItem('ap_store_cnpj') || '67.074.681/0001-03').trim();
  let address = (localStorage.getItem('ap_store_address') || 'Travessa Jose Jorge, 51, Centro').trim();
  let city = (localStorage.getItem('ap_store_city') || 'Sao Jose de Mipibu').trim();
  let state = (localStorage.getItem('ap_store_state') || 'RN').trim();
  let phone = (localStorage.getItem('ap_store_phone') || '(84) 99198-2963').trim();
  const pixKey = (localStorage.getItem('ap_pix_key') || '67.074.681/0001-03').trim();
  const savedLogo = localStorage.getItem('ap_store_logo');
  // Use custom uploaded logo from user if set, otherwise fallback to default /logo.png
  const logoUrl = (savedLogo && savedLogo.trim() && !savedLogo.includes('unsplash') ? savedLogo.trim() : '/logo.png').trim();
  
  // Instagram handle (stored with reliable fallback to prevent opening generic home feed)
  const savedInstagram = localStorage.getItem('ap_store_instagram') || '@ap2_moda_fitness';
  const instagram = formatInstagramHandle(savedInstagram);
  const instagramUrl = getInstagramProfileUrl(savedInstagram);

  const defaultFooter = instagram
    ? `Obrigado por escolher a ${name}! Peças lindas que elevam seu treino. Siga-nos no Instagram: ${instagram}`
    : `Obrigado por escolher a ${name}! Peças lindas que elevam seu treino com estilo e alta performance.`;

  let footer = (localStorage.getItem('ap_store_footer') || defaultFooter).trim();
  
  // Clean out legacy mock data from footer if present
  if (footer.includes('@ap_moda_fitness2') || footer.includes('@ap2_moda_fitness')) {
    footer = defaultFooter;
  }

  // Clean out legacy mock data if present
  if (cnpj.includes('12.345.678') || cnpj.includes('45.678.901')) {
    cnpj = '67.074.681/0001-03';
  }
  if (address.toLowerCase().includes('copacabana') || address.toLowerCase().includes('paulista')) {
    address = 'Travessa Jose Jorge, 51, Centro';
    city = 'Sao Jose de Mipibu';
    state = 'RN';
  }
  if (phone.includes('99123-4567') || phone.includes('98765-4321')) {
    phone = '(84) 99198-2963';
  }

  let fullAddress = address;
  if (city && !address.toLowerCase().includes(city.toLowerCase())) {
    fullAddress += ` - ${city}`;
  }
  if (state && !address.toLowerCase().includes(state.toLowerCase())) {
    fullAddress += `/${state}`;
  }

  return {
    name,
    slogan,
    cnpj,
    address,
    city,
    state,
    fullAddress,
    phone,
    pixKey,
    footer,
    logoUrl,
    instagram,
    instagramUrl
  };
}
