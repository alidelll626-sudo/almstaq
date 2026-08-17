// إعدادات اتصال Firebase الخاصة بمشروعك السحابي
const firebaseConfig = {
  apiKey: "AIzaSyC60355aPCR1Ji6MRlyOXuYCEbjYTjZ9n0",
  authDomain: "al-mustaqbal-stor.firebaseapp.com",
  projectId: "al-mustaqbal-stor",
  storageBucket: "al-mustaqbal-stor.firebasestorage.app",
  messagingSenderId: "96965787019",
  appId: "1:96965787019:web:4531931ae87c4b317e438e",
  measurementId: "G-0JTB3KDKV4"
};

// تهيئة الاتصال بقاعدة البيانات
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// المتغيرات الأساسية
let categories = JSON.parse(localStorage.getItem('mustaqbal_categories')) || [{ id: 'all', name: 'جميع المنتجات' }];
let products = JSON.parse(localStorage.getItem('mustaqbal_products')) || [];
let customers = JSON.parse(localStorage.getItem('mustaqbal_customers')) || [];
let adminPassword = localStorage.getItem('mustaqbal_admin_pass') || '799673';
let cart = JSON.parse(localStorage.getItem('mustaqbal_cart')) || [];
let invoices = JSON.parse(localStorage.getItem('mustaqbal_invoices')) || [];
let activeCategory = 'all';
let isAdmin = localStorage.getItem('isAdmin') === 'true';
let loggedCustomer = JSON.parse(localStorage.getItem('loggedCustomer')) || null;
let currentImageData = ""; 

async function loadCloudData() {
  try {
    const catSnap = await db.collection('categories').get();
    categories = catSnap.empty ? [{ id: 'all', name: 'جميع المنتجات' }] : catSnap.docs.map(doc => doc.data());
    
    const prodSnap = await db.collection('products').get();
    products = prodSnap.empty ? [] : prodSnap.docs.map(doc => doc.data());
    
    const custSnap = await db.collection('customers').get();
    customers = custSnap.empty ? [] : custSnap.docs.map(doc => doc.data());
    
    saveData();
    renderAll();
  } catch (err) { console.error("Error loading cloud data:", err); }
}

function saveData() {
  localStorage.setItem('mustaqbal_categories', JSON.stringify(categories));
  localStorage.setItem('mustaqbal_products', JSON.stringify(products));
  localStorage.setItem('mustaqbal_customers', JSON.stringify(customers));
  localStorage.setItem('mustaqbal_invoices', JSON.stringify(invoices));
}

function renderAll() {
  if (typeof renderTabs === 'function') renderTabs();
  if (typeof renderProducts === 'function') renderProducts();
  if (typeof populateCategorySelect === 'function') populateCategorySelect();
  if (typeof renderAdminCustomersList === 'function') renderAdminCustomersList();
}

// ----------------------------------------------------
// إدارة الزبائن
// ----------------------------------------------------

async function handleCustomerMgmtSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('new-cust-username').value.trim();
  const password = document.getElementById('new-cust-password').value.trim();
  const fullname = document.getElementById('new-cust-fullname').value.trim();
  const discount = parseFloat(document.getElementById('new-cust-discount').value) || 0;
  const editFlag = document.getElementById('edit-cust-username-flag').value;

  const newCust = { username, password, fullname, discount };

  if (editFlag && editFlag !== username) {
      await db.collection('customers').doc(String(editFlag)).delete();
      customers = customers.filter(c => c.username !== editFlag);
  }

  customers = customers.filter(c => c.username !== username);
  customers.push(newCust);

  await db.collection('customers').doc(String(username)).set(newCust);
  saveData();
  renderAdminCustomersList();
  resetCustomerMgmtForm();
  alert('تم حفظ بيانات الزبون بنجاح.');
}

async function deleteCustomer(username) {
  if (confirm('تأكيد حذف حساب الزبون؟')) {
    customers = customers.filter(c => c.username !== username);
    await db.collection('customers').doc(String(username)).delete();
    saveData();
    renderAdminCustomersList();
  }
}

// ----------------------------------------------------
// إدارة الأقسام والمنتجات
// ----------------------------------------------------

async function deleteTab(catId) {
  if (confirm('تأكيد حذف القسم وجميع منتجاته؟')) {
    categories = categories.filter(c => c.id !== catId);
    products = products.filter(p => p.category !== catId);
    await db.collection('categories').doc(String(catId)).delete();
    saveData();
    renderAll();
  }
}

async function deleteProduct(id) {
  if (confirm('تأكيد حذف المنتج؟')) {
    products = products.filter(p => p.id !== Number(id) && p.id !== id);
    await db.collection('products').doc(String(id)).delete();
    saveData();
    renderProducts();
  }
}

// ----------------------------------------------------
// بقية الدوال (Login, Cart, etc) تعمل كما هي.. 
// يُفضل لصق بقية دوال مشروعك الأصلية هنا أسفل هذه النقطة
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    loadCloudData();
    // قم باستدعاء checkInitialSessionState وبقية الدوال التمهيدية هنا
});