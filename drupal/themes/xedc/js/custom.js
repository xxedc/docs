document.addEventListener('DOMContentLoaded', function () {
  const searchBtn = document.querySelector('.search-icon-btn');
  const searchWrapper = document.querySelector('.search-input-wrapper');

  if (!searchBtn || !searchWrapper) return;

  // 点击图标显示搜索框
  searchBtn.addEventListener('click', function (e) {
    e.stopImmediatePropagation();
    const isVisible = searchWrapper.style.display === 'block';
    searchWrapper.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      setTimeout(() => {
        const input = searchWrapper.querySelector('.search-input');
        if (input) input.focus();
      }, 50);
    }
  });

  // 点击其他区域自动隐藏（仅当搜索框为空时）
  document.addEventListener('click', function (e) {
    if (!searchWrapper.contains(e.target) && !searchBtn.contains(e.target)) {
      const input = searchWrapper.querySelector('.search-input');
      if (input && input.value.trim() === '') {
        searchWrapper.style.display = 'none';
      }
    }
  });

  // 按 ESC 键隐藏
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      searchWrapper.style.display = 'none';
    }
  });
});