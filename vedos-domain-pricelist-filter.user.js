// ==UserScript==
// @name        Vedos - domain price filter
// @version     1.2.0
// @author      Ondra Hlavac <ondra@hlavac.cz>
// @description Adds a max price filter to the domain price list on vedos.cz
// @namespace   https://ondra.hlavac.cz/
// @match       *://vedos.cz/domeny/cenik*
// @grant       GM.setValue
// @grant       GM.getValue
// @license     MIT
// @run-at      document-end
// @homepageURL https://github.com/ondrahlavac/userscripts
// @updateURL   https://raw.githubusercontent.com/ondrahlavac/userscripts/refs/heads/master/vedos-domain-pricelist-filter.user.js
// @downloadURL https://raw.githubusercontent.com/ondrahlavac/userscripts/refs/heads/master/vedos-domain-pricelist-filter.user.js
// @supportURL  https://github.com/ondrahlavac/userscripts/issues
// ==/UserScript==

(async function() {
    'use strict';

    // Debounce function
    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };

    // Fetch all domain rows and prices
    const rows = Array.from(document.querySelectorAll('table tbody tr'));

    const domainPrices = rows.map(row => {
        const priceCell = row.querySelectorAll('td')[2].querySelector('span.pvat');
        const priceMatch = priceCell ? priceCell.textContent.match(/([\d.,]+)\s*Kč\/rok/) : null;
        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.').replace(/\s/g, '')) : Infinity;
        return {row, price};
    });

    // Find max price to set initial filter value
    const maxPrice = Math.ceil(Math.max(...domainPrices.map(d => d.price)));

    // Retrieve saved max value or default to maxPrice
    const savedMaxPrice = await GM.getValue('maxPrice', maxPrice);

    // Create floating filter UI
    const filterDiv = document.createElement('div');
    Object.assign(filterDiv.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#ffffff',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        zIndex: '9999',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });

    filterDiv.innerHTML = `
        <label style="font-weight:bold">Max price (with VAT): </label>
        <input type="number" id="maxPriceInput" value="${savedMaxPrice}" style="width: 100px; padding: 5px; font-size: 14px;" />
        <span>Kč/rok</span>
    `;

    document.body.appendChild(filterDiv);
    
    const maxPriceInput = document.getElementById('maxPriceInput');
 
    // Filtering logic
    function filterRows() {
        const threshold = parseFloat(maxPriceInput.value);
        // save the new value to GM
        GM.setValue('maxPrice', threshold);
        // hide rows with higher prices
        domainPrices.forEach(({row, price}) => {
            row.style.display = price <= threshold ? '' : 'none';
          row.setAttribute('data-debug', `${price} - ${threshold}`);
        });
    }

    // Initial filter
    filterRows();

    // Add event listener with debounce
    maxPriceInput.addEventListener('input', debounce(filterRows, 300));
})();
