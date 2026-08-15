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

let categories = JSON.parse(localStorage.getItem('categories')) || [
  { id: 'all', name: 'جميع المنتجات' },
  { id: 'electronics', name: 'إلكترونيات' },
  { id: 'clothing', name: 'ملابس' },
  { id: 'home', name: 'أدوات منزلية' }
];

let products = JSON.parse(localStorage.getItem('products')) || [
  { id: 1, name: 'سماعة لاسلكية (جملة)', category: 'electronics', price: 25000, desc: 'سماعة بلوتوث عالية الدقة', image: '' },
  { id: 2, name: 'قميص قطني (درزن)', category: 'clothing', price: 15000, desc: 'قميص صيفي مريح', image: '' },
  { id: 3, name: 'ساعة ذكية', category: 'electronics', price: 35000, desc: 'ساعة مع تتبع اللياقة', image: '' },
  { id: 4, name: 'خلاط فواكه (جملة)', category: 'home', price: 18000, desc: 'خلاط كهربائي سريع', image: '' }
];

let customers = JSON.parse(localStorage.getItem('customers')) || [
  { username: 'cust1', password: '123', fullname: 'زبون تجريبي', discount: 0 }
];

let adminPassword = localStorage.getItem('adminPassword') || 'admin';

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let invoices = JSON.parse(localStorage.getItem('invoices')) || [];
let activeCategory = 'all';
let isAdmin = false;
let loggedCustomer = JSON.parse(localStorage.getItem('loggedCustomer')) || null;
let currentImageData = ""; 

document.addEventListener('DOMContentLoaded', () => {
  checkInitialSessionState();
  renderTabs();
  renderProducts();
  updateCartUI();
  populateCategorySelect();
  setupImageUploader();
  renderAdminCustomersList();
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
    logoutBtn.classList.remove('hidden');
    loginSelectionBtn.classList.add('hidden');
    mainSidebar.classList.remove('hidden');
    searchBarContainer.classList.remove('hidden');
    productsGrid.classList.remove('hidden');
    loggedOutWelcome.classList.add('hidden');
    navInvoicesBtn.classList.remove('hidden');

    if (isAdmin) {
      displaySpan.innerText = 'المدير';
      adminPanel.classList.remove('hidden');
      adminTabCreator.classList.remove('hidden');
      openCartBtn.classList.remove('hidden');
    } else {
      displaySpan.innerText = `${loggedCustomer.fullname}`;
      adminPanel.classList.add('hidden');
      adminTabCreator.classList.add('hidden');
      openCartBtn.classList.remove('hidden');
      document.getElementById('cust-name').value = loggedCustomer.fullname;
    }
  } else {
    displaySpan.innerText = '';
    logoutBtn.classList.add('hidden');
    loginSelectionBtn.classList.remove('hidden');
    mainSidebar.classList.add('hidden');
    searchBarContainer.classList.add('hidden');
    adminPanel.classList.add('hidden');
    adminTabCreator.classList.add('hidden');
    productsGrid.classList.add('hidden');
    loggedOutWelcome.classList.remove('hidden');

    navInvoicesBtn.classList.add('hidden');
    openCartBtn.classList.add('hidden');
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
    closeCustomerLoginModal();
    checkInitialSessionState();
    renderTabs();
    renderProducts();
    updateCartUI();
    document.getElementById('cust-name').value = found.fullname;
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
    closeAdminLoginModal();
    checkInitialSessionState();
    renderTabs();
    renderProducts();
  } else {
    alert('بيانات دخول المدير غير صحيحة!');
  }
}

function handleLogout() {
  isAdmin = false;
  loggedCustomer = null;
  localStorage.removeItem('loggedCustomer');
  checkInitialSessionState();
}

function handleAdminPasswordChange(e) {
  e.preventDefault();
  const newPass = document.getElementById('new-admin-pass').value.trim();
  if (newPass) {
    adminPassword = newPass;
    localStorage.setItem('adminPassword', adminPassword);
    alert('تم تغيير كلمة سر المدير بنجاح!');
    document.getElementById('new-admin-pass').value = '';
  }
}

function saveCategories() { 
  try { localStorage.setItem('categories', JSON.stringify(categories)); } catch (e) {}
}

function saveProducts() { 
  try { localStorage.setItem('products', JSON.stringify(products)); } catch (e) { alert('حجم الصورة كبير جداً!'); }
}

function saveCustomers() {
  localStorage.setItem('customers', JSON.stringify(customers));
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function saveInvoices() { localStorage.setItem('invoices', JSON.stringify(invoices)); }

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

function handleCustomerMgmtSubmit(e) {
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
      cust.username = username;
      cust.password = password;
      cust.fullname = fullname;
      cust.discount = discount;
      saveCustomers();
      renderAdminCustomersList();
      resetCustomerMgmtForm();
      alert('تم تحديث حساب الزبون بنجاح.');
    }
  } else {
    if (customers.some(c => c.username === username)) {
      alert('اسم المستخدم هذا موجود مسبقاً.');
      return;
    }
    customers.push({ username, password, fullname, discount });
    saveCustomers();
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
    listContainer.innerHTML = '<small style="color:#64748b;">لا توجد حسابات زبائن مسجلة.</small>';
    return;
  }

  customers.forEach(cust => {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.75rem;';
    div.innerHTML = `
      <div>${cust.fullname} (${cust.username}) - <span style="color: #16a34a; font-weight: bold;">خصم: ${cust.discount || 0}%</span></div>
      <div style="display: flex; gap: 4px;">
        <button type="button" onclick="editCustomer('${cust.username}')" style="background: #f59e0b; color: white; border: none; padding: 2px 5px; border-radius: 3px; cursor: pointer; font-size: 0.7rem;">تعديل</button>
        <button type="button" onclick="deleteCustomer('${cust.username}')" style="background: #ef4444; color: white; border: none; padding: 2px 5px; border-radius: 3px; cursor: pointer; font-size: 0.7rem;">حذف</button>
      </div>
    `;
    listContainer.appendChild(div);
  });
}

function deleteCustomer(username) {
  if (confirm('تأكيد حذف حساب الزبون؟')) {
    customers = customers.filter(c => c.username !== username);
    saveCustomers();
    renderAdminCustomersList();
  }
}

function renderTabs() {
  const tabsContainer = document.getElementById('vertical-tabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  if (!isAdmin && !loggedCustomer) return;

  categories.forEach(cat => {
    const wrapper = document.createElement('div');
    wrapper.className = 'tab-item-wrapper';

    const tabBtn = document.createElement('button');
    tabBtn.className = `tab-btn ${activeCategory === cat.id ? 'active' : ''}`;
    tabBtn.innerText = cat.name;
    tabBtn.onclick = () => selectCategory(cat.id);

    wrapper.appendChild(tabBtn);

    if (isAdmin && cat.id !== 'all') {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'tab-admin-actions';
      actionsDiv.innerHTML = `
        <button class="tab-icon-btn edit" title="تعديل" onclick="editTab('${cat.id}')">✏️</button>
        <button class="tab-icon-btn delete" title="حذف" onclick="deleteTab('${cat.id}')">🗑️</button>
      `;
      wrapper.appendChild(actionsDiv);
    }

    tabsContainer.appendChild(wrapper);
  });
}

function selectCategory(catId) {
  activeCategory = catId;
  const currentCat = categories.find(c => c.id === catId);
  const titleElem = document.getElementById('current-tab-title');
  if (titleElem) {
    titleElem.innerText = currentCat ? currentCat.name : 'المنتجات';
  }
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

function handleAddTab(e) {
  e.preventDefault();
  const input = document.getElementById('tab-name-input');
  const name = input.value.trim();
  if (!name) return;

  const id = 'cat_' + Date.now();
  categories.push({ id, name });
  saveCategories();
  input.value = '';
  renderTabs();
  populateCategorySelect();
}

function editTab(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  const newName = prompt('تعديل اسم التبويب:', cat.name);
  if (newName && newName.trim() !== '') {
    cat.name = newName.trim();
    saveCategories();
    renderTabs();
    populateCategorySelect();
  }
}

function deleteTab(catId) {
  if (confirm('تأكيد حذف التبويب وجميع منتجاته؟')) {
    categories = categories.filter(c => c.id !== catId);
    products = products.filter(p => p.category !== catId);
    saveCategories();
    saveProducts();
    if (activeCategory === catId) activeCategory = 'all';
    renderTabs();
    populateCategorySelect();
    renderProducts();
  }
}

function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value;
  const category = document.getElementById('product-tab').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const desc = document.getElementById('product-desc').value;

  if (id) {
    const index = products.findIndex(p => p.id == id);
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

  saveProducts();
  resetProductForm();
  renderProducts();
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

function deleteProduct(id) {
  if (confirm('تأكيد حذف المنتج؟')) {
    products = products.filter(p => p.id !== id);
    saveProducts();
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
    grid.innerHTML = '<p style="padding:10px; color:#64748b; grid-column: 1 / -1; font-size:0.8rem;">لا توجد منتجات.</p>';
    return;
  }

  list.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const imgSrc = product.image || 'https://via.placeholder.com/220x140?text=بلا+صورة';
    
    const effectivePrice = getCustomerProductPrice(product.price);

    card.innerHTML = `
      <img src="${imgSrc}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/220x140?text=خطأ'">
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
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const filtered = products.filter(p =>
    (activeCategory === 'all' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(query) || (p.desc && p.desc.toLowerCase().includes(query)))
  );
  renderProducts(filtered);
}

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
    cartItemsContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:15px; font-size:0.8rem;">السلة فارغة</p>';
    document.getElementById('cart-total-price').innerText = '0';
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
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-sub">${formatPrice(item.price)} × ${item.qty} = <strong>${formatPrice(itemTotal)} د.ع</strong></div>
      </div>
      <div class="qty-controls">
        <button type="button" class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
        <span style="font-weight:bold; min-width:16px; text-align:center; font-size:0.8rem;">${item.qty}</span>
        <button type="button" class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        <button type="button" class="remove-item-btn" title="حذف" onclick="removeFromCart(${item.id})">🗑️</button>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });

  document.getElementById('cart-total-price').innerText = formatPrice(total);
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        document.getElementById('cust-location').value = mapsUrl;
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
  saveInvoices();
  renderReceiptHTML(newInvoice);

  cart = [];
  saveCart();
  updateCartUI();
  document.getElementById('checkout-form').reset();
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
      <div class="receipt-logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
      <h2>متجر المستقبل للجملة</h2>
      <p style="font-size:0.7rem; color:#64748b; margin-top:2px;">رقم: ${invoice.id} | التاريخ: ${invoice.date}</p>
    </div>

    <div class="receipt-info-block">
      <strong>الزبون:</strong> ${invoice.customer.name} (${invoice.customer.phone})<br>
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
            <body style="text-align:center; background:#f4f4f4; padding:15px; font-family:tahoma;">
              <h3 style="color:#333; font-size:0.9rem; margin-bottom:10px;">اضغط مطولاً على الصورة ثم اختر (تنزيل الصورة):</h3>
              <img src="${imageUrl}" style="max-width:100%; border:1px solid #ccc; border-radius:6px;" />
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
    listContainer.innerHTML = '<p style="text-align:center; color:#64748b; padding:15px; font-size:0.8rem;">يرجى تسجيل الدخول.</p>';
    return;
  }

  if (displayedInvoices.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:#64748b; padding:15px; font-size:0.8rem;">لا توجد فواتير سابقة.</p>';
    return;
  }

  displayedInvoices.forEach(inv => {
    const card = document.createElement('div');
    card.className = 'invoice-card-item';
    card.innerHTML = `
      <div class="invoice-card-header">
        <span>${inv.id}</span>
        <span>${formatPrice(inv.total)} د.ع</span>
      </div>
      <div> الزبون: ${inv.customer.name} | التاريخ: ${inv.date}</div>
      <div class="invoice-actions">
        <button class="small-btn view" onclick="viewSingleInvoice('${inv.id}')">عرض</button>
        <button class="small-btn download" onclick="downloadSingleInvoiceAsImage('${inv.id}')">تحميل 📷</button>
        ${isAdmin ? `
          <button class="small-btn delete" onclick="deleteInvoice('${inv.id}')">حذف</button>
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
    saveInvoices();
    renderInvoicesList();
  }
}