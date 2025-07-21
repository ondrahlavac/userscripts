// ==UserScript==
// @name         FX Converter to CZK
// @version      1.1
// @author       Ondra Hlavac (ondra@hlavac.cz)
// @description  Converts EUR, USD, GBP prices on page to CZK on hover using exchange rates, no older than 24 hours
// @namespace    https://ondra.hlavac.cz/
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @connect      api.exchangerate.host
// ==/UserScript==

(function() {
    'use strict';

    const currencies = ['EUR', 'USD', 'GBP'];
    const currencySymbols = {
        '€': 'EUR',
        '$': 'USD',
        '£': 'GBP'
    };

    const rates = {};

    async function fetchRatesCached() {
        const apiKey = await GM.getValue('apiKey', null);
        const apiCacheKey = 'fx_raw_cache';

        if (!apiKey) {
            console.error('FX Converter', 'No API key set in GM storage under "apiKey".');
            return;
        }

        let rawData = null;
        const cacheRaw = await GM.getValue(apiCacheKey, null);

        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                const age = Date.now() - new Date(cache.timestamp).getTime();
                if (age < 24 * 60 * 60 * 1000) {
                    rawData = cache.data
                }
            } catch (e) {
                console.info('FX Converter', 'FX cache stale, fetching new data.');
            }
        }

        // If not loaded in previous step, fetch new data from API
        if(!rawData) {
            const url = `https://api.exchangerate.host/live?access_key=${apiKey}`;

            try {
                const response = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        onload: r => resolve(r),
                        onerror: e => reject(e)
                    });
                });

                const data = JSON.parse(response.responseText);

                if (!data.success || !data.quotes) {
                    console.error('FX Converter', 'API error or malformed response:', data);
                    return;
                }

                rawData = data;

                // Cache the full raw response
                await GM.setValue(apiCacheKey, JSON.stringify({
                    timestamp: new Date().toISOString(),
                    data: rawData
                }));

            } catch (e) {
                console.error('FX Converter','Failed to fetch FX data', e);
                return;
            }
        }

        // Extract the conversion rates from rawData.quotes
        const q = rawData.quotes;

        if (!q.USDCZK || !q.USDEUR || !q.USDGBP) {
            console.error('FX Converter', 'Required currency quotes missing from response.', rawData);
            return;
        }

        const usdToCzk = q.USDCZK;
        const newRates = {
            'USD': usdToCzk,
            'EUR': usdToCzk / q.USDEUR,
            'GBP': usdToCzk / q.USDGBP
        };

        Object.assign(rates, newRates);

    }


    function formatCZK(value) {
        return value.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 2 });
    }

    function convertAndSetTooltip(el, currency, value) {
        const czk = value * rates[currency];
        el.setAttribute('title', `≈ ${formatCZK(czk)}`);
    }

    function scanAndTagPrices() {
        const regex = /\b(?<code1>EUR|USD|GBP)\s?(?<num1>-?\d{1,3}(?:[., ]?\d{3})*(?:[.,]\d+)?)|(?<num2>-?\d{1,3}(?:[., ]?\d{3})*(?:[.,]\d+)?)\s?(?<code2>EUR|USD|GBP)|(?<sym>[$€£])\s?(?<num3>-?\d{1,3}(?:[., ]?\d{3})*(?:[.,]\d+)?)/gi;

        const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        while (treeWalker.nextNode()) {
            const node = treeWalker.currentNode;
            if (!regex.test(node.nodeValue)) continue;

            regex.lastIndex = 0;
            const parent = node.parentNode;
            const frag = document.createDocumentFragment();
            let lastIndex = 0;

            for (const match of node.nodeValue.matchAll(regex)) {
                const before = node.nodeValue.slice(lastIndex, match.index);
                if (before) frag.appendChild(document.createTextNode(before));

                let currency, number;
                if (match.groups.sym) {
                    currency = currencySymbols[match.groups.sym];
                    number = match.groups.num3;
                } else if (match.groups.code1 && match.groups.num1) {
                    currency = match.groups.code1;
                    number = match.groups.num1;
                } else if (match.groups.code2 && match.groups.num2) {
                    currency = match.groups.code2;
                    number = match.groups.num2;
                }

            const val = parseFloat(number.replace(/,/g, '').replace(/ /g, '').replace(/([^\d.])/g, ''));

            const span = document.createElement('span');
            span.textContent = match[0];
            span.style.borderBottom = '1px dotted gray';
            span.style.cursor = 'help';
            convertAndSetTooltip(span, currency, val);
            frag.appendChild(span);

            lastIndex = match.index + match[0].length;
        }

        const after = node.nodeValue.slice(lastIndex);
        if (after) frag.appendChild(document.createTextNode(after));

        parent.replaceChild(frag, node);
    }
}

    fetchRatesCached()
      .then(scanAndTagPrices)
      .catch(err => console.error('FX Converter', 'Failed to initialize FX rates:', err));

})();
