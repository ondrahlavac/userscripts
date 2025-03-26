// ==UserScript==
// @name        Vedos - domain search renewal price lookup
// @version     1.0.0
// @author      Ondra Hlavac <ondra@hlavac.cz>
// @description Finds the renewal price and adds it to the domain search results on vedos.cz
// @namespace   https://ondra.hlavac.cz/
// @match       *://vedos.cz/domeny/cenik*
// @grant       none
// @license     MIT
// @run-at      document-end
// @homepageURL https://github.com/ondrahlavac/userscripts
// @updateURL   https://raw.githubusercontent.com/ondrahlavac/userscripts/refs/heads/master/vedos-domain-search-renewal-price.user.js
// @downloadURL https://raw.githubusercontent.com/ondrahlavac/userscripts/refs/heads/master/vedos-domain-search-renewal-price.user.js
// @supportURL  https://github.com/ondrahlavac/userscripts/issues
// ==/UserScript==

(function() {
    'use strict';

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};
const processResults = debounce(() => {
    const results = document.querySelectorAll('div.results-item-wrapper.check-ok:not(.renewal-updated):not(.renewal-inprogress):not(.renewal-failed)');

    results.forEach(result => {
        result.classList.add('renewal-inprogress');

        const idParts = result.id.split('_');
        const tld = '.' + idParts[idParts.length - 1];
        console.info(`Working on ${tld}`);


        const domainWrapper = result.querySelector('.results-item-domain-wrapper');
        if (!domainWrapper) {
          console.warn(`Hmm, that's weird. No domain wrapper for ${tld}`);
          result.classList.add('renewal-failed');
          result.classList.remove('renewal-inprogress');
          return;
        }

        const originalPriceWrapper = result.querySelector('.results-item-domain-price-wrapper.check-ok.wdac-price-reverse');
        if (!originalPriceWrapper) {
          console.warn(`No price wrapper for ${tld}`);
          result.classList.add('renewal-failed');
          result.classList.remove('renewal-inprogress');
          return;
        }

        // creating our own Renewal Price Wrapper to show to the user
        const renewalPriceWrapper = originalPriceWrapper.cloneNode(true);
        renewalPriceWrapper.classList.add('renewal-price');
        Object.assign(renewalPriceWrapper.style, {
          background: 'rgb(250, 200, 37)',
          padding: '0px 25px',
          'min-width': '10rem'
        });
        domainWrapper.appendChild(renewalPriceWrapper);
        
        // make the original price less visible
        Object.assign(originalPriceWrapper.style, {
          opacity: .5,
        });

        const noVatElem = renewalPriceWrapper.querySelector('.results-item-price-no-vat-wrapper');
        const vatElem = renewalPriceWrapper.querySelector('.results-item-price-vat-wrapper');

        const priceRow = Array.from(document.querySelectorAll('table tbody tr')).find(tr => {
            const tldCell = tr.querySelector('td b');
            return tldCell && tldCell.textContent.trim() === tld;
        });

        if (priceRow) {
            const priceCells = priceRow.querySelectorAll('td')[2];
            const noVatPriceMatch = priceCells.innerHTML.match(/<b>([\d.,]+) Kč\/rok<\/b>/);
            const vatPriceMatch = priceCells.querySelector('.pvat').textContent.match(/([\d.,]+) Kč\/rok/);

            // console.log(`Prices`, noVatPriceMatch, vatPriceMatch);
            if (noVatPriceMatch && vatPriceMatch) {
                noVatElem.textContent = noVatPriceMatch[1] + ' Kč/rok';
                vatElem.textContent = vatPriceMatch[1] + ' Kč/rok s DPH';
            }
        }

        result.classList.add('renewal-updated');
        result.classList.remove('renewal-inprogress');
    });
}, 500); // wait 500ms after last mutation before processing

const observer = new MutationObserver(processResults);
observer.observe(document.getElementById('wdac_results_wrapper'), { childList: true, subtree: true });

})();
