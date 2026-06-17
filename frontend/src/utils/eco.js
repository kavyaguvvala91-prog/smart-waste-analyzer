export const getEcoLevel = (points = 0) => {
  const value = Number(points || 0);

  if (value >= 300) {
    return {
      label: 'Sustainability Champion',
      icon: '🌍',
      range: '300+',
      tone: 'emerald',
    };
  }

  if (value >= 100) {
    return {
      label: 'Green Guardian',
      icon: '♻',
      range: '100-299',
      tone: 'forest',
    };
  }

  return {
    label: 'Eco Starter',
    icon: '🌱',
    range: '0-99',
    tone: 'sage',
  };
};

export const buildPointProgress = (points = 0) => {
  const value = Number(points || 0);

  if (value < 100) {
    return { current: value, target: 100, nextLabel: 'Green Guardian' };
  }

  if (value < 300) {
    return { current: value, target: 300, nextLabel: 'Sustainability Champion' };
  }

  return { current: value, target: value, nextLabel: 'Highest tier reached' };
};
