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

// ----------------------------------------------------
// دوال الجلب والحفظ السحابي
// ----------------------------------------------------

async function loadCloudData() {
  try {
    const catSnap = await db.collection('categories').get();
    if (!catSnap.empty) {
      categories = catSnap.docs.map(doc => doc.data()).filter(c => c && c.id && c.name && c.name !== 'undefined');
    }

    const prodSnap = await db.collection('products').get();
    if (!prodSnap.empty) {
      products = prodSnap.docs.map(doc => doc.data()).filter(p => p && p.id && p.name && p.name !== 'undefined');
    }

    const custSnap = await db.collection('customers').get();
    if (!custSnap.empty) {
      customers = custSnap.docs.map(doc => doc.data()).filter(c => c && c.username && c.username !== 'undefined');
    }

    // جلب الفواتير من السحابة
    const invSnap = await db.collection('invoices').get();
    if (!invSnap.empty) {
      invoices = invSnap.docs.map(doc => doc.data()).filter(i => i && i.id);
      localStorage.setItem('mustaqbal_invoices', JSON.stringify(invoices));
    }

    if (!categories.some(c => c.id === 'all')) {
      categories.unshift({ id: 'all', name: 'جميع المنتجات' });
    }

    if (typeof renderTabs === 'function') renderTabs();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof populateCategorySelect === 'function') populateCategorySelect();
    if (typeof renderAdminCustomersList === 'function') renderAdminCustomersList();
    
    console.log("تم جلب وتصفية كافة البيانات والفواتير من السحابة بنجاح");
  } catch (err) {
    console.error("خطأ في جلب البيانات من السحابة:", err);
  }
}

async function saveData() {
  categories = categories.filter(c => c && c.id && c.name && c.name !== 'undefined');
  products = products.filter(p => p && p.id && p.name && p.name !== 'undefined');
  customers = customers.filter(c => c && c.username && c.username !== 'undefined');

  localStorage.setItem('mustaqbal_categories', JSON.stringify(categories));
  localStorage.setItem('mustaqbal_products', JSON.stringify(products));
  localStorage.setItem('mustaqbal_customers', JSON.stringify(customers));
  localStorage.setItem('mustaqbal_invoices', JSON.stringify(invoices));

  try {
    for (let product of products) {
      await db.collection('products').doc(String(product.id)).set(product);
    }
    for (let cat of categories) {
      if (cat.id !== 'all') {
        await db.collection('categories').doc(String(cat.id)).set(cat);
      }
    }
    for (let cust of customers) {
      await db.collection('customers').doc(String(cust.username)).set(cust);
    }
    // حفظ الفواتير في قاعدة البيانات السحابية
    for (let inv of invoices) {
      await db.collection('invoices').doc(String(inv.id)).set(inv);
    }
  } catch (err) {
    console.error("فشل الحفظ في السحابة:", err);
  }
}

function getCustomerProductPrice(productPrice) {
  if (loggedCustomer && loggedCustomer.discount && Number(loggedCustomer.discount) > 0) {
    const discountRate = Number(loggedCustomer.discount) / 100;
    const discounted = productPrice - (productPrice * discountRate);
    return Math.round(discounted);
  }
  return productPrice;
}

function formatPrice(amount) {
  return Number(amount).toLocaleString('ar-IQ');
}

let categories = (JSON.parse(localStorage.getItem('mustaqbal_categories')) || [
  { id: 'all', name: 'جميع المنتجات' },
  { id: 'general', name: 'مواد عامة' },
  { id: 'medical', name: 'مواد طبية' },
  { id: 'cosmetics', name: 'مواد تجميل والشعر' },
  { id: 'perfumes', name: 'العطور' },
  { id: 'air_fresheners', name: 'المعطرات' },
  { id: 'groceries', name: 'المواد الغذائية' },
  { id: 'beverages', name: 'المشروبات الغازية والعصائر' }
]).filter(c => c && c.id && c.name && c.name !== 'undefined');

if (!categories.some(c => c.id === 'all')) {
  categories.unshift({ id: 'all', name: 'جميع المنتجات' });
}

let products = (JSON.parse(localStorage.getItem('mustaqbal_products')) || [
  { id: 1, name: 'سماعة لاسلكية (جملة)', category: 'general', price: 25000, desc: 'سماعة بلوتوث عالية الدقة', image: '' },
  { id: 2, name: 'مادة طبية معقمة', category: 'medical', price: 15000, desc: 'معقم ومطهر أصلي', image: '' }
]).filter(p => p && p.id && p.name && p.name !== 'undefined');

let customers = (JSON.parse(localStorage.getItem('mustaqbal_customers')) || [
  { username: 'cust1', password: '123', fullname: 'زبون تجريبي', discount: 0 }
]).filter(c => c && c.username && c.username !== 'undefined');

let adminPassword = localStorage.getItem('mustaqbal_admin_pass') || '799673';
let cart = JSON.parse(localStorage.getItem('mustaqbal_cart')) || [];
let invoices = JSON.parse(localStorage.getItem('mustaqbal_invoices')) || [];
let activeCategory = 'all';

let isAdmin = localStorage.getItem('isAdmin') === 'true';
let loggedCustomer = JSON.parse(localStorage.getItem('loggedCustomer')) || null;
let currentImageData = ""; 

document.addEventListener('DOMContentLoaded', () => {
  try {
    const loaders = document.querySelectorAll('#loader, .loader, .spinner, .loading, [class*="loader"], [class*="spinner"]');
    loaders.forEach(el => { el.style.display = 'none'; el.remove(); });

    loadCloudData();

    checkInitialSessionState();
    renderTabs();
    renderProducts();
    updateCartUI();
    populateCategorySelect();
    setupImageUploader();
    renderAdminCustomersList();
  } catch (err) {
    console.error(err);
  }
});

function checkInitialSessionState() {
  const displaySpan = document.getElementById('logged-user-display');
  const logoutBtn = document.getElementById('logout-btn');
  const loginSelectionBtn = document.getElementById('open-login-selection-btn');
  const adminPanel = document.getElementById('admin-panel');
  const adminTabCreator = document.getElementById('admin-tab-creator');
  const mainSidebar = document.getElementById('main-sidebar');
  const searchBarContainer = document.getElementById('search-bar-container');
  const productsGrid = document.getElementById('products-grid');
  const loggedOutWelcome = document.getElementById('logged-out-welcome');
  const navInvoicesBtn = document.getElementById('nav-invoices-btn');
  const openCartBtn = document.getElementById('open-cart-btn');

  const isLogged = isAdmin || loggedCustomer;

  if (isLogged) {
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (loginSelectionBtn) loginSelectionBtn.classList.add('hidden');
    if (mainSidebar) mainSidebar.classList.remove('hidden');
    if (searchBarContainer) searchBarContainer.classList.remove('hidden');
    if (productsGrid) productsGrid.classList.remove('hidden');
    if (loggedOutWelcome) loggedOutWelcome.classList.add('hidden');
    if (navInvoicesBtn) navInvoicesBtn.classList.remove('hidden');

    if (isAdmin) {
      if (displaySpan) displaySpan.innerText = 'المدير';
      if (adminPanel) adminPanel.classList.remove('hidden');
      if (adminTabCreator) adminTabCreator.classList.remove('hidden');
      if (openCartBtn) openCartBtn.classList.remove('hidden');
    } else {
      if (displaySpan && loggedCustomer) displaySpan.innerText = `${loggedCustomer.fullname || loggedCustomer.username}`;
      if (adminPanel) adminPanel.classList.add('hidden');
      if (adminTabCreator) adminTabCreator.classList.add('hidden');
      if (openCartBtn) openCartBtn.classList.remove('hidden');
      const custNameInput = document.getElementById('cust-name');
      if (custNameInput && loggedCustomer) custNameInput.value = loggedCustomer.fullname || '';
    }
  } else {
    if (displaySpan) displaySpan.innerText = '';
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (loginSelectionBtn) loginSelectionBtn.classList.remove('hidden');
    if (mainSidebar) mainSidebar.classList.add('hidden');
    if (searchBarContainer) searchBarContainer.classList.add('hidden');
    if (adminPanel) adminPanel.classList.add('hidden');
    if (adminTabCreator) adminTabCreator.classList.add('hidden');
    if (productsGrid) productsGrid.classList.add('hidden');
    if (loggedOutWelcome) loggedOutWelcome.classList.remove('hidden');

    if (navInvoicesBtn) navInvoicesBtn.classList.add('hidden');
    if (openCartBtn) openCartBtn.classList.add('hidden');
  }
}

function openLoginSelectionModal() {
  document.getElementById('login-selection-modal').classList.remove('hidden');
}
function closeLoginSelectionModal() {
  document.getElementById('login-selection-modal').classList.add('hidden');
}

function openCustomerLoginModal() {
  closeLoginSelectionModal();
  document.getElementById('customer-login-modal').classList.remove('hidden');
}
function closeCustomerLoginModal() {
  document.getElementById('customer-login-modal').classList.add('hidden');
}

function openAdminLoginModal() {
  closeLoginSelectionModal();
  document.getElementById('admin-login-modal').classList.remove('hidden');
}
function closeAdminLoginModal() {
  document.getElementById('admin-login-modal').classList.add('hidden');
}

function handleCustomerLogin(e) {
  e.preventDefault();
  const u = document.getElementById('cust-login-user').value.trim();
  const p = document.getElementById('cust-login-pass').value.trim();

  const found = customers.find(c => c && c.username === u && c.password === p);
  if (found) {
    loggedCustomer = found;
    isAdmin = false;
    localStorage.setItem('loggedCustomer', JSON.stringify(loggedCustomer));
    localStorage.setItem('isAdmin', 'false');
    closeCustomerLoginModal();
    checkInitialSessionState();
    renderTabs();
    renderProducts();
    updateCartUI();
    const custNameInput = document.getElementById('cust-name');
    if (custNameInput) custNameInput.value = found.fullname || found.username;
  } else {
    alert('اسم المستخدم أو كلمة المرور غير صحيحة!');
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const u = document.getElementById('admin-user-input').value.trim();
  const p = document.getElementById('admin-pass-input').value.trim();

  if (u === 'admin' && p === adminPassword) {
    isAdmin = true;
    loggedCustomer = null;
    localStorage.removeItem('loggedCustomer');
    localStorage.setItem('isAdmin', 'true');
    closeAdminLoginModal();
    checkInitialSessionState();
    renderTabs();
    renderProducts();
    renderAdminCustomersList();
  } else {
    alert('بيانات دخول المدير غير صحيحة!');
  }
}

function handleLogout() {
  isAdmin = false;
  loggedCustomer = null;
  localStorage.removeItem('loggedCustomer');
  localStorage.setItem('isAdmin', 'false');
  checkInitialSessionState();
}

function handleAdminPasswordChange(e) {
  e.preventDefault();
  const newPass = document.getElementById('new-admin-pass').value.trim();
  if (newPass) {
    adminPassword = newPass;
    localStorage.setItem('mustaqbal_admin_pass', adminPassword);
    alert('تم تغيير كلمة سر المدير بنجاح!');
    document.getElementById('new-admin-pass').value = '';
  }
}

function saveCart() { localStorage.setItem('mustaqbal_cart', JSON.stringify(cart)); }

function setupImageUploader() {
  const fileInput = document.getElementById('product-img-file');
  if (fileInput) {
    fileInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          const img = new Image();
          img.onload = function () {
            const canvas = document.createElement('canvas');
            const maxDimension = 300;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            currentImageData = canvas.toDataURL('image/jpeg', 0.7);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

async function handleCustomerMgmtSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('new-cust-username').value.trim();
  const password = document.getElementById('new-cust-password').value.trim();
  const fullname = document.getElementById('new-cust-fullname').value.trim();
  const discountInput = document.getElementById('new-cust-discount');
  const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
  const editFlag = document.getElementById('edit-cust-username-flag').value;

  if (!username || username === 'undefined') {
    alert('يرجى إدخال اسم مستخدم صحيح.');
    return;
  }

  if (editFlag) {
    const cust = customers.find(c => c && c.username === editFlag);
    if (cust) {
      cust.username = username;
      cust.password = password;
      cust.fullname = fullname || username;
      cust.discount = discount;
      await saveData();
      renderAdminCustomersList();
      resetCustomerMgmtForm();
      alert('تم تحديث حساب الزبون بنجاح.');
    }
  } else {
    if (customers.some(c => c && c.username === username)) {
      alert('اسم المستخدم هذا موجود مسبقاً.');
      return;
    }
    customers.push({ username, password, fullname: fullname || username, discount });
    await saveData();
    renderAdminCustomersList();
    resetCustomerMgmtForm();
    alert('تم إضافة حساب الزبون بنجاح.');
  }
}

function editCustomer(username) {
  const cust = customers.find(c => c && c.username === username);
  if (!cust) return;

  document.getElementById('edit-cust-username-flag').value = cust.username;
  document.getElementById('new-cust-username').value = cust.username;
  document.getElementById('new-cust-password').value = cust.password;
  document.getElementById('new-cust-fullname').value = cust.fullname || '';
  document.getElementById('new-cust-discount').value = cust.discount || 0;
  document.getElementById('save-customer-btn').innerText = 'تحديث الزبون';
}

function resetCustomerMgmtForm() {
  document.getElementById('customer-mgmt-form').reset();
  document.getElementById('edit-cust-username-flag').value = '';
  document.getElementById('save-customer-btn').innerText = 'إضافة حساب زبون';
}

function renderAdminCustomersList() {
  const listContainer = document.getElementById('customers-list-admin');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  customers = customers.filter(c => c && c.username && c.username !== 'undefined');

  if (customers.length === 0) {
    listContainer.innerHTML = '<small style="color:var(--text-muted);">لا توجد حسابات زبائن مسجلة.</small>';
    return;
  }

  customers.forEach(cust => {
    const fullname = (cust.fullname && cust.fullname !== 'undefined') ? cust.fullname : cust.username;
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.75rem;';
    div.innerHTML = `
      <div>${fullname} (${cust.username}) - <span style="color: var(--success); font-weight: bold;">خصم: ${cust.discount || 0}%</span></div>
      <div style="display: flex; gap: 4px;">
        <button type="button" onclick="editCustomer('${cust.username}')" style="background: #fef3c7; color: #d97706; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">تعديل</button>
        <button type="button" onclick="deleteCustomer('${cust.username}')" style="background: #fef2f2; color: #ef4444; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">حذف</button>
      </div>
    `;
    listContainer.appendChild(div);
  });
}

async function deleteCustomer(username) {
  if (confirm('تأكيد حذف حساب الزبون؟')) {
    customers = customers.filter(c => c && c.username !== username);
    try {
      await db.collection('customers').doc(String(username)).delete();
    } catch (err) {
      console.error("فشل الحذف من السحابة:", err);
    }
    await saveData();
    renderAdminCustomersList();
  }
}

function renderTabs() {
  const tabsContainer = document.getElementById('vertical-tabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  if (!isAdmin && !loggedCustomer) return;

  categories = categories.filter(cat => cat && cat.id && cat.name && cat.name !== 'undefined');

  if (!categories.some(c => c.id === 'all')) {
    categories.unshift({ id: 'all', name: 'جميع المنتجات' });
  }

  categories.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = `category-chip ${activeCategory === cat.id ? 'active' : ''}`;
    
    chip.innerHTML = `
      <span onclick="selectCategory('${cat.id}')">${cat.name}</span>
      ${isAdmin && cat.id !== 'all' ? `
        <span style="font-size:0.7rem; opacity:0.7;" onclick="editTab('${cat.id}')">✏️</span>
        <span style="font-size:0.7rem; opacity:0.7;" onclick="deleteTab('${cat.id}')">🗑️</span>
      ` : ''}
    `;

    tabsContainer.appendChild(chip);
  });
}

function selectCategory(catId) {
  activeCategory = catId;
  renderTabs();
  renderProducts();
}

function populateCategorySelect() {
  const select = document.getElementById('product-tab');
  if (!select) return;
  select.innerHTML = '';
  categories.filter(c => c && c.id !== 'all' && c.name && c.name !== 'undefined').forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.innerText = cat.name;
    select.appendChild(option);
  });
}

async function handleAddTab(e) {
  e.preventDefault();
  const input = document.getElementById('tab-name-input');
  const name = input.value.trim();
  if (!name || name === 'undefined') return;

  const id = 'cat_' + Date.now();
  categories.push({ id, name });
  await saveData();
  input.value = '';
  renderTabs();
  populateCategorySelect();
}

async function editTab(catId) {
  const cat = categories.find(c => c && c.id === catId);
  if (!cat) return;
  const newName = prompt('تعديل اسم القسم:', cat.name);
  if (newName && newName.trim() !== '' && newName.trim() !== 'undefined') {
    cat.name = newName.trim();
    await saveData();
    renderTabs();
    populateCategorySelect();
  }
}

async function deleteTab(catId) {
  if (confirm('تأكيد حذف القسم وجميع منتجاته؟')) {
    categories = categories.filter(c => c && c.id !== catId);
    products = products.filter(p => p && p.category !== catId);
    try {
      await db.collection('categories').doc(String(catId)).delete();
    } catch (err) {
      console.error("فشل حذف القسم من السحابة:", err);
    }
    await saveData();
    if (activeCategory === catId) activeCategory = 'all';
    renderTabs();
    populateCategorySelect();
    renderProducts();
  }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const category = document.getElementById('product-tab').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const desc = document.getElementById('product-desc').value.trim();

  if (!name || name === 'undefined') {
    alert('يرجى إدخال اسم منتج صحيح.');
    return;
  }

  if (id) {
    const index = products.findIndex(p => p && p.id == id);
    if (index !== -1) {
      products[index] = {
        id: Number(id),
        name,
        category,
        price,
        desc,
        image: currentImageData || products[index].image
      };
    }
  } else {
    const newProduct = {
      id: Date.now(),
      name,
      category,
      price,
      desc,
      image: currentImageData || ''
    };
    products.push(newProduct);
  }

  await saveData();
  resetProductForm();
  renderProducts();
  alert('تم حفظ المنتج بنجاح!');
}

function editProduct(id) {
  const product = products.find(p => p && p.id === id);
  if (!product) return;

  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name || '';
  document.getElementById('product-tab').value = product.category || '';
  document.getElementById('product-price').value = product.price || 0;
  document.getElementById('product-desc').value = product.desc || '';
  currentImageData = product.image || '';

  document.getElementById('save-product-btn').innerText = 'تحديث المنتج';
}

async function deleteProduct(id) {
  if (confirm('تأكيد حذف المنتج؟')) {
    products = products.filter(p => p && p.id !== id);
    try {
      await db.collection('products').doc(String(id)).delete();
    } catch (err) {
      console.error("فشل حذف المنتج من السحابة:", err);
    }
    await saveData();
    renderProducts();
  }
}

function resetProductForm() {
  const form = document.getElementById('product-form');
  if (form) form.reset();
  document.getElementById('product-id').value = '';
  currentImageData = "";
  document.getElementById('save-product-btn').innerText = 'حفظ المنتج';
}

function renderProducts(itemsToRender = null) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!isAdmin && !loggedCustomer) {
    return;
  }

  products = products.filter(p => p && p.id && p.name && p.name !== 'undefined');

  let list = itemsToRender || (activeCategory === 'all' ? products : products.filter(p => p && p.category === activeCategory));

  if (!list || list.length === 0) {
    grid.innerHTML = '<p style="padding:15px; color:var(--text-muted); grid-column: 1 / -1; font-size:0.85rem; text-align:center;">لا توجد منتجات متاحة.</p>';
    return;
  }

  list.forEach(product => {
    if (!product || !product.id || !product.name || product.name === 'undefined') return;

    const card = document.createElement('div');
    card.className = 'product-card';
    const imgSrc = product.image || 'https://via.placeholder.com/220x140?text=لا+توجد+صورة';
    
    const effectivePrice = getCustomerProductPrice(product.price || 0);

    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${imgSrc}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/220x140?text=خطأ'">
      </div>
      <div class="product-info">
        <div class="product-title">${product.name}</div>
        <div class="product-description">${product.desc || ''}</div>
        <div class="product-price">${formatPrice(effectivePrice)} د.ع</div>
        <button class="add-btn" onclick="addToCart(${product.id})">إضافة للسلة 🛒</button>
        ${isAdmin ? `
          <div class="card-admin-btns">
            <button class="edit-btn" onclick="editProduct(${product.id})">تعديل</button>
            <button class="delete-btn" onclick="deleteProduct(${product.id})">حذف</button>
          </div>
        ` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

function handleSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase().trim();
  const filtered = products.filter(p =>
    p && p.name && p.name !== 'undefined' &&
    (activeCategory === 'all' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(query) || (p.desc && p.desc.toLowerCase().includes(query)))
  );
  renderProducts(filtered);
}

function addToCart(productId) {
  const product = products.find(p => p && p.id === productId);
  if (!product) return;

  const effectivePrice = getCustomerProductPrice(product.price || 0);

  const cartItem = cart.find(item => item && item.id === productId);
  if (cartItem) {
    cartItem.qty += 1;
    cartItem.price = effectivePrice;
  } else {
    cart.push({ ...product, price: effectivePrice, qty: 1 });
  }

  saveCart();
  updateCartUI();
}

function updateQty(id, change) {
  const item = cart.find(i => i && i.id === id);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    cart = cart.filter(i => i && i.id !== id);
  }
  
  saveCart();
  updateCartUI();
  renderCartModal();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item && item.id !== productId);
  saveCart();
  updateCartUI();
  renderCartModal();
}

function clearCart() {
  if (cart.length === 0) return;
  if (confirm('تأكيد إفراغ السلة؟')) {
    cart = [];
    saveCart();
    updateCartUI();
    renderCartModal();
  }
}

function updateCartUI() {
  const totalItems = cart.reduce((acc, item) => acc + (item.qty || 0), 0);
  const cartCountElem = document.getElementById('cart-count');
  if (cartCountElem) cartCountElem.innerText = totalItems;
}

function openCartModal() {
  renderCartModal();
  document.getElementById('cart-modal').classList.remove('hidden');
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.add('hidden');
}

function renderCartModal() {
  const cartItemsContainer = document.getElementById('cart-items');
  const clearBtn = document.getElementById('clear-cart-btn');
  if (!cartItemsContainer) return;
  
  cartItemsContainer.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px; font-size:0.85rem;">السلة فارغة حالياً</p>';
    const totalPriceElem = document.getElementById('cart-total-price');
    if (totalPriceElem) totalPriceElem.innerText = '0';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  if (clearBtn) clearBtn.style.display = 'inline-block';

  cart.forEach(item => {
    if (!item) return;
    const itemTotal = (item.price || 0) * (item.qty || 0);
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <div style="font-weight:700; font-size:0.85rem;">${item.name || 'منتج'}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${formatPrice(item.price || 0)} × ${item.qty || 0} = <strong>${formatPrice(itemTotal)} د.ع</strong></div>
      </div>
      <div class="qty-controls">
        <button type="button" class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
        <span style="font-weight:bold; font-size:0.85rem;">${item.qty || 0}</span>
        <button type="button" class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        <button type="button" style="background:none; border:none; cursor:pointer; color:var(--danger); font-size:0.9rem;" onclick="removeFromCart(${item.id})">🗑️</button>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });

  const totalPriceElem = document.getElementById('cart-total-price');
  if (totalPriceElem) totalPriceElem.innerText = formatPrice(total);
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        const locInput = document.getElementById('cust-location');
        if (locInput) locInput.value = mapsUrl;
        alert('تم تحديد موقعك بنجاح!');
      },
      () => { alert('لم نتمكن من الوصول لموقعك.'); }
    );
  } else {
    alert('خاصية تحديد الموقع غير مدعومة.');
  }
}

function handleCheckout(e) {
  e.preventDefault();
  if (cart.length === 0) {
    alert('السلة فارغة!');
    return;
  }

  const custName = document.getElementById('cust-name').value.trim();
  const custPhone = document.getElementById('cust-phone').value.trim();
  const custAddress = document.getElementById('cust-address').value.trim();
  const custLocation = document.getElementById('cust-location').value.trim();

  const totalAmount = cart.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 0)), 0);

  const newInvoice = {
    id: 'INV-' + Date.now(),
    date: new Date().toLocaleString('ar-IQ'),
    customer: { 
      name: custName, 
      phone: custPhone, 
      address: custAddress, 
      location: custLocation,
      username: loggedCustomer ? loggedCustomer.username : (isAdmin ? 'admin' : 'غير محدد'),
      discountApplied: loggedCustomer ? loggedCustomer.discount : 0
    },
    items: [...cart],
    total: totalAmount
  };

  invoices.unshift(newInvoice);
  saveData();
  renderReceiptHTML(newInvoice);

  cart = [];
  saveCart();
  updateCartUI();
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) checkoutForm.reset();
  closeCartModal();
  document.getElementById('receipt-modal').classList.remove('hidden');
}

function renderReceiptHTML(invoice) {
  const area = document.getElementById('receipt-area');
  if (!area) return;
  
  let itemsRows = invoice.items.map(i => `
    <tr>
      <td>${i.name || 'منتج'}</td>
      <td style="text-align:center;">${i.qty || 0}</td>
      <td style="text-align:left;">${formatPrice(i.price || 0)}</td>
      <td style="text-align:left;">${formatPrice((i.price || 0) * (i.qty || 0))}</td>
    </tr>
  `).join('');

  area.innerHTML = `
    <div class="receipt-header">
      <h2 style="font-size:1.1rem; color:var(--primary-dark);">متجر المستقبل للجملة</h2>
      <p style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">رقم: ${invoice.id} | التاريخ: ${invoice.date}</p>
    </div>

    <div style="font-size:0.8rem; margin-bottom:12px; line-height:1.6;">
      <strong>الحساب:</strong> ${invoice.customer.username || 'غير محدد'}<br>
      <strong>الزبون:</strong> ${invoice.customer.name || 'غير محدد'}<br>
      <strong>الهاتف:</strong> ${invoice.customer.phone || 'بدون'}<br>
      <strong>العنوان:</strong> ${invoice.customer.address || 'بدون'}
    </div>

    <table class="receipt-table">
      <thead>
        <tr>
          <th>المنتج</th>
          <th style="text-align:center;">كمية</th>
          <th style="text-align:left;">السعر</th>
          <th style="text-align:left;">المجموع</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="receipt-total-box">
      المجموع الكلي: ${formatPrice(invoice.total || 0)} د.ع
    </div>
  `;
}

function downloadInvoiceAsImage(invoiceElementId) {
  const invoiceElement = document.getElementById(invoiceElementId);
  if (!invoiceElement) return;

  html2canvas(invoiceElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  }).then(canvas => {
    const imageUrl = canvas.toDataURL("image/png");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      let newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html dir="rtl">
            <head><title>تحميل الفاتورة</title></head>
            <body style="text-align:center; background:#f4f4f4; padding:15px; font-family:sans-serif;">
              <h3 style="color:#333; font-size:0.9rem; margin-bottom:10px;">اضغط مطولاً على الصورة ثم اختر (تنزيل الصورة):</h3>
              <img src="${imageUrl}" style="max-width:100%; border:1px solid #ccc; border-radius:8px;" />
            </body>
          </html>
        `);
      } else {
        window.location.href = imageUrl;
      }
    } else {
      const downloadLink = document.createElement('a');
      downloadLink.href = imageUrl;
      downloadLink.download = 'Invoice-' + Date.now() + '.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  });
}

function closeReceiptModal() {
  document.getElementById('receipt-modal').classList.add('hidden');
}

function openInvoicesModal() {
  renderInvoicesList();
  document.getElementById('invoices-modal').classList.remove('hidden');
}

function closeInvoicesModal() {
  document.getElementById('invoices-modal').classList.add('hidden');
}

function renderInvoicesList() {
  const listContainer = document.getElementById('invoices-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  let displayedInvoices = invoices;
  if (!isAdmin && loggedCustomer) {
    displayedInvoices = invoices.filter(inv => inv && inv.customer && inv.customer.username === loggedCustomer.username);
  } else if (!isAdmin && !loggedCustomer) {
    listContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:15px; font-size:0.8rem;">يرجى تسجيل الدخول.</p>';
    return;
  }

  if (displayedInvoices.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:15px; font-size:0.8rem;">لا توجد فواتير سابقة.</p>';
    return;
  }

  displayedInvoices.forEach(inv => {
    if (!inv) return;
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:var(--radius-sm); display:flex; flex-direction:column; gap:6px; font-size:0.8rem;';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-weight:bold; color:var(--primary-dark);">
        <span>${inv.id || 'INV'}</span>
        <span>${formatPrice(inv.total || 0)} د.ع</span>
      </div>
      <div>الزبون: ${inv.customer && inv.customer.name ? inv.customer.name : 'غير محدد'}</div>
      <div style="font-size:0.7rem; color:var(--text-muted);">${inv.date || ''}</div>
      <div style="display:flex; gap:6px; margin-top:4px;">
        <button class="btn" style="padding:4px 8px; font-size:0.75rem;" onclick="viewSingleInvoice('${inv.id}')">عرض</button>
        <button class="btn" style="background:var(--success); padding:4px 8px; font-size:0.75rem;" onclick="viewSingleInvoice('${inv.id}')">تحميل</button>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function viewSingleInvoice(invoiceId) {
  const inv = invoices.find(i => i && i.id === invoiceId);
  if (inv) {
    renderReceiptHTML(inv);
    closeInvoicesModal();
    document.getElementById('receipt-modal').classList.remove('hidden');
  }
}