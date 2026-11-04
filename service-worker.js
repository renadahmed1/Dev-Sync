const CACHE_NAME = 'devsync-cache-v2';

// القائمة الكاملة للملفات المطلوبة لعمل التطبيق بكامل صفحاته أوفلاين
const urlsToCache = [
  '/',
  'index.html',
  '/DEV-Sync.css',
  '/register.css',
  '/dashboard.css',
  '/DEV-Sync.js',
  '/dashboard.js',
  '/dashboard.html',
  '/manifest.json',
  '/img/img1.png'
];

// Install Event - حفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching assets');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate Event - حذف الكاش القديم عند التحديث
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - جلب الملفات من الكاش أو الشبكة
self.addEventListener('fetch', (event) => {
  // عدم تخزين أو اعتراض طلبات Firebase Authentication و Firestore لتجنب مشاكل تسجيل الدخول
  if (event.request.url.includes('identitytoolkit.googleapis.com') || 
      event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('securetoken.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // إرجاع الملف من الكاش إذا وجد، أو طلبه من الشبكة
      return response || fetch(event.request);
    })
  );
}); 