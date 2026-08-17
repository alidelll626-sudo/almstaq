// --- تهيئة Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyC60355aPCR1Ji6MRlyOXuYCEbjYTjZ9n0",
  authDomain: "al-mustaqbal-stor.firebaseapp.com",
  projectId: "al-mustaqbal-stor",
  storageBucket: "al-mustaqbal-stor.firebasestorage.app",
  messagingSenderId: "96965787019",
  appId: "1:96965787019:web:4531931ae87c4b317e438e",
  measurementId: "G-0JTB3KDKV4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- متغيرات الحالة (State) ---
let categories = [];
let products = [];
let customers = [];
let cart = [];
let activeCategory = 'all';

// --- المزامنة اللحظية (لحل مشكلة التكرار وعودة البيانات) ---
function initApp() {
    // مراقبة الأقسام
    db.collection('categories').onSnapshot(snapshot => {
        categories = snapshot.docs.map(doc => doc.data());
        if (categories.length === 0) categories = [{ id: 'all', name: 'جميع المنتجات' }];
        renderTabs();
        populateCategorySelect();
    });

    // مراقبة المنتجات
    db.collection('products').onSnapshot(snapshot => {
        products = snapshot.docs.map(doc => doc.data());
        renderProducts();
    });

    // مراقبة الزبائن
    db.collection('customers').onSnapshot(snapshot => {
        customers = snapshot.docs.map(doc => doc.data());
        renderAdminCustomersList();
    });
}

// --- دوال الحذف المحدثة (تعمل مباشرة على السحابة) ---
async function deleteProduct(id) {
    if (confirm('تأكيد حذف المنتج؟')) {
        await db.collection('products').doc(String(id)).delete();
    }
}

async function deleteCustomer(username) {
    if (confirm('تأكيد حذف الزبون؟')) {
        await db.collection('customers').doc(String(username)).delete();
    }
}

async function deleteTab(catId) {
    if (confirm('تأكيد حذف القسم وجميع منتجاته؟')) {
        await db.collection('categories').doc(String(catId)).delete();
        // حذف منتجات القسم
        const snapshot = await db.collection('products').where('category', '==', catId).get();
        snapshot.docs.forEach(doc => doc.ref.delete());
    }
}

// --- دوال الإضافة والتعديل ---
async function handleCustomerMgmtSubmit(e) {
    e.preventDefault();
    const data = {
        username: document.getElementById('new-cust-username').value.trim(),
        password: document.getElementById('new-cust-password').value.trim(),
        fullname: document.getElementById('new-cust-fullname').value.trim(),
        discount: parseFloat(document.getElementById('new-cust-discount').value) || 0
    };
    await db.collection('customers').doc(data.username).set(data);
    alert('تم حفظ الزبون');
    resetCustomerMgmtForm();
}

// --- استدعاء التطبيق عند التحميل ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    // هنا يتم وضع دوال العرض (render) الأصلية الخاصة بك
    // ...
});

// ملاحظة: تأكد أن الدوال renderProducts و renderTabs و renderAdminCustomersList
// موجودة في ملفك، وهي ستعمل الآن تلقائياً عند أي تغيير في قاعدة البيانات.