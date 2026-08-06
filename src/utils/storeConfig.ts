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
  const footer = (localStorage.getItem('ap_store_footer') || 'Obrigado por escolher a AP Moda Fitness! Peças lindas que elevam seu treino. Siga-nos no Instagram: @ap_moda_fitness2').trim();
  const logoUrl = (localStorage.getItem('ap_store_logo') || 'https://i.ibb.co/n8YXgr1x/1000584197-png.png').trim();

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
    instagram: '@ap_moda_fitness2'
  };
}
