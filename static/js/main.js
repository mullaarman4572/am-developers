/* ===================================================================
   AM DEVELOPERS - Interactive JavaScript & Cost Calculator Engine
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  initCostCalculator();
  initPortfolioFilter();
  initContactQuickSelect();
  initWhatsAppWidget();
});

/* ---------------------------------------------------------
   1. Interactive Website Cost Calculator
   --------------------------------------------------------- */
function initCostCalculator() {
  const calcContainer = document.getElementById('websiteCostCalculator');
  if (!calcContainer) return;

  const typeOptions = document.querySelectorAll('.calc-type-option');
  const pageSelect = document.getElementById('calcPages');
  const addonCheckboxes = document.querySelectorAll('.calc-addon-input');
  const totalPriceElem = document.getElementById('calcTotalPrice');
  const totalDaysElem = document.getElementById('calcTotalDays');
  const selectedSummaryElem = document.getElementById('calcSummaryText');
  const waQuoteBtn = document.getElementById('calcWhatsAppBtn');
  const formQuoteBtn = document.getElementById('calcFormBtn');

  // Default state
  let currentBasePrice = 2999;
  let currentTypeName = "Starter Business Website";
  let currentPagesCost = 0;
  let currentPagesText = "1-3 Pages";
  let baseDeliveryDays = 4;

  function calculateTotal() {
    let addonsTotal = 0;
    let selectedAddons = [];
    let extraDays = 0;

    addonCheckboxes.forEach(cb => {
      const parentLabel = cb.closest('.calc-addon-check');
      if (cb.checked) {
        const cost = parseInt(cb.dataset.price || '0', 10);
        const days = parseInt(cb.dataset.days || '0', 10);
        addonsTotal += cost;
        extraDays += days;
        selectedAddons.push(cb.dataset.name + (cost > 0 ? ` (+₹${cost.toLocaleString('en-IN')})` : ' (FREE)'));
        if (parentLabel) parentLabel.classList.add('active');
      } else {
        if (parentLabel) parentLabel.classList.remove('active');
      }
    });

    if (pageSelect) {
      const selectedOption = pageSelect.options[pageSelect.selectedIndex];
      currentPagesCost = parseInt(selectedOption.dataset.price || '0', 10);
      currentPagesText = selectedOption.text;
      extraDays += parseInt(selectedOption.dataset.days || '0', 10);
    }

    const finalTotal = currentBasePrice + currentPagesCost + addonsTotal;
    const finalDays = baseDeliveryDays + extraDays;

    // Animate price count
    animateValue(totalPriceElem, parseInt(totalPriceElem.dataset.current || currentBasePrice), finalTotal, 350);
    totalPriceElem.dataset.current = finalTotal;

    if (totalDaysElem) {
      totalDaysElem.innerText = `${finalDays} - ${finalDays + 2} Days`;
    }

    if (selectedSummaryElem) {
      selectedSummaryElem.innerHTML = `
        <strong>${currentTypeName}</strong> with <strong>${currentPagesText}</strong>
        ${selectedAddons.length > 0 ? '<br><span class="text-muted small">Add-ons: ' + selectedAddons.join(', ') + '</span>' : ''}
      `;
    }

    // Build WhatsApp Message URL
    const message = `Hello AM Developers! 👋%0A%0AI used your Website Cost Calculator and would like to get a quote:%0A%0A` +
      `🌐 *Project Type:* ${encodeURIComponent(currentTypeName)}%0A` +
      `📄 *Pages:* ${encodeURIComponent(currentPagesText)}%0A` +
      `⚡ *Add-ons:* ${encodeURIComponent(selectedAddons.length > 0 ? selectedAddons.join(', ') : 'Standard Stack')}%0A` +
      `💰 *Estimated Total:* ₹${finalTotal.toLocaleString('en-IN')}%0A` +
      `⏱ *Estimated Timeline:* ${finalDays}-${finalDays + 2} Days%0A%0A` +
      `Please let me know how we can get started!`;

    if (waQuoteBtn) {
      // Directs to 8971987220 by default
      waQuoteBtn.href = `https://wa.me/918971987220?text=${message}`;
    }

    if (formQuoteBtn) {
      formQuoteBtn.onclick = function (e) {
        e.preventDefault();
        // Pre-fill contact form if available on the page or scroll to contact
        const contactSection = document.getElementById('contactSection');
        const serviceInput = document.getElementById('serviceField');
        const budgetInput = document.getElementById('budgetField');
        const messageInput = document.getElementById('messageField');

        if (serviceInput) serviceInput.value = `${currentTypeName} (${currentPagesText})`;
        if (budgetInput) budgetInput.value = `₹${finalTotal.toLocaleString('en-IN')}`;
        if (messageInput) {
          messageInput.value = `Hi AM Developers, I calculated a quote for ${currentTypeName} with ${currentPagesText}. Add-ons: ${selectedAddons.join(', ')}. Estimated price: ₹${finalTotal}. Looking forward to discussing details.`;
        }

        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = `/contact?type=${encodeURIComponent(currentTypeName)}&budget=${finalTotal}`;
        }
      };
    }
  }

  // Handle Type card selection
  typeOptions.forEach(opt => {
    opt.addEventListener('click', function () {
      typeOptions.forEach(o => o.classList.remove('active'));
      this.classList.add('active');
      currentBasePrice = parseInt(this.dataset.price, 10);
      currentTypeName = this.dataset.name;
      baseDeliveryDays = parseInt(this.dataset.days || '4', 10);
      calculateTotal();
    });
  });

  // Handle Page select change
  if (pageSelect) {
    pageSelect.addEventListener('change', calculateTotal);
  }

  // Handle Add-ons change
  addonCheckboxes.forEach(cb => {
    cb.addEventListener('change', calculateTotal);
  });

  // Run initial calculation
  calculateTotal();
}

// Utility: Smooth number counter
function animateValue(obj, start, end, duration) {
  if (!obj) return;
  if (start === end) {
    obj.innerHTML = `₹${end.toLocaleString('en-IN')}`;
    return;
  }
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    obj.innerHTML = `₹${value.toLocaleString('en-IN')}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = `₹${end.toLocaleString('en-IN')}`;
    }
  };
  window.requestAnimationFrame(step);
}

/* ---------------------------------------------------------
   2. Portfolio Category Filtering
   --------------------------------------------------------- */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.portfolio-filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-grid-item');

  if (filterBtns.length === 0 || portfolioItems.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => b.classList.remove('active', 'btn-gradient'));
      filterBtns.forEach(b => b.classList.add('btn-outline-glow'));
      
      this.classList.remove('btn-outline-glow');
      this.classList.add('active', 'btn-gradient');

      const filterValue = this.dataset.filter;

      portfolioItems.forEach(item => {
        const itemCategory = item.dataset.category;
        if (filterValue === 'all' || itemCategory === filterValue) {
          item.style.display = 'block';
          item.style.animation = 'fadeIn 0.4s ease';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* ---------------------------------------------------------
   3. Quick Contact Number & Plan Pre-Selection
   --------------------------------------------------------- */
function initContactQuickSelect() {
  // Pre-fill query parameters if routed from pricing or portfolio
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan');
  const typeParam = urlParams.get('type');
  const budgetParam = urlParams.get('budget');

  const serviceField = document.getElementById('serviceField');
  const budgetField = document.getElementById('budgetField');

  if (planParam && serviceField) {
    serviceField.value = `${planParam} Package`;
  } else if (typeParam && serviceField) {
    serviceField.value = typeParam;
  }

  if (budgetParam && budgetField) {
    budgetField.value = `₹${budgetParam}`;
  }
}

/* ---------------------------------------------------------
   4. Floating WhatsApp Chat Modal & Fast Switcher
   --------------------------------------------------------- */
function initWhatsAppWidget() {
  const waModal = document.getElementById('whatsAppSelectorModal');
  if (!waModal) return;

  // Handles fast WhatsApp opening with fallback
  window.openDirectWhatsApp = function (phoneNum, message) {
    const text = encodeURIComponent(message || "Hello AM Developers! I'm interested in building a website for my business.");
    const url = `https://wa.me/91${phoneNum}?text=${text}`;
    window.open(url, '_blank');
  };
}
