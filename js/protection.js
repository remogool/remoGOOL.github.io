// منع النقر بزر الفأرة الأيمن
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// منع اختصارات النسخ واللصق والتحديد
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 'u')) {
    e.preventDefault();
  }
});

// منع السحب للتحديد
document.addEventListener('selectstart', function(e) {
  e.preventDefault();
});
