// products.js

const SUPABASE_URL = window?.SUPABASE_URL || 'https://vjjqsbupupmdfqulidpr.supabase.co';
const SUPABASE_ANON_KEY = window?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqanFzYnVwdXBtZGZxdWxpZHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTM1MTgsImV4cCI6MjA2NTgyOTUxOH0.wNGR-blLYp6r3d0_DF2-7ODz-Zez04bRJBkGBawc_Z8';
const productsSupabase = window.createClient
  ? window.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Save product to Supabase
async function saveProduct(product) {
  const { error } = await productsSupabase.from('products').insert([product]);
  return error;
}

// Fetch all products
async function fetchProducts() {
  const { data, error } = await productsSupabase.from('products').select('*').order('created_at', { ascending: false });
  return { data, error };
}

// Render products for dashboard and shop
function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!products || products.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No products found.</p>';
    return;
  }
  products.forEach(prod => {
    const waMsg = encodeURIComponent(`Hello, I'm interested in your product: ${prod.name} (₦${prod.price}, Qty: ${prod.quantity}) on AgriHub.`);
    const waLink = `https://wa.me/${prod.whatsapp}?text=${waMsg}`;
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-4 flex flex-col';
    card.innerHTML = `
      <h3 class="text-lg font-bold text-farmGreen mb-1">${prod.name}</h3>
      <p class="text-gray-700 mb-1">₦${prod.price} &middot; Qty: ${prod.quantity}</p>
      <p class="text-gray-600 text-sm mb-2">${prod.description || ''}</p>
      <a href="${waLink}" target="_blank" class="mt-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-center">Buy via WhatsApp</a>
    `;
    container.appendChild(card);
  });
}

// For dashboard.html
async function loadDashboardProducts() {
  const { data, error } = await fetchProducts();
  renderProducts(data, 'dashboardProducts');
}

// For shop.html
async function loadShopProducts() {
  const { data, error } = await fetchProducts();
  renderProducts(data, 'shopProducts');
}
