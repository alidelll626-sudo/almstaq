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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// توليد معرف فريد للجهاز/المتصفح الحالي وحفظه محلياً
let deviceId = localStorage.getItem('mustaqbal_device_id');
if (!deviceId) {
  deviceId = 'dev_' + Math.random().toString(36).substring(2) + Date.now();
  localStorage.setItem('mustaqbal_device_id', deviceId);
}

// ----------------------------------------------------
// نظام المزامنة والاتصال الحي الفوري (Realtime Sync)
// ----------------------------------------------------

function initRealtimeListeners() {
  db.collection('categories').onSnapshot(snapshot => {
    categories = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.id && data.name && data.name !== 'undefined') {
        categories.push(data);
      }
    });

    if (!categories.some(c => c.id === 'all')) {
      categories.unshift({ id: 'all', name: 'جميع المنتجات' });
    }

    localStorage.setItem('mustaqbal_categories', JSON.stringify(categories));
    
    if (typeof renderTabs === 'function') renderTabs();
    if (typeof populateCategorySelect === 'function') populateCategorySelect();
  }, err => {
    console.error("خطأ في مزامنة الأقسام الفورية:", err);
  });

  db.collection('products').onSnapshot(snapshot => {
    products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.id && data.name && data.name !== 'undefined') {
        products.push(data);
      }
    });

    localStorage.setItem('mustaqbal_products', JSON.stringify(products));

    if (typeof renderProducts === 'function') {
      const searchInput = document.getElementById('search-input');
      if (searchInput && searchInput.value.trim() !== '') {
        handleSearch();
      } else {
        renderProducts();
      }
    }
  }, err => {
    console.error("خطأ في مزامنة المنتجات الفورية:", err);
  });

  db.collection('customers').onSnapshot(snapshot => {
    customers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.username && data.username !== 'undefined') {
        customers.push(data);
      }
    });

    localStorage.setItem('mustaqbal_customers', JSON.stringify(customers));

    if (loggedCustomer) {
      const updatedMe = customers.find(c => c && c.username === loggedCustomer.username || (c && c.fullname === loggedCustomer.fullname));
      if (!updatedMe || (updatedMe.password !== loggedCustomer.password) || (updatedMe.activeDeviceId && updatedMe.activeDeviceId !== deviceId)) {
        if (updatedMe && updatedMe.activeDeviceId && updatedMe.activeDeviceId !== deviceId) {
          alert('تم تسجيل الدخول إلى هذا الحساب من جهاز أو متصفح آخر، سيتم إرجاعك للصفحة الرئيسية.');
        } else {
          alert('تم تغيير بيانات حسابك أو كلمة المرور من قبل الإدارة، يرجى تسجيل الدخول من جديد.');
        }
        handleLogout(false);
      } else {
        loggedCustomer = updatedMe;
        localStorage.setItem('loggedCustomer', JSON.stringify(loggedCustomer));
        if (typeof renderProducts === 'function') renderProducts();
      }
    }

    if (typeof renderAdminCustomersList === 'function') renderAdminCustomersList();
  }, err => {
    console.error("خطأ في مزامنة الزبائن الفورية:", err);
  });

  // مزامنة حسابات المناديب مع فحص فتح الحساب من جهاز آخر حصراً
  db.collection('delegates').onSnapshot(snapshot => {
    delegates = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.username && data.username !== 'undefined') {
        delegates.push(data);
      }
    });

    localStorage.setItem('mustaqbal_delegates', JSON.stringify(delegates));

    if (loggedDelegate) {
      const updatedMe = delegates.find(d => d && d.username === loggedDelegate.username);
      // فحص إذا تم تغيير كلمة المرور أو إذا فُتح الحساب من جهاز آخر مختلف
      if (!updatedMe || updatedMe.password !== loggedDelegate.password || (updatedMe.activeDeviceId && updatedMe.activeDeviceId !== deviceId)) {
        if (updatedMe && updatedMe.activeDeviceId && updatedMe.activeDeviceId !== deviceId) {
          alert('تم تسجيل الدخول إلى حساب المندوب هذا من جهاز أو متصفح آخر! لا يمكن فتح الحساب في أكثر من مكان بنفس الوقت.');
        } else {
          alert('تم تغيير بيانات حسابك أو كلمة المرور من قبل الإدارة.');
        }
        handleLogout(false);
      } else {
        loggedDelegate = updatedMe;
        localStorage.setItem('loggedDelegate', JSON.stringify(loggedDelegate));
        if (typeof renderDelegateClientsList === 'function' && !document.getElementById('delegate-clients-modal').classList.contains('hidden')) {
          renderDelegateClientsList();
        }
      }
    }

    if (typeof renderAdminDelegatesList === 'function') renderAdminDelegatesList();
  }, err => {
    console.error("خطأ في مزامنة المناديب الفورية:", err);
  });

  db.collection('invoices').onSnapshot(snapshot => {
    invoices = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.id) {
        invoices.push(data);
      }
    });
    invoices.sort((a, b) => b.id.localeCompare(a.id));
    localStorage.setItem('mustaqbal_invoices', JSON.stringify(invoices));
    
    const invoicesModal = document.getElementById('invoices-modal');
    if (invoicesModal && !invoicesModal.classList.contains('hidden')) {
      renderInvoicesList();
    }
  }, err => {
    console.error("خطأ في مزامنة الفواتير:", err);
  });
}

// دالة التحديث اليدوي (الرفريش)
async function refreshAppData() {
  try {
    const btn = document.querySelector('header button[onclick="refreshAppData()"]');
    if(btn) btn.innerText = "⏳ جاري التحديث...";

    const [catSnap, prodSnap, custSnap, delSnap, invSnap] = await Promise.all([
      db.collection('categories').get(),
      db.collection('products').get(),
      db.collection('customers').get(),
      db.collection('delegates').get(),
      db.collection('invoices').get()
    ]);

    categories = [{ id: 'all', name: 'جميع المنتجات' }];
    catSnap.forEach(doc => {
      const data = doc.data();
      if (data && data.id && data.name && data.id !== 'all') categories.push(data);
    });

    products = [];
    prodSnap.forEach(doc => {
      const data = doc.data();
      if (data && data.id) products.push(data);
    });

    customers = [];
    custSnap.forEach(doc => {
      const data = doc.data();
      if (data && data.username) customers.push(data);
    });

    delegates = [];
    delSnap.forEach(doc => {
      const data = doc.data();
      if (data && data.username) {
        if(loggedDelegate && data.username === loggedDelegate.username) {
          loggedDelegate = data;
          localStorage.setItem('loggedDelegate', JSON.stringify(loggedDelegate));
        }
        delegates.push(data);
      }
    });

    invoices = [];
    invSnap.forEach(doc => {
      const data = doc.data();
      if (data && data.id) invoices.push(data);
    });
    invoices.sort((a, b) => b.id.localeCompare(a.id));

    localStorage.setItem('mustaqbal_categories', JSON.stringify(categories));
    localStorage.setItem('mustaqbal_products', JSON.stringify(products));
    localStorage.setItem('mustaqbal_customers', JSON.stringify(customers));
    localStorage.setItem('mustaqbal_delegates', JSON.stringify(delegates));
    localStorage.setItem('mustaqbal_invoices', JSON.stringify(invoices));

    renderTabs();
    renderProducts();
    populateCategorySelect();
    renderAdminCustomersList();
    renderAdminDelegatesList();
    if(!document.getElementById('cart-modal').classList.contains('hidden')) renderCartModal();
    if(!document.getElementById('delegate-clients-modal').classList.contains('hidden')) renderDelegateClientsList();

    if(btn) {
      btn.innerText = "🔄 تم التحديث";
      setTimeout(() => { btn.innerText = "🔄 تحديث"; }, 2000);
    }
  } catch (err) {
    console.error("فشل التحديث اليدوي:", err);
    alert("حدث خطأ أثناء الاتصال بالسحابة لتحديث البيانات.");
    const btn = document.querySelector('header button[onclick="refreshAppData()"]');
    if(btn) btn.innerText = "🔄 تحديث";
  }
}

// ==========================================
// ⚡ دالة الحفظ المحلي
// ==========================================
function saveData() {
  categories = categories.filter(c => c && c.id && c.name && c.name !== 'undefined');
  products = products.filter(p => p && p.id && p.name && p.name !== 'undefined');
  customers = customers.filter(c => c && c.username && c.username !== 'undefined');
  delegates = delegates.filter(d => d && d.username && d.username !== 'undefined');

  localStorage.setItem('mustaqbal_categories', JSON.stringify(categories));
  localStorage.setItem('mustaqbal_products', JSON.stringify(products));
  localStorage.setItem('mustaqbal_customers', JSON.stringify(customers));
  localStorage.setItem('mustaqbal_delegates', JSON.stringify(delegates));
  localStorage.setItem('mustaqbal_invoices', JSON.stringify(invoices));
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

let delegates = (JSON.parse(localStorage.getItem('mustaqbal_delegates')) || []).filter(d => d && d.username && d.username !== 'undefined');

let adminPassword = localStorage.getItem('mustaqbal_admin_pass') || '799673';
let cart = JSON.parse(localStorage.getItem('mustaqbal_cart')) || [];
let invoices = JSON.parse(localStorage.getItem('mustaqbal_invoices')) || [];
let activeCategory = 'all';

let isAdmin = localStorage.getItem('isAdmin') === 'true';
let loggedCustomer = JSON.parse(localStorage.getItem('loggedCustomer')) || null;
let loggedDelegate = JSON.parse(localStorage.getItem('loggedDelegate')) || null;
let currentImageData = ""; 

document.addEventListener('DOMContentLoaded', () => {
  try {
    const hideLoaders = () => {
      const elements = document.querySelectorAll('#loader, .loader, .spinner, .loading, [class*="loader"], [class*="spinner"]');
      elements.forEach(el => {
        el.style.display = 'none';
        el.remove();
      });
    };
    hideLoaders();
    setTimeout(hideLoaders, 100);
    setTimeout(hideLoaders, 500);

    initRealtimeListeners();

    checkInitialSessionState();
    renderTabs();
    renderProducts();
    updateCartUI();
    populateCategorySelect();
    setupImageUploader();
    renderAdminCustomersList();
    renderAdminDelegatesList();
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
  const navDelegatesClientsBtn = document.getElementById('nav-delegates-clients-btn');
  const openCartBtn = document.getElementById('open-cart-btn');

  const isLogged = isAdmin || loggedCustomer || loggedDelegate;

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
      if (navDelegatesClientsBtn) navDelegatesClientsBtn.classList.add('hidden');
    } else if (loggedDelegate) {
      if (displaySpan) displaySpan.innerText = `مندوب: ${loggedDelegate.fullname || loggedDelegate.username}`;
      if (adminPanel) adminPanel.classList.add('hidden');
      if (adminTabCreator) adminTabCreator.classList.add('hidden');
      if (openCartBtn) openCartBtn.classList.remove('hidden');
      if (navDelegatesClientsBtn) navDelegatesClientsBtn.classList.remove('hidden');
    } else {
      if (displaySpan && loggedCustomer) displaySpan.innerText = `${loggedCustomer.fullname || loggedCustomer.username}`;
      if (adminPanel) adminPanel.classList.add('hidden');
      if (adminTabCreator) adminTabCreator.classList.add('hidden');
      
      // 🟢 إظهار زر/أيقونة السلة للزبون بشكل مؤكد عند تسجيل الدخول
      if (openCartBtn) openCartBtn.classList.remove('hidden');
      
      if (navDelegatesClientsBtn) navDelegatesClientsBtn.classList.add('hidden');
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
    if (navDelegatesClientsBtn) navDelegatesClientsBtn.classList.add('hidden');
    if (openCartBtn) openCartBtn.classList.add('hidden');
  }
}

function openLoginSelectionModal() { document.getElementById('login-selection-modal').classList.remove('hidden'); }
function closeLoginSelectionModal() { document.getElementById('login-selection-modal').classList.add('hidden'); }

function openCustomerLoginModal() { closeLoginSelectionModal(); document.getElementById('customer-login-modal').classList.remove('hidden'); }
function closeCustomerLoginModal() { document.getElementById('customer-login-modal').classList.add('hidden'); }

function openDelegateLoginModal() { closeLoginSelectionModal(); document.getElementById('delegate-login-modal').classList.remove('hidden'); }
function closeDelegateLoginModal() { document.getElementById('delegate-login-modal').classList.add('hidden'); }

function openAdminLoginModal() { closeLoginSelectionModal(); document.getElementById('admin-login-modal').classList.remove('hidden'); }
function closeAdminLoginModal() { document.getElementById('admin-login-modal').classList.add('hidden'); }

async function handleCustomerLogin(e) {
  e.preventDefault();
  const u = document.getElementById('cust-login-user').value.trim();
  const p = document.getElementById('cust-login-pass').value.trim();

  const found = customers.find(c => c && c.username === u && c.password === p);
  if (found) {
    if (found.activeDeviceId && found.activeDeviceId !== deviceId) {
      alert('هذا الحساب مفتوح حالياً على جهاز أو متصفح آخر!');
      return;
    }

    found.activeDeviceId = deviceId;
    loggedCustomer = found;
    loggedDelegate = null;
    isAdmin = false;
    
    localStorage.setItem('loggedCustomer', JSON.stringify(loggedCustomer));
    localStorage.removeItem('loggedDelegate');
    localStorage.setItem('isAdmin', 'false');

    try {
      await db.collection('customers').doc(String(found.username)).update({ activeDeviceId: deviceId });
    } catch (err) {
      console.error(err);
    }

    closeCustomerLoginModal();
    checkInitialSessionState();
    renderTabs();
    renderProducts();
    updateCartUI();
  } else {
    alert('اسم المستخدم أو كلمة المرور غير صحيحة!');
  }
}

async function handleDelegateLogin(e) {
  e.preventDefault();
  const u = document.getElementById('del-login-user').value.trim();
  const p = document.getElementById('del-login-pass').value.trim();

  const found = delegates.find(d => d && d.username === u && d.password === p);
  if (found) {
    if (found.activeDeviceId && found.activeDeviceId !== deviceId) {
      alert('عذراً، حساب هذا المندوب مفتوح حالياً على متصفح أو جهاز آخر! يجب تسجيل الخروج من الجهاز الآخر أولاً.');
      return;
    }

    found.activeDeviceId = deviceId;
    loggedDelegate = found;
    loggedCustomer = null;
    isAdmin = false;

    localStorage.setItem('loggedDelegate', JSON.stringify(loggedDelegate));
    localStorage.removeItem('loggedCustomer');
    localStorage.setItem('isAdmin', 'false');

    try {
      await db.collection('delegates').doc(String(found.username)).update({ activeDeviceId: deviceId });
    } catch (err) {
      console.error(err);
    }

    closeDelegateLoginModal();
    checkInitialSessionState();
    renderTabs();
    renderProducts();
    updateCartUI();
  } else {
    alert('اسم المستخدم أو كلمة المرور للمندوب غير صحيحة!');
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const u = document.getElementById('admin-user-input').value.trim();
  const p = document.getElementById('admin-pass-input').value.trim();

  if (u === 'admin' && p === adminPassword) {
    isAdmin = true;
    loggedCustomer = null;
    loggedDelegate = null;
    localStorage.removeItem('loggedCustomer');
    localStorage.removeItem('loggedDelegate');
    localStorage.setItem('isAdmin', 'true');
    closeAdminLoginModal();
    checkInitialSessionState();
    renderTabs();
    renderProducts();
    renderAdminCustomersList();
    renderAdminDelegatesList();
  } else {
    alert('بيانات دخول المدير غير صحيحة!');
  }
}

async function handleLogout(updateCloud = true) {
  if (updateCloud) {
    if (loggedCustomer) {
      try {
        await db.collection('customers').doc(String(loggedCustomer.username)).update({
          activeDeviceId: firebase.firestore.FieldValue.delete()
        });
      } catch (err) {
        console.error(err);
      }
    } else if (loggedDelegate) {
      try {
        await db.collection('delegates').doc(String(loggedDelegate.username)).update({
          activeDeviceId: firebase.firestore.FieldValue.delete()
        });
      } catch (err) {
        console.error(err);
      }
    }
  }

  isAdmin = false;
  loggedCustomer = null;
  loggedDelegate = null;
  localStorage.removeItem('loggedCustomer');
  localStorage.removeItem('loggedDelegate');
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

async function handleDelegateMgmtSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('new-del-username').value.trim();
  const password = document.getElementById('new-del-password').value.trim();
  const fullname = document.getElementById('new-del-fullname').value.trim();
  const editFlag = document.getElementById('edit-del-username-flag').value;

  if (!username) return;

  const delData = { username, password, fullname, clients: [], activeDeviceId: null };

  if (editFlag) {
    if (editFlag !== username) {
      try { await db.collection('delegates').doc(String(editFlag)).delete(); } catch(err){}
      delegates = delegates.filter(d => d.username !== editFlag);
    }
    const del = delegates.find(d => d.username === editFlag || d.username === username);
    if (del) {
      del.username = username;
      del.password = password;
      del.fullname = fullname;
      delData.clients = del.clients || [];
      delData.activeDeviceId = del.activeDeviceId || null;
    } else {
      delegates.push(delData);
    }
  } else {
    if (delegates.some(d => d.username === username)) {
      alert('اسم المستخدم موجود مسبقاً.');
      return;
    }
    delegates.push(delData);
  }

  saveData();
  renderAdminDelegatesList();
  resetDelegateMgmtForm();

  try {
    await db.collection('delegates').doc(String(username)).set(delData);
    alert(editFlag ? 'تم تحديث حساب المندوب بنجاح.' : 'تم إضافة حساب المندوب بنجاح.');
  } catch(err) {
    console.error("خطأ أثناء الحفظ بالسحابة:", err);
  }
}

function editDelegate(username) {
  const del = delegates.find(d => d.username === username);
  if (!del) return;
  document.getElementById('edit-del-username-flag').value = del.username;
  document.getElementById('new-del-username').value = del.username;
  document.getElementById('new-del-password').value = del.password;
  document.getElementById('new-del-fullname').value = del.fullname || '';
  document.getElementById('save-delegate-btn').innerText = 'تحديث المندوب';
}

function resetDelegateMgmtForm() {
  document.getElementById('delegate-mgmt-form').reset();
  document.getElementById('edit-del-username-flag').value = '';
  document.getElementById('save-delegate-btn').innerText = 'إضافة حساب مندوب';
}

function renderAdminDelegatesList() {
  const container = document.getElementById('delegates-list-admin');
  if (!container) return;
  container.innerHTML = '';
  if (delegates.length === 0) {
    container.innerHTML = '<small style="color:var(--text-muted);">لا توجد حسابات مناديب مسجلة.</small>';
    return;
  }
  delegates.forEach(del => {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.75rem;';
    div.innerHTML = `
      <div>${del.fullname} (${del.username})</div>
      <div style="display: flex; gap: 4px;">
        <button type="button" onclick="editDelegate('${del.username}')" style="background: #fef3c7; color: #d97706; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer;">تعديل</button>
        <button type="button" onclick="deleteDelegate('${del.username}')" style="background: #fef2f2; color: #ef4444; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer;">حذف</button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function deleteDelegate(username) {
  if (confirm('تأكيد حذف حساب المندوب؟')) {
    delegates = delegates.filter(d => d.username !== username);
    try { await db.collection('delegates').doc(String(username)).delete(); } catch(err){}
    saveData();
    renderAdminDelegatesList();
  }
}

function openDelegateClientsModal() {
  const searchInput = document.getElementById('delegate-client-search-input');
  if(searchInput) searchInput.value = '';
  renderDelegateClientsList();
  document.getElementById('delegate-clients-modal').classList.remove('hidden');
}

function closeDelegateClientsModal() {
  document.getElementById('delegate-clients-modal').classList.add('hidden');
}

async function handleDelegateClientSubmit(e) {
  e.preventDefault();
  if (!loggedDelegate) return;

  const nameInput = document.getElementById('client-name');
  const phoneInput = document.getElementById('client-phone');
  const addressInput = document.getElementById('client-address');
  const editIdInput = document.getElementById('edit-client-id-flag');

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const editId = editIdInput.value;

  if (!loggedDelegate.clients) loggedDelegate.clients = [];

  if (editId) {
    const client = loggedDelegate.clients.find(c => String(c.id) === String(editId));
    if (client) {
      client.name = name;
      client.phone = phone;
      client.address = address;
    }
  } else {
    loggedDelegate.clients.push({ id: Date.now(), name, phone, address });
  }

  localStorage.setItem('loggedDelegate', JSON.stringify(loggedDelegate));

  const delegateIndex = delegates.findIndex(d => d.username === loggedDelegate.username);
  if (delegateIndex !== -1) {
    delegates[delegateIndex] = loggedDelegate;
    localStorage.setItem('mustaqbal_delegates', JSON.stringify(delegates));
  }

  try {
    await db.collection('delegates').doc(String(loggedDelegate.username)).set(loggedDelegate);
  } catch (err) {
    console.error("خطأ أثناء مزامنة إضافة الزبون مع السحابة:", err);
  }

  renderDelegateClientsList();
  
  document.getElementById('delegate-client-form').reset();
  editIdInput.value = '';
  document.getElementById('save-client-btn').innerText = 'حفظ الزبون';
  
  alert('تم الإضافة بنجاح');
}

function renderDelegateClientsList() {
  const container = document.getElementById('delegate-clients-list');
  if (!container || !loggedDelegate) return;
  container.innerHTML = '';
  
  let clients = loggedDelegate.clients || [];
  
  const searchInput = document.getElementById('delegate-client-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (query) {
    clients = clients.filter(c => 
      (c.name && c.name.toLowerCase().includes(query)) || 
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query))
    );
  }

  if (clients.length === 0) {
    container.innerHTML = '<small style="color:var(--text-muted); text-align:center;">لا توجد نتائج مطابقة لبيانات الزبائن.</small>';
    return;
  }

  clients.forEach(c => {
    const div = document.createElement('div');
    div.style.cssText = 'background:#fff; padding:8px; border:1px solid var(--border-color); border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;';
    div.innerHTML = `
      <div>
        <strong>${c.name}</strong><br>
        <span style="color:var(--text-muted);">هاتف: ${c.phone} | عنوان: ${c.address}</span>
      </div>
      <div style="display:flex; gap:4px;">
        <button type="button" class="btn" style="padding:4px 8px; font-size:0.7rem;" onclick="editDelegateClient('${c.id}')">تعديل</button>
        <button type="button" class="btn btn-danger" style="padding:4px 8px; font-size:0.7rem;" onclick="deleteDelegateClient('${c.id}')">حذف</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function editDelegateClient(id) {
  if (!loggedDelegate || !loggedDelegate.clients) return;
  const c = loggedDelegate.clients.find(item => String(item.id) === String(id));
  if (!c) return;
  document.getElementById('edit-client-id-flag').value = c.id;
  document.getElementById('client-name').value = c.name;
  document.getElementById('client-phone').value = c.phone;
  document.getElementById('client-address').value = c.address;
  document.getElementById('save-client-btn').innerText = 'تحديث الزبون';
}

async function deleteDelegateClient(id) {
  if (!loggedDelegate || !loggedDelegate.clients) return;
  
  if (confirm('تأكيد حذف الزبون من قائمتك؟')) {
    loggedDelegate.clients = loggedDelegate.clients.filter(c => String(c.id).trim() !== String(id).trim());
    
    localStorage.setItem('loggedDelegate', JSON.stringify(loggedDelegate));
    
    const delegateIndex = delegates.findIndex(d => d.username === loggedDelegate.username);
    if (delegateIndex !== -1) {
      delegates[delegateIndex] = loggedDelegate;
      localStorage.setItem('mustaqbal_delegates', JSON.stringify(delegates));
    }

    try {
      await db.collection('delegates').doc(String(loggedDelegate.username)).set(loggedDelegate);
    } catch (err) {
      console.error("خطأ أثناء مزامنة الحذف مع السحابة:", err);
    }
    
    renderDelegateClientsList();
    
    if (typeof prepareCartClientSelection === 'function') {
      prepareCartClientSelection();
    }
  }
}

function prepareCartClientSelection() {
  const wrap = document.getElementById('delegate-client-select-wrap');
  const searchInput = document.getElementById('searchCustomerInput');
  const dropdownResults = document.getElementById('customerDropdownResults');
  
  if (!wrap) return;

  if (loggedDelegate && loggedDelegate.clients && loggedDelegate.clients.length > 0) {
    wrap.classList.remove('hidden');
    if (searchInput) searchInput.value = '';
    if (dropdownResults) {
      dropdownResults.style.display = 'none';
      dropdownResults.innerHTML = '';
    }
  } else {
    wrap.classList.add('hidden');
  }
}

function filterDelegateDropdown() {
  const input = document.getElementById('searchCustomerInput');
  const dropdownResults = document.getElementById('customerDropdownResults');
  if (!input || !dropdownResults || !loggedDelegate || !loggedDelegate.clients) return;

  const query = input.value.toLowerCase().trim();
  dropdownResults.innerHTML = '';

  if (query === '') {
    dropdownResults.style.display = 'none';
    return;
  }

  const filteredClients = loggedDelegate.clients.filter(c => 
    (c.name && c.name.toLowerCase().includes(query)) || 
    (c.phone && c.phone.toLowerCase().includes(query)) ||
    (c.address && c.address.toLowerCase().includes(query))
  );

  if (filteredClients.length === 0) {
    dropdownResults.style.display = 'block';
    const li = document.createElement('li');
    li.style.cssText = 'padding: 8px 12px; font-size: 0.75rem; color: var(--text-muted); text-align: center;';
    li.innerText = 'لا توجد نتائج مطابقة';
    dropdownResults.appendChild(li);
    return;
  }

  dropdownResults.style.display = 'block';
  filteredClients.forEach(c => {
    const li = document.createElement('li');
    li.style.cssText = 'padding: 8px 12px; font-size: 0.8rem; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;';
    li.innerHTML = `<strong>${c.name}</strong> <span style="color:var(--text-muted); font-size:0.7rem;">(${c.phone})</span>`;
    
    li.onmouseover = () => li.style.background = '#f3f4f6';
    li.onmouseout = () => li.style.background = '#fff';
    
    li.onclick = () => {
      document.getElementById('cust-name').value = c.name || '';
      document.getElementById('cust-phone').value = c.phone || '';
      document.getElementById('cust-address').value = c.address || '';
      input.value = c.name || '';
      dropdownResults.style.display = 'none';
    };

    dropdownResults.appendChild(li);
  });
}

async function handleCustomerMgmtSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('new-cust-username').value.trim();
  const password = document.getElementById('new-cust-password').value.trim();
  const fullname = document.getElementById('new-cust-fullname').value.trim();
  const discountInput = document.getElementById('new-cust-discount');
  const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
  const editFlag = document.getElementById('edit-cust-username-flag').value;

  if (!username) return;

  const custData = { username, password, fullname, discount };

  if (editFlag) {
    if (editFlag !== username) {
      try { await db.collection('customers').doc(String(editFlag)).delete(); } catch(err){}
      customers = customers.filter(c => c.username !== editFlag);
    }
    const cust = customers.find(c => c.username === editFlag || c.username === username);
    if (cust) {
      cust.username = username;
      cust.password = password;
      cust.fullname = fullname;
      cust.discount = discount;
    } else {
      customers.push(custData);
    }
  } else {
    if (customers.some(c => c.username === username)) {
      alert('اسم المستخدم موجود مسبقاً.');
      return;
    }
    customers.push(custData);
  }

  saveData();
  renderAdminCustomersList();
  resetCustomerMgmtForm();

  try {
    await db.collection('customers').doc(String(username)).set(custData);
    alert(editFlag ? 'تم تحديث حساب الزبون بنجاح.' : 'تم إضافة حساب الزبون بنجاح.');
  } catch(err) {
    console.error("خطأ أثناء الحفظ بالسحابة:", err);
  }
}

function editCustomer(username) {
  const cust = customers.find(c => c.username === username);
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
        <button type="button" onclick="editCustomer('${cust.username}')" style="background: #fef3c7; color: #d97706; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer;">تعديل</button>
        <button type="button" onclick="deleteCustomer('${cust.username}')" style="background: #fef2f2; color: #ef4444; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer;">حذف</button>
      </div>
    `;
    listContainer.appendChild(div);
  });
}

async function deleteCustomer(username) {
  if (confirm('تأكيد حذف حساب الزبون؟')) {
    customers = customers.filter(c => c.username !== username);
    try { await db.collection('customers').doc(String(username)).delete(); } catch(err){}
    saveData();
    renderAdminCustomersList();
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
              if (width > maxDimension) { height = Math.round((height * maxDimension) / width); width = maxDimension; }
            } else {
              if (height > maxDimension) { width = Math.round((width * maxDimension) / height); height = maxDimension; }
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

function renderTabs() {
  const tabsContainer = document.getElementById('vertical-tabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  if (!isAdmin && !loggedCustomer && !loggedDelegate) return;

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
  categories.filter(c => c && c.id !== 'all').forEach(cat => {
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

  const catData = { id: 'cat_' + Date.now(), name };
  categories.push(catData);
  saveData();
  input.value = '';
  renderTabs();
  populateCategorySelect();

  try {
    await db.collection('categories').doc(String(catData.id)).set(catData);
  } catch(err) {
    console.error("خطأ في حفظ القسم بالسحابة:", err);
  }
}

async function editTab(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  const newName = prompt('تعديل اسم القسم:', cat.name);
  if (newName && newName.trim() !== '') {
    cat.name = newName.trim();
    saveData();
    renderTabs();
    populateCategorySelect();

    try {
      await db.collection('categories').doc(String(catId)).set(cat);
    } catch(err) {
      console.error("خطأ في تحديث القسم بالسحابة:", err);
    }
  }
}

async function deleteTab(catId) {
  if (confirm('تأكيد حذف القسم وجميع منتجاته؟')) {
    categories = categories.filter(c => c.id !== catId);
    products = products.filter(p => p.category !== catId);
    try { await db.collection('categories').doc(String(catId)).delete(); } catch(err){}
    saveData();
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

  if (!name) return;

  const productData = {
    id: id ? Number(id) : Date.now(),
    name,
    category,
    price,
    desc,
    image: currentImageData || ''
  };

  if (id) {
    const index = products.findIndex(p => p.id == id);
    if (index !== -1) {
      if (!currentImageData) productData.image = products[index].image;
      products[index] = productData;
    }
  } else {
    products.push(productData);
  }

  saveData();
  resetProductForm();
  renderProducts();

  try {
    await db.collection('products').doc(String(productData.id)).set(productData);
    alert('تم حفظ المنتج بنجاح!');
  } catch (err) {
    console.error("خطأ في حفظ المنتج بالسحابة:", err);
  }
}

function editProduct(id) {
  const product = products.find(p => p.id === id);
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
    products = products.filter(p => p.id !== id);
    try { await db.collection('products').doc(String(id)).delete(); } catch(err){}
    saveData();
    renderProducts();
  }
}

function resetProductForm() {
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  currentImageData = "";
  document.getElementById('save-product-btn').innerText = 'حفظ المنتج';
}

function renderProducts(itemsToRender = null) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!isAdmin && !loggedCustomer && !loggedDelegate) return;

  let list = itemsToRender || (activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory));

  if (!list || list.length === 0) {
    grid.innerHTML = '<p style="padding:15px; color:var(--text-muted); grid-column: 1 / -1; font-size:0.85rem; text-align:center;">لا توجد منتجات متاحة.</p>';
    return;
  }

  list.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const imgSrc = product.image || 'https://via.placeholder.com/220x140?text=لا+توجد+صورة';
    const effectivePrice = getCustomerProductPrice(product.price || 0);

    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${imgSrc}" alt="${product.name}" class="product-image">
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
    p.name && (activeCategory === 'all' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(query) || (p.desc && p.desc.toLowerCase().includes(query)))
  );
  renderProducts(filtered);
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const effectivePrice = getCustomerProductPrice(product.price || 0);
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
  const totalItems = cart.reduce((acc, item) => acc + (item.qty || 0), 0);
  const cartCountElem = document.getElementById('cart-count');
  if (cartCountElem) cartCountElem.innerText = totalItems;
}

function openCartModal() {
  prepareCartClientSelection();
  const searchInput = document.getElementById('cart-search-input');
  if(searchInput) searchInput.value = '';
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

  const searchInput = document.getElementById('cart-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  let itemsToDisplay = cart;
  if (query) {
    itemsToDisplay = cart.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.desc && item.desc.toLowerCase().includes(query))
    );
  }

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px; font-size:0.85rem;">السلة فارغة حالياً</p>';
    document.getElementById('cart-total-price').innerText = '0';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  if (clearBtn) clearBtn.style.display = 'inline-block';

  if (itemsToDisplay.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:10px; font-size:0.8rem;">لا توجد منتجات مطابقة للبحث داخل السلة</p>';
    document.getElementById('cart-total-price').innerText = formatPrice(cart.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 0)), 0));
    return;
  }

  itemsToDisplay.forEach(item => {
    const itemTotal = (item.price || 0) * (item.qty || 0);
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

  const fullCartTotal = cart.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 0)), 0);
  document.getElementById('cart-total-price').innerText = formatPrice(fullCartTotal);
}

async function handleCheckout(e) {
  e.preventDefault();
  if (cart.length === 0) {
    alert('السلة فارغة!');
    return;
  }

  const custName = document.getElementById('cust-name').value.trim();
  const custPhone = document.getElementById('cust-phone').value.trim();
  const custAddress = document.getElementById('cust-address').value.trim();

  let accountSource = 'غير محدد';
  if (loggedCustomer) accountSource = 'زبون: ' + loggedCustomer.username;
  else if (loggedDelegate) accountSource = 'مندوب: ' + loggedDelegate.username;
  else if (isAdmin) accountSource = 'المدير';

  const totalAmount = cart.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 0)), 0);

  const newInvoice = {
    id: 'INV-' + Date.now(),
    date: new Date().toLocaleString('ar-IQ'),
    customer: { 
      name: custName, 
      phone: custPhone, 
      address: custAddress, 
      username: accountSource,
      discountApplied: loggedCustomer ? loggedCustomer.discount : 0
    },
    items: [...cart],
    total: totalAmount
  };

  invoices.unshift(newInvoice);
  localStorage.setItem('mustaqbal_invoices', JSON.stringify(invoices));

  try {
    await db.collection('invoices').doc(String(newInvoice.id)).set(newInvoice);
  } catch (err) {
    console.error(err);
  }

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
      <h2 style="font-size:1.1rem; color:var(--primary-dark);">متجر المستقبل للجملة</h2>
      <p style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">رقم: ${invoice.id} | التاريخ: ${invoice.date}</p>
    </div>

    <div style="font-size:0.8rem; margin-bottom:12px; line-height:1.6;">
      <strong>الحساب/الجهة:</strong> ${invoice.customer.username}<br>
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

  html2canvas(invoiceElement, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }).then(canvas => {
    const imageUrl = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'invoice.png';
    link.click();
  });
}

function closeReceiptModal() { document.getElementById('receipt-modal').classList.add('hidden'); }

function openInvoicesModal() {
  renderInvoicesList();
  document.getElementById('invoices-modal').classList.remove('hidden');
}

function renderInvoicesList() {
  const listContainer = document.getElementById('invoices-list');
  const titleContainer = document.getElementById('invoices-modal-title');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  let visibleInvoices = invoices;

  if (loggedCustomer) {
    visibleInvoices = invoices.filter(inv => inv.customer && inv.customer.username.includes(loggedCustomer.username));
    if (titleContainer) titleContainer.innerText = 'سجل فواتيري السابقة';
  } else if (loggedDelegate) {
    visibleInvoices = invoices.filter(inv => inv.customer && inv.customer.username.includes(loggedDelegate.username));
    if (titleContainer) titleContainer.innerText = 'سجل فواتير الزبائن الخاصة بي';
  } else if (isAdmin) {
    if (titleContainer) titleContainer.innerText = 'سجل جميع الفواتير';
  }

  if (visibleInvoices.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px; font-size:0.85rem;">لا توجد فواتير مسجلة.</p>';
    return;
  }

  visibleInvoices.forEach(inv => {
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px; display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;';
    div.innerHTML = `
      <div>
        <div style="font-weight:700; color:var(--primary-dark);">فاتورة: ${inv.id}</div>
        <div style="color:var(--text-muted); font-size:0.75rem;">الزبون: ${inv.customer.name} | التاريخ: ${inv.date}</div>
        <div style="font-weight:bold; margin-top:2px;">المجموع: ${formatPrice(inv.total)} د.ع</div>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn" style="padding:6px 10px; font-size:0.75rem;" onclick="viewSavedInvoice('${inv.id}')">عرض 👁️</button>
        ${isAdmin ? `<button class="btn btn-danger" style="padding:6px 10px; font-size:0.75rem;" onclick="deleteInvoice('${inv.id}')">حذف 🗑️</button>` : ''}
      </div>
    `;
    listContainer.appendChild(div);
  });
}

function viewSavedInvoice(invoiceId) {
  const inv = invoices.find(i => i.id === invoiceId);
  if (!inv) return;
  closeInvoicesModal();
  renderReceiptHTML(inv);
  document.getElementById('receipt-modal').classList.remove('hidden');
}

async function deleteInvoice(invoiceId) {
  if (confirm('تأكيد حذف هذه الفاتورة؟')) {
    invoices = invoices.filter(i => i.id !== invoiceId);
    try { await db.collection('invoices').doc(String(invoiceId)).delete(); } catch(err){}
    saveData();
    renderInvoicesList();
  }
}

function closeInvoicesModal() { document.getElementById('invoices-modal').classList.add('hidden'); }
