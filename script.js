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
// دوال الجلب والحفظ السحابي الحقيقي
// ----------------------------------------------------

async function loadCloudData() {
  try {
    // جلب الأقسام من السحابة
    const catSnap = await db.collection('categories').get();
    if (!catSnap.empty) {
      categories = catSnap.docs.map(doc => doc.data());
      localStorage.setItem('mustaqbal_categories', JSON.stringify(categories));
    } else {
      categories = [{ id: 'all', name: 'جميع المنتجات' }];
    }

    // جلب المنتجات من السحابة
    const prodSnap = await db.collection('products').get();
    if (!prodSnap.empty) {
      products = prodSnap.docs.map(doc => doc.data());
      localStorage.setItem('mustaqbal_products', JSON.stringify(products));
    } else {
      products = [];
    }

    // جلب الزبائن من السحابة (منع البيانات الافتراضية المتكررة)
    const custSnap = await db.collection('customers').get();
    if (!custSnap.empty) {
      customers = custSnap.docs.map(doc => doc.data());
      localStorage.setItem('mustaqbal_customers', JSON.stringify(customers));
    } else {
      customers = [];
    }

    // تحديث الواجهات بعد جلب البيانات
    if (typeof renderTabs === 'function') renderTabs();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof populateCategorySelect === 'function') populateCategorySelect();
    if (typeof renderAdminCustomersList === 'function') renderAdminCustomersList();
    
    console.log("تم مزامنة وجلب البيانات السحابية بنجاح");
  } catch (err) {
    console.error("خطأ في جلب البيانات من السحابة:", err);
  }
}

async function saveData() {
  localStorage.setItem('mustaqbal_categories', JSON.stringify(categories));
  localStorage.setItem('mustaqbal_products', JSON.stringify(products));
  localStorage.setItem('mustaqbal_customers', JSON.stringify(customers));
  localStorage.setItem('mustaqbal_invoices', JSON.stringify(invoices));
}

// إعدادات التخزين المحلي والذكي لمتجر المستقبل للجملة
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

// المتغيرات الأساسية (تبدأ فارغة لحين سحبها نظيفة من Firebase)
let categories = JSON.parse(localStorage.getItem('mustaqbal_categories')) || [
  { id: 'all', name: 'جميع المنتجات' }
];

let products = JSON.parse(localStorage.getItem('mustaqbal_products')) || [];
let customers = JSON.parse(localStorage.getItem('mustaqbal_customers')) || [];

let adminPassword = localStorage.getItem('mustaqbal_admin_pass') || '799673';
let cart = JSON.parse(localStorage.getItem('mustaqbal_cart')) || [];
let invoices = JSON.parse(localStorage.getItem('mustaqbal_invoices')) || [];
let activeCategory = 'all';

let isAdmin = localStorage.getItem('isAdmin') === 'true';
let loggedCustomer = JSON.parse(localStorage.getItem('loggedCustomer')) || null;
let currentImageData = ""; 

// تفعيل التحميل عند فتح الصفحة
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
      if (displaySpan && loggedCustomer) displaySpan.innerText = `${loggedCustomer.fullname}`;
      if (adminPanel) adminPanel.classList.add('hidden');
      if (adminTabCreator) adminTabCreator.classList.add('hidden');
      if (openCartBtn) openCartBtn.classList.remove('hidden');
      const custNameInput = document.getElementById('cust-name');
      if (custNameInput && loggedCustomer) custNameInput.value = loggedCustomer.fullname;
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

  const found = customers.find(c => c.username === u && c.password === p);
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
    if (custNameInput) custNameInput.value = found.fullname;
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

// ----------------------------------------------------
// إدارة الزبائن مع الحفظ والحذف الفعلي من Firebase
// ----------------------------------------------------

async function handleCustomerMgmtSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('new-cust-username').value.trim();
  const password = document.getElementById('new-cust-password').value.trim();
  const fullname = document.getElementById('new-cust-fullname').value.trim();
  const discountInput = document.getElementById('new-cust-discount');
  const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
  const editFlag = document.getElementById('edit-cust-username-flag').value;

  if (editFlag) {
    const cust = customers.find(c => c.username === editFlag);
    if (cust) {
      if (editFlag !== username) {
        customers = customers.filter(c => c.username !== editFlag);
        await db.collection('customers').doc(String(editFlag)).delete();
      }
      cust.username = username;
      cust.password = password;
      cust.fullname = fullname;
      cust.discount = discount;
      
      await db.collection('customers').doc(String(username)).set(cust);
      await saveData();
      renderAdminCustomersList();
      resetCustomerMgmtForm();
      alert('تم تحديث حساب الزبون بنجاح.');
    }
  } else {
    if (customers.some(c => c.username === username)) {
      alert('اسم المستخدم هذا موجود مسبقاً.');
      return;
    }
    const newCust = { username, password, fullname, discount };
    customers.push(newCust);
    await db.collection('customers').doc(String(username)).set(newCust);
    await saveData();
    renderAdminCustomersList();
    resetCustomerMgmtForm();
    alert('تم إضافة حساب الزبون بنجاح.');
  }
}

function editCustomer(username) {
  const cust = customers.find(c => c.username === username);
  if (!cust) return;

  document.getElementById('edit-cust-username-flag').value = cust.username;
  document.getElementById('new-cust-username').value = cust.username;
  document.getElementById('new-cust-password').value = cust.password;
  document.getElementById('new-cust-fullname').value = cust.fullname;
  document.getElementById('new-cust-discount').value = cust.discount;
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

  if (customers.length === 0) {
    listContainer.innerHTML = '<small style="color:var(--text-muted);">لا توجد حسابات زبائن مسجلة.</small>';
    return;
  }

  customers.forEach(cust => {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.75rem;';
    div.innerHTML = `
      <div>${cust.fullname} (${cust.username}) - <span style="color: var(--success); font-weight: bold;">خصم: ${cust.discount || 0}%</span></div>
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
    customers = customers.filter(c => c.username !== username);
    try {
      await db.collection('customers').doc(String(username)).delete();
    } catch (err) {
      console.error("فشل الحذف من السحابة:", err);
    }
    await saveData();
    renderAdminCustomersList();
  }
}

// ----------------------------------------------------
// إدارة الأقسام (التويبات) الحقيقية والمزامنة مع Firebase
// ----------------------------------------------------

function renderTabs() {
  const tabsContainer = document.getElementById('vertical-tabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  if (!isAdmin && !loggedCustomer) return;

  categories.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = `category-chip ${activeCategory === cat.id ? 'active' : ''}`;
    
    chip.innerHTML = `
      <span onclick="selectCategory('${cat.id}')">${cat.name}</span>
      ${isAdmin && cat.id !== 'all' ? `
        <span style="font-size:0.7rem; opacity:0.7; cursor:pointer;" onclick="editTab('${cat.id}')">✏️</span>
        <span style="font-size:0.7rem; opacity:0.7; cursor:pointer;" onclick="deleteTab('${cat.id}')">🗑️</span>
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
  categories.filter(c => c.id !== 'all').forEach(cat => {
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
  if (!name) return;

  const id = 'cat_' + Date.now();
  const newCat = { id, name };
  categories.push(newCat);
  
  try {
    await db.collection('categories').doc(String(id)).set(newCat);
  } catch (err) {
    console.error("فشل حفظ القسم في السحابة:", err);
  }

  await saveData();
  input.value = '';
  renderTabs();
  populateCategorySelect();
}

async function editTab(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  const newName = prompt('تعديل اسم القسم:', cat.name);
  if (newName && newName.trim() !== '') {
    cat.name = newName.trim();
    try {
      await db.collection('categories').doc(String(catId)).set(cat);
    } catch (err) {
      console.error("فشل تحديث القسم في السحابة:", err);
    }
    await saveData();
    renderTabs();
    populateCategorySelect();
  }
}

async function deleteTab(catId) {
  if (confirm('تأكيد حذف القسم وجميع منتجاته؟')) {
    categories = categories.filter(c => c.id !== catId);
    products = products.filter(p => p.category !== catId);
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

// ----------------------------------------------------
// إدارة المنتجات والحذف الفعلي من Firebase
// ----------------------------------------------------

async function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value;
  const category = document.getElementById('product-tab').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const desc = document.getElementById('product-desc').value;

  let savedProduct;
  if (id) {
    const index = products.findIndex(p => p.id == id);
    if (index !== -1) {
      savedProduct = {
        id: Number(id),
        name,
        category,
        price,
        desc,
        image: currentImageData || products[index].image
      };
      products[index] = savedProduct;
    }
  } else {
    savedProduct = {
      id: Date.now(),
      name,
      category,
      price,
      desc,
      image: currentImageData || ''
    };
    products.push(savedProduct);
  }

  try {
    await db.collection('products').doc(String(savedProduct.id)).set(savedProduct);
  } catch (err) {
    console.error("فشل حفظ المنتج في السحابة:", err);
  }

  await saveData();
  resetProductForm();
  renderProducts();
  alert('تم حفظ المنتج بنجاح!');
}

function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-tab').value = product.category;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-desc').value = product.desc;
  currentImageData = product.image;

  document.getElementById('save-product-btn').innerText = 'تحديث المنتج';
}

async function deleteProduct(id) {
  if (confirm('تأكيد حذف المنتج؟')) {
    products = products.filter(p => p.id !== id);
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

  let list = itemsToRender || (activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory));

  if (list.length === 0) {
    grid.innerHTML = '<p style="padding:15px; color:var(--text-muted); grid-column: 1 / -1; font-size:0.85rem; text-align:center;">لا توجد منتجات متاحة.</p>';
    return;
  }

  list.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const imgSrc = product.image || 'https://via.placeholder.com/220x140?text=لا+توجد+صورة';
    
    const effectivePrice = getCustomerProductPrice(product.price);

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
    (activeCategory === 'all' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(query) || (p.desc && p.desc.toLowerCase().includes(query)))
  );
  renderProducts(filtered);
}

// ----------------------------------------------------
// السلة والفواتير
// ----------------------------------------------------

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const effectivePrice = getCustomerProductPrice(product.price);

  const cartItem = cart.find(item => item.id === productId);
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
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  
  saveCart();
  updateCartUI();
  renderCartModal();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
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
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
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
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <div style="font-weight:700; font-size:0.85rem;">${item.name}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${formatPrice(item.price)} × ${item.qty} = <strong>${formatPrice(itemTotal)} د.ع</strong></div>
      </div>
      <div class="qty-controls">
        <button type="button" class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
        <span style="font-weight:bold; font-size:0.85rem;">${item.qty}</span>
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

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

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
      <td>${i.name}</td>
      <td style="text-align:center;">${i.qty}</td>
      <td style="text-align:left;">${formatPrice(i.price)}</td>
      <td style="text-align:left;">${formatPrice(i.price * i.qty)}</td>
    </tr>
  `).join('');

  area.innerHTML = `
    <div class="receipt-header">
      <h2 style="font-size:1.1rem; color:var(--primary-dark);">متجر المستقبل للجملة</h2>
      <p style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">رقم: ${invoice.id} | التاريخ: ${invoice.date}</p>
    </div>

    <div style="font-size:0.8rem; margin-bottom:12px; line-height:1.6;">
      <strong>الحساب:</strong> ${invoice.customer.username || 'غير محدد'}<br>
      <strong>الزبون:</strong> ${invoice.customer.name}<br>
      <strong>الهاتف:</strong> ${invoice.customer.phone}<br>
      <strong>العنوان:</strong> ${invoice.customer.address}
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
      المجموع الكلي: ${formatPrice(invoice.total)} د.ع
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
    displayedInvoices = invoices.filter(inv => inv.customer.username === loggedCustomer.username);
  } else if (!isAdmin && !loggedCustomer) {
    listContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:15px; font-size:0.8rem;">يرجى تسجيل الدخول.</p>';
    return;
  }

  if (displayedInvoices.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:15px; font-size:0.8rem;">لا توجد فواتير سابقة.</p>';
    return;
  }

  displayedInvoices.forEach(inv => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:var(--radius-sm); display:flex; flex-direction:column; gap:6px; font-size:0.8rem;';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-weight:bold; color:var(--primary-dark);">
        <span>${inv.id}</span>
        <span>${formatPrice(inv.total)} د.ع</span>
      </div>
      <div>الزبون: ${inv.customer.name}</div>
      <div style="font-size:0.7rem; color:var(--text-muted);">${inv.date}</div>
      <div style="display:flex; gap:6px; margin-top:4px;">
        <button class="btn" style="padding:4px 8px; font-size:0.75rem;" onclick="viewSingleInvoice('${inv.id}')">عرض</button>
        <button class="btn" style="background:var(--success); padding:4px 8px; font-size:0.75rem;" onclick="downloadSingleInvoiceAsImage('${inv.id}')">تحميل 📷</button>
        ${isAdmin ? `
          <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="deleteInvoice('${inv.id}')">حذف</button>
        ` : ''}
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function viewSingleInvoice(id) {
  const inv = invoices.find(i => i.id === id);
  if (!inv) return;
  renderReceiptHTML(inv);
  closeInvoicesModal();
  document.getElementById('receipt-modal').classList.remove('hidden');
}

function downloadSingleInvoiceAsImage(id) {
  const inv = invoices.find(i => i.id === id);
  if (!inv) return;
  renderReceiptHTML(inv);
  closeInvoicesModal();
  document.getElementById('receipt-modal').classList.remove('hidden');
  
  setTimeout(() => {
    downloadInvoiceAsImage('receipt-area');
  }, 200);
}

function deleteInvoice(id) {
  if (confirm('تأكيد حذف الفاتورة؟')) {
    invoices = invoices.filter(i => i.id !== id);
    saveData();
    renderInvoicesList();
  }
}

function switchNavTab(tab) {
  if (tab === 'store') {
    closeCartModal();
    closeInvoicesModal();
  }
}