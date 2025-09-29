// Generador de avatares cómicos usando diferentes APIs
export const generateComicAvatar = (name: string, email: string): string => {
  // Usar el email como seed para consistencia
  const seed = email || name || 'default';
  
  // Diferentes estilos de avatares cómicos disponibles
  const avatarStyles = [
    'adventurer',
    'adventurer-neutral', 
    'avataaars',
    'big-ears',
    'big-ears-neutral',
    'big-smile',
    'bottts',
    'croodles',
    'croodles-neutral',
    'fun-emoji',
    'icons',
    'identicon',
    'initials',
    'lorelei',
    'lorelei-neutral',
    'micah',
    'miniavs',
    'open-peeps',
    'personas',
    'pixel-art',
    'pixel-art-neutral',
    'shapes',
    'thumbs'
  ];

  // Seleccionar un estilo basado en el seed
  const styleIndex = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarStyles.length;
  const selectedStyle = avatarStyles[styleIndex];

  // Generar URL del avatar usando DiceBear API
  return `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&size=200`;
};

// Función para obtener avatares predefinidos por categorías
export const getAvatarsByCategory = () => {
  return {
    fun: [
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=fun1&size=200',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=fun2&size=200',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=fun3&size=200',
      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=fun4&size=200',
    ],
    adventurer: [
      'https://api.dicebear.com/7.x/adventurer/svg?seed=adv1&size=200',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=adv2&size=200',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=adv3&size=200',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=adv4&size=200',
    ],
    bottts: [
      'https://api.dicebear.com/7.x/bottts/svg?seed=bot1&size=200',
      'https://api.dicebear.com/7.x/bottts/svg?seed=bot2&size=200',
      'https://api.dicebear.com/7.x/bottts/svg?seed=bot3&size=200',
      'https://api.dicebear.com/7.x/bottts/svg?seed=bot4&size=200',
    ],
    personas: [
      'https://api.dicebear.com/7.x/personas/svg?seed=per1&size=200',
      'https://api.dicebear.com/7.x/personas/svg?seed=per2&size=200',
      'https://api.dicebear.com/7.x/personas/svg?seed=per3&size=200',
      'https://api.dicebear.com/7.x/personas/svg?seed=per4&size=200',
    ],
    pixelArt: [
      'https://api.dicebear.com/7.x/pixel-art/svg?seed=pix1&size=200',
      'https://api.dicebear.com/7.x/pixel-art/svg?seed=pix2&size=200',
      'https://api.dicebear.com/7.x/pixel-art/svg?seed=pix3&size=200',
      'https://api.dicebear.com/7.x/pixel-art/svg?seed=pix4&size=200',
    ]
  };
};

// Función para generar avatar aleatorio
export const generateRandomAvatar = (): string => {
  const styles = ['adventurer', 'bottts', 'fun-emoji', 'personas', 'pixel-art'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomSeed = Math.random().toString(36).substring(7);
  
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&size=200`;
};
