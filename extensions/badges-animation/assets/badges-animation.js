/**
 * Badge Overlay Script
 * Automatically overlays badges on product images using CSS/HTML
 * No image processing required - pure UI overlay
 */

(function() {
  'use strict';

  const settings = window.badgesAnimationSettings || window.badgeOverlaySettings || {
    position: 'top-right',
    size: 15,
    padding: 2,
    shopDomain: null,
    apiUrl: null,
    badgeImages: null
  };

  // Construct badge image URLs based on this script's location
  // Since the JS file loads from: .../assets/badges-animation.js
  // Badge images should be at: .../assets/badge-*.png
  function initBadgeImages() {
    if (settings.badgeImages) {
      return; // Already initialized
    }
    
    // Try to find the script tag - wait for DOM if needed
    const findScriptTag = () => {
      const scriptTag = document.querySelector('script[src*="badges-animation.js"]');
      if (scriptTag && scriptTag.src) {
        const scriptSrc = scriptTag.src;
        const baseAssetUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);
        settings.badgeImages = {
          best: baseAssetUrl + 'badge-best.png',
          eco: baseAssetUrl + 'badge-eco.png',
          exclusive: baseAssetUrl + 'badge-exclusive.png',
          handmade: baseAssetUrl + 'badge-handmade.png',
          limited: baseAssetUrl + 'badge-limited.png',
          new: baseAssetUrl + 'badge-new.png',
          preorder: baseAssetUrl + 'badge-preorder.png',
          sale: baseAssetUrl + 'badge-Sale.png',
          top: baseAssetUrl + 'badge-top.png'
        };
        return true;
      }
      return false;
    };
    
    // Try immediately
    if (!findScriptTag()) {
      // If not found, wait for DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', findScriptTag);
      } else {
        // DOM ready, try again after a short delay
        setTimeout(findScriptTag, 100);
      }
    }
  }
  
  // Initialize badge images
  initBadgeImages();

  // Cache for badge settings
  let badgeSettingsCache = null;
  let badgeSettingsCacheTime = null;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch badge settings from API
   */
  async function fetchBadgeSettings() {
    // TEST MODE: Return dummy settings for testing
    // TODO: Uncomment the actual API call below when App Proxy is configured
    const badgeSettings = {
      badge: 'new', // Try: 'best', 'eco', 'exclusive', 'handmade', 'limited', 'new', 'preorder', 'sale', 'top'
      position: 'top-right',
      padding: 2,
      size: 25,
      productBadges: {
        // Example product-specific badges (using product handles or IDs)
        // 'product-handle-1': 'new',
        // 'product-handle-2': 'limited'
      },
      imageBadges: {
        // Example image-specific badges
        // 'gid://shopify/ProductImage/123': 'exclusive'
      }
    };

    badgeSettingsCache = badgeSettings;
    badgeSettingsCacheTime = Date.now();

    return badgeSettings;

    /* ACTUAL API CALL - COMMENTED FOR TESTING
    const now = Date.now();
    
    // Return cached settings if still valid
    if (badgeSettingsCache && badgeSettingsCacheTime && (now - badgeSettingsCacheTime) < CACHE_DURATION) {
      return badgeSettingsCache;
    }

    try {
      // Get badge settings from the app's public API
      // Uses App Proxy URL: /apps/badges/settings
      // This will be proxied to the app's backend if App Proxy is configured
      const shopDomain = settings.shopDomain || window.Shopify?.shop || '';
      let apiUrl = '/apps/badges/settings';
      
      // Add shop parameter if available (helps with shop detection)
      if (shopDomain) {
        apiUrl += `?shop=${encodeURIComponent(shopDomain)}`;
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        badgeSettingsCache = data;
        badgeSettingsCacheTime = now;
        return data;
      }
    } catch (error) {
      console.warn('Badge Overlay: Failed to fetch badge settings:', error);
    }

    return { badge: 'none', productBadges: {}, imageBadges: {} };
    */
  }

  /**
   * Extract product ID from various sources
   */
  function extractProductId(element) {
    // Try data attributes first
    const productElement = element.closest('[data-product-id]');
    if (productElement) {
      return productElement.getAttribute('data-product-id');
    }

    // Try to find product link
    const productLink = element.closest('a[href*="/products/"]');
    if (productLink) {
      const href = productLink.getAttribute('href');
      const match = href.match(/\/products\/([^\/\?]+)/);
      if (match) {
        return match[1];
      }
    }

    // Try Shopify product handle in data attributes
    const handleElement = element.closest('[data-product-handle]');
    if (handleElement) {
      return handleElement.getAttribute('data-product-handle');
    }

    return null;
  }

  /**
   * Get badge for a specific product/image
   * @param {Object} badgeSettings - Optional badge settings object. If not provided, will fetch.
   */
  async function getBadgeForElement(element, badgeSettings = null) {
    if (!badgeSettings) {
      badgeSettings = await fetchBadgeSettings();
    }
    
    const productId = extractProductId(element);
    
    // Check for product-specific badge
    if (productId && badgeSettings.productBadges && badgeSettings.productBadges[productId]) {
      return badgeSettings.productBadges[productId];
    }

    // Return default badge
    return badgeSettings.badge || 'none';
  }

  /**
   * Get badge image URL
   * Uses badge images from the extension's assets folder (root level, no subdirectories)
   */
  function getBadgeImageUrl(badgeName) {
    if (!badgeName || badgeName === 'none') {
      return null;
    }
    
    // Ensure badge images are initialized
    if (!settings.badgeImages) {
      initBadgeImages();
    }
    
    // First, try to use badge images from settings
    if (settings.badgeImages && settings.badgeImages[badgeName]) {
      return settings.badgeImages[badgeName];
    }
    
    // Fallback: try to construct URL if badgeImages not yet ready
    const scriptTag = document.querySelector('script[src*="badges-animation.js"]');
    if (scriptTag && scriptTag.src) {
      const scriptSrc = scriptTag.src;
      const baseAssetUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);
      const badgeFileName = badgeName === 'sale' ? 'badge-Sale.png' : `badge-${badgeName}.png`;
      return baseAssetUrl + badgeFileName;
    }
    
    console.warn(`Badge Overlay: Badge image URL not found for: ${badgeName}`);
    return null;
  }

  /**
   * Create badge overlay element
   * @param {string} badgeName - Name of the badge to display
   * @param {Object} badgeSettings - Optional badge settings object. If not provided, uses cached or default settings.
   */
  function createBadgeOverlay(badgeName, badgeSettings = null) {
    const badgeUrl = getBadgeImageUrl(badgeName);
    if (!badgeUrl) return null;

    // Get badge settings (use provided, cached, or default)
    if (!badgeSettings && badgeSettingsCache) {
      badgeSettings = badgeSettingsCache;
    }

    // Get current settings (they might have been updated)
    const currentSettings = window.badgesAnimationSettings || window.badgeOverlaySettings || settings;
    const position = (badgeSettings?.position) ?? currentSettings.position ?? 'top-right';
    const positionX = position.includes('left') ? 'left' : 'right';
    const positionY = position.includes('top') ? 'start' : 'end';
    const padding = (badgeSettings?.padding) || currentSettings.padding || 2;
    const size = (badgeSettings?.size) || currentSettings.size || 15;

    const overlay = document.createElement('div');
    overlay.className = 'badge-overlay-container';
    overlay.setAttribute('data-badge', badgeName);
    overlay.setAttribute('data-position', position);
    
    // Apply current CSS custom properties to the new badge
    overlay.style.setProperty('--badge-padding', `${padding}%`);
    overlay.style.setProperty('--badge-size', `${size}%`);
    overlay.style.setProperty('--badge-position-x', `${positionX}`);
    overlay.style.setProperty('--badge-position-y', `${positionY}`);

    const img = document.createElement('img');
    img.src = badgeUrl;
    img.alt = badgeName;
    img.className = 'badge-overlay-image';
    img.loading = 'lazy';
    
    // Fallback if image fails to load
    img.onerror = function() {
      console.warn(`Badge Overlay: Failed to load badge image: ${badgeUrl}`);
      overlay.style.display = 'none';
    };

    overlay.appendChild(img);
    return overlay;
  }

  /**
   * Apply badge to an image element
   */
  async function applyBadgeToImage(imgElement) {
    // Skip if already processed
    if (imgElement.dataset.badgeProcessed === 'true') {
      return;
    }

    // Skip badge images themselves (prevent infinite loop)
    if (imgElement.classList.contains('badge-overlay-image') || 
        imgElement.closest('.badge-overlay-container')) {
      return;
    }

    // Skip if not a product image (heuristic check)
    const src = imgElement.src || imgElement.getAttribute('src') || '';
    if (!src) {
      return;
    }

    // Skip badge images by URL pattern
    if (src.includes('badge-') || src.includes('/badges/')) {
      return;
    }

    // Skip if not a product image URL
    if (!src.includes('product') && !(src.includes('cdn.shopify.com') || src.includes('shopify.com/cdn/'))) {
      return;
    }

    // Skip very small images (likely icons)
    if (imgElement.naturalWidth && imgElement.naturalWidth < 100) {
      return;
    }
    if (imgElement.width && imgElement.width < 100) {
      return;
    }

    // Find or create container
    let container = imgElement.parentElement;
    const needsWrapper = !container || !container.classList.contains('badge-image-wrapper');
    
    if (needsWrapper) {
      // Create wrapper if needed
      const wrapper = document.createElement('div');
      wrapper.className = 'badge-image-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      
      // Preserve original display style
      const originalDisplay = window.getComputedStyle(imgElement).display;
      if (originalDisplay !== 'none') {
        wrapper.style.display = originalDisplay === 'block' ? 'block' : 'inline-block';
      }
      
      imgElement.parentNode.insertBefore(wrapper, imgElement);
      wrapper.appendChild(imgElement);
      container = wrapper;
    }

    // Get badge for this product/image
    const badgeName = await getBadgeForElement(imgElement);
    console.log('applyBadgeToImage: Badge name:', badgeName);
    
    if (badgeName && badgeName !== 'none') {
      // Remove existing badge if any
      const existingBadge = container.querySelector('.badge-overlay-container');
      if (existingBadge) {
        existingBadge.remove();
      }

      // Create and add badge overlay
      const badgeOverlay = createBadgeOverlay(badgeName);
      console.log('applyBadgeToImage: Badge overlay created:', badgeOverlay);
      if (badgeOverlay) {
        container.appendChild(badgeOverlay);
      }
    }

    imgElement.dataset.badgeProcessed = 'true';
  }

  /**
   * Process all product images on the page (legacy - multiple strategies)
   */
  async function processProductImagesLegacy() {
    // Find all potential product images using multiple strategies
    const productImages = new Set();
    
    // Strategy 1: Direct selectors for common product image patterns
    const directSelectors = [
      'img[src*="product"]:not(.badge-overlay-image)',
      '.product-card img:not(.badge-overlay-image)',
      '.product-item img:not(.badge-overlay-image)',
      '[data-product-id] img:not(.badge-overlay-image)',
      '.product-image img:not(.badge-overlay-image)',
      '.product__media img:not(.badge-overlay-image)',
      '.product__photo img:not(.badge-overlay-image)',
      // Shopify theme-specific selectors (based on your structure)
      '.card_media img:not(.badge-overlay-image)',
      '.media img:not(.badge-overlay-image)',
      '.card_inner img:not(.badge-overlay-image)',
      '[class*="card"] img:not(.badge-overlay-image)'
    ];
    
    directSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(img => {
          if (isValidProductImage(img)) {
            productImages.add(img);
          }
        });
      } catch (e) {
        // Some selectors might fail, continue
        console.warn('Badge Overlay: Selector error:', e);
      }
    });
    
    // Strategy 2: Find images associated with product links
    // Images are often in containers like .card_media, .media near product links
    try {
      const allLinks = document.querySelectorAll('a[href]');
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const resolvedHref = link.href || '';
        
        // Check if it's a product link
        const isProductLink = href.includes('/products/') || 
                            href.includes('products/') ||
                            resolvedHref.includes('/products/') ||
                            href.match(/\/products\/[^\/\s"']+/);
        
        if (isProductLink) {
          // Strategy 2a: Images inside the link (direct children or descendants)
          link.querySelectorAll('img').forEach(img => {
            if (isValidProductImage(img)) {
              productImages.add(img);
            }
          });
          
          // Strategy 2b: Find the product card/container that contains this link
          // Look for common product container classes
          let productContainer = link.closest(
            '.product, .product-card, .product-item, [class*="product"], ' +
            '[data-product], .card, .card_inner, [class*="card"]'
          );
          
          if (productContainer) {
            // Find images in product-related containers within the card
            // Based on your structure: .card_inner > .card_media > .media > img
            const imageContainers = productContainer.querySelectorAll(
              '.card_media, .media, .product__media, .product-image, [class*="media"], [class*="image"]'
            );
            
            imageContainers.forEach(container => {
              container.querySelectorAll('img').forEach(img => {
                const isValid = isValidProductImage(img);
                if (isValid) {
                  productImages.add(img);
                } else {
                }
              });
            });
            
            // Also get all images in the product container (fallback)
            productContainer.querySelectorAll('img').forEach(img => {
              const isValid = isValidProductImage(img);
              if (isValid) {
                productImages.add(img);
              }
            });
          } else {
            // If no container found, check siblings and nearby elements
            const parent = link.parentElement;
            if (parent) {
              // Check for .card_media, .media containers as siblings
              const mediaContainers = parent.querySelectorAll('.card__media, .media, [class*="motion-reduce"]');
              mediaContainers.forEach(container => {
                container.querySelectorAll('img').forEach(img => {
                  if (isValidProductImage(img)) {
                    productImages.add(img);
                  }
                });
              });
            }
          }
        }
      });
    } catch (e) {
      console.warn('Badge Overlay: Product link selector error:', e);
    }
    
    // Strategy 3: Find images with product-related data attributes
    try {
      document.querySelectorAll('[data-product-handle] img, [data-product-id] img').forEach(img => {
        if (isValidProductImage(img)) {
          productImages.add(img);
        }
      });
    } catch (e) {
      console.warn('Badge Overlay: Data attribute selector error:', e);
    }
    
    // Strategy 4: Find images in product-related containers
    try {
      const productContainers = document.querySelectorAll(
        '.product, [class*="product"], [id*="product"], [data-product]'
      );
      productContainers.forEach(container => {
        container.querySelectorAll('img').forEach(img => {
          if (isValidProductImage(img)) {
            productImages.add(img);
          }
        });
      });
    } catch (e) {
      console.warn('Badge Overlay: Container selector error:', e);
    }

    // Process each image
    for (const img of productImages) {
      await applyBadgeToImage(img);
    }
  }

  /**
   * Apply badge to a product__media container
   * Places the badge overlay as a sibling right after the container in the DOM structure
   * @param {HTMLElement} container - The container element
   * @param {Object} badgeSettings - Badge settings object (already fetched)
   */
  async function applyBadgeToContainer(container, badgeSettings) {
    // Skip if already processed
    if (container.dataset.badgeProcessed === 'true') {
      return;
    }

    // Skip if container already has a badge overlay as next sibling
    if (container.nextElementSibling?.classList.contains('badge-overlay-container')) {
      return;
    }

    // Find the main product image inside the container to validate it's a product image
    const images = container.querySelectorAll('img:not(.badge-overlay-image)');
    let hasValidImage = false;
    
    for (const img of images) {
      const src = img.src || img.getAttribute('src') || '';
      // Skip badge images by URL
      if (src.includes('badge-') || src.includes('/badges/')) {
        continue;
      }
      
      // Check if it's a product image URL
      if (src.includes('product') || src.includes('cdn.shopify.com') || src.includes('shopify.com/cdn/')) {
        // Check size
        if ((img.naturalWidth && img.naturalWidth >= 100) || (img.width && img.width >= 100)) {
          hasValidImage = true;
          break;
        }
      }
    }
    
    if (!hasValidImage) {
      return;
    }

    // Get badge for this product (using pre-fetched settings)
    const badgeName = await getBadgeForElement(container, badgeSettings);
    console.log('applyBadgeToContainer: Badge name:', badgeName);
    
    if (badgeName && badgeName !== 'none') {
      // Remove existing badge if any (sibling)
      const existingBadge = container.nextElementSibling?.classList.contains('badge-overlay-container') 
        ? container.nextElementSibling 
        : null;
      if (existingBadge) {
        existingBadge.remove();
      }

      // Create badge overlay (passing pre-fetched badge settings)
      const badgeOverlay = createBadgeOverlay(badgeName, badgeSettings);
      console.log('applyBadgeToContainer: Badge overlay created:', badgeOverlay);
      
      if (badgeOverlay) {
        // Make the container position: relative if it isn't already (for absolute positioning)
        const containerStyle = window.getComputedStyle(container);
        if (containerStyle.position === 'static') {
          container.style.position = 'relative';
        }
        
        // Make sure the parent is position: relative for absolute positioning
        const parent = container.parentNode;
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.position === 'static') {
          parent.style.position = 'relative';
        }
        
        // Insert badge overlay as a sibling right after the container
        if (container.nextSibling) {
          parent.insertBefore(badgeOverlay, container.nextSibling);
        } else {
          parent.appendChild(badgeOverlay);
        }
      }
    }

    container.dataset.badgeProcessed = 'true';
  }

  /**
   * Process all product images on the page
   * New simplified approach: target product__media and card__media containers and apply badges to them
   */
  async function processProductImages() {
    // Fetch badge settings FIRST before doing any processing
    console.log('processProductImages: Fetching badge settings...');
    const badgeSettings = await fetchBadgeSettings();
    console.log('processProductImages: Badge settings loaded:', badgeSettings);
    
    const productMediaContainers = [];
    
    try {
      // Find all elements with exact class "product__media" or "card__media" (not with postfixes)
      const productContainers = document.querySelectorAll('.product__media');
      const cardContainers = document.querySelectorAll('.card__media');
      const allContainers = [...productContainers, ...cardContainers];
      
      allContainers.forEach(container => {
        const classList = Array.from(container.classList);
        
        // Skip if class has a postfix like "product__media-item" or "card__media-item"
        const hasProductPostfix = classList.some(cls => cls.startsWith('product__media-'));
        const hasCardPostfix = classList.some(cls => cls.startsWith('card__media-'));
        if (hasProductPostfix || hasCardPostfix) {
          return;
        }
        
        // Skip if already processed
        if (container.dataset.badgeProcessed === 'true') {
          return;
        }
        
        // Skip if container already has a badge overlay
        if (container.querySelector('.badge-overlay-container') || 
            container.nextElementSibling?.classList.contains('badge-overlay-container')) {
          return;
        }
        
        // Valid container - add to list
        productMediaContainers.push(container);
      });
    } catch (e) {
      console.warn('processProductImages: Error:', e);
    }
    
    // Process each container (passing pre-fetched badge settings)
    for (const container of productMediaContainers) {
      await applyBadgeToContainer(container, badgeSettings);
    }
  }
  
  /**
   * Check if an image is a valid product image (not a badge image)
   */
  function isValidProductImage(img) {
    // Skip if already processed
    if (img.dataset.badgeProcessed === 'true') {
      return false;
    }
    
    // Skip badge images themselves
    if (img.classList.contains('badge-overlay-image') ||
        img.closest('.badge-overlay-container')) {
      return false;
    }
    
    // Skip badge images by URL
    const src = img.src || img.getAttribute('src') || '';
    if (src.includes('badge-') || src.includes('/badges/')) {
      return false;
    }
    
    // Skip very small images (likely icons)
    if (img.naturalWidth && img.naturalWidth < 100) {
      return false;
    }
    if (img.width && img.width < 100) {
      return false;
    }
    
    return true;
  }

  /**
   * Observe DOM changes for dynamically loaded content
   */
  function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              // Skip if it's a badge overlay element (prevent loop)
              if (node.classList && (
                  node.classList.contains('badge-overlay-container') ||
                  node.classList.contains('badge-overlay-image') ||
                  node.classList.contains('badge-image-wrapper')
                )) {
                return;
              }
              
              // Check for product images
              if (node.tagName === 'IMG') {
                const src = node.src || node.getAttribute('src') || '';
                // Only process if it's not a badge image
                if (src && !src.includes('badge-') && !src.includes('/badges/')) {
                  shouldProcess = true;
                }
              } else if (node.querySelector && node.querySelector('img')) {
                // Check if any img inside is not a badge image
                const imgs = node.querySelectorAll('img');
                for (const img of imgs) {
                  const src = img.src || img.getAttribute('src') || '';
                  if (src && !src.includes('badge-') && !src.includes('/badges/') &&
                      !img.classList.contains('badge-overlay-image')) {
                    shouldProcess = true;
                    break;
                  }
                }
              }
            }
          });
        }
      });

      if (shouldProcess) {
        // Debounce processing
        clearTimeout(window.badgeOverlayTimeout);
        window.badgeOverlayTimeout = setTimeout(() => {
          processProductImages();
        }, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Initialize CSS styles with CSS custom properties (variables)
   * This allows us to update settings by changing CSS variables - browser applies automatically
   */
  function initStyles() {
    if (document.getElementById('badge-overlay-styles')) {
      return; // Styles already initialized
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'badge-overlay-styles';
    styleElement.textContent = `
      .badge-image-wrapper {
        position: relative;
        display: inline-block;
      }
      
      .badge-overlay-container {
        display: flex;
        position: absolute;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        z-index: 10;
        pointer-events: none;
        line-height: 0;
        pointer-events: none;
        /* CSS custom properties - updated dynamically */
        --badge-padding: 2%;
        --badge-size: 15%;
      }
      
      .badge-overlay-container[data-position="top-right"] {
        justify-content: flex-end;
        align-items: flex-start;
      }

      .badge-overlay-container[data-position="top-left"] {
        justify-content: flex-start;
        align-items: flex-start;
      }

      .badge-overlay-container[data-position="bottom-right"] {
        justify-content: flex-end;
        align-items: flex-end;
      }

      .badge-overlay-container[data-position="bottom-left"] {
        justify-content: flex-start;
        align-items: flex-end;
      }

      .badge-overlay-image {
        display: block;
        margin: var(--badge-padding);
        max-width: var(--badge-size);
        max-height: var(--badge-size);
        width: auto !important;
        height: auto !important;
        object-fit: contain;
        flex: 0 0 auto;
      }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Update CSS custom properties based on current settings
   * This is efficient - we only update CSS variables, browser automatically applies to all badges
   */
  function updateStyles() {
    // Get current settings (they might have been updated)
    const currentSettings = window.badgesAnimationSettings || window.badgeOverlaySettings || settings;
    const position = currentSettings.position || 'top-right';
    const size = currentSettings.size || 15;
    const padding = currentSettings.padding || 2;
    
    // Update the settings object for use in other functions
    settings.position = position;
    settings.size = size;
    settings.padding = padding;

    // Update CSS custom properties on all badge containers
    // Browser automatically applies the changes - no need to regenerate CSS!
    document.querySelectorAll('.badge-overlay-container').forEach(overlay => {
      overlay.style.setProperty('--badge-padding', `${padding}%`);
      overlay.style.setProperty('--badge-size', `${size}%`);
      overlay.style.setProperty('--badge-position', `${position}`);
      
      // Update position attribute
      const currentPosition = overlay.getAttribute('data-position');
      if (currentPosition !== position) {
        overlay.setAttribute('data-position', position);
      }
    });
    
    // Also set on root for any new badges that will be created
    document.documentElement.style.setProperty('--badge-padding', `${padding}%`);
    document.documentElement.style.setProperty('--badge-size', `${size}%`);
    document.documentElement.style.setProperty('--badge-position', `${position}`);
  }

  /**
   * Initialize badge overlay
   */
  function init() {
    // Initialize CSS styles with CSS custom properties
    initStyles();
    
    // Update CSS variables with current settings
    updateStyles();
    
    // Watch for settings changes (when theme editor updates settings)
    if (window.Shopify && window.Shopify.designMode) {
      // In theme editor, listen for settings updates
      document.addEventListener('shopify:section:load', () => {
        setTimeout(() => {
          updateStyles();
          processProductImages();
        }, 100);
      });
    }

    // Process images when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        processProductImages();
        observeDOMChanges();
      });
    } else {
      processProductImages();
      observeDOMChanges();
    }

    // Also process on page navigation (for SPAs and AJAX navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(processProductImages, 100);
      }
    }).observe(document, { subtree: true, childList: true });

    // Process on popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      setTimeout(processProductImages, 100);
    });
  }

  // Make updateStyles available globally so Liquid can call it
  // window.updateBadgeStyles = updateStyles;

  // Initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
