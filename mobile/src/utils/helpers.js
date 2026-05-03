export const formatCurrency = (amount, currency = 'INR', decimals = 2) => {
  if (isNaN(amount)) return '--';
  const num = parseFloat(amount).toFixed(decimals);
  if (currency === 'INR') {
    return '₹' + parseFloat(num).toLocaleString('en-IN');
  }
  return '$' + parseFloat(num).toLocaleString('en-US');
};

export const formatGrams = (grams, decimals = 4) => {
  if (isNaN(grams)) return '--';
  return parseFloat(grams).toFixed(decimals) + 'g';
};

export const formatDate = (date) => {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '--';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const maskPhone = (phone) => {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 2) + '****' + phone.slice(-4);
};

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
export const validatePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

export const getProfitColor = (profit) => {
  if (profit > 0) return '#27AE60';
  if (profit < 0) return '#E74C3C';
  return '#B0B0C8';
};

export const getProfitIcon = (profit) => {
  if (profit > 0) return 'trending-up';
  if (profit < 0) return 'trending-down';
  return 'minus';
};
