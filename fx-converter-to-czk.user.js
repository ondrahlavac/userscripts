// ==UserScript==
// @name         FX Converter to CZK
// @version      2.0.0
// @author       Ondra Hlavac <ondra@hlavac.cz>
// @description  Converts EUR, USD, GBP and DKK prices on page to CZK on hover using exchange rates, no older than 24 hours
// @namespace    https://ondra.hlavac.cz/
// @match        *://*/*
// @grant        GM.xmlhttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @connect      api.exchangerate.host
// @license      MIT
// @run-at       document-end
// @homepageURL  https://github.com/ondrahlavac/userscripts
// @updateURL    https://raw.githubusercontent.com/ondrahlavac/userscripts/refs/heads/master/fx-converter-to-czk.user.js
// @downloadURL  https://raw.githubusercontent.com/ondrahlavac/userscripts/refs/heads/master/fx-converter-to-czk.user.js
// @supportURL   https://github.com/ondrahlavac/userscripts/issues
// ==/UserScript==

(function() {
    'use strict';

    const currencies = ['EUR', 'USD', 'GBP', 'DKK'];
    const currencySymbols = {
        '€': 'EUR',
        '$': 'USD',
        '£': 'GBP',
        'kr': 'DKK'
    };

    const rates = {};
    const priceRegex = new RegExp(
        [
            '(?:(?<code1>EUR|USD|GBP|DKK)\\s*(?<num1>-?\\d{1,3}(?:[.,\\s]?\\d{3})*(?:[.,]\\d+)?))',
            '(?:(?<num2>-?\\d{1,3}(?:[.,\\s]?\\d{3})*(?:[.,]\\d+)?)\\s*(?<code2>EUR|USD|GBP|DKK))',
            '(?:(?<sym>[\\$€£kr])\\s*(?<num3>-?\\d{1,3}(?:[.,\\s]?\\d{3})*(?:[.,]\\d+)?))'
        ].join('|'),
        'gi'
    );

    async function promptForApiKey() {
        // Create a simple modal dialog
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.4)';
        overlay.style.zIndex = 99999;
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        const dialog = document.createElement('div');
        dialog.style.background = '#fff';
        dialog.style.padding = '24px 32px';
        dialog.style.borderRadius = '8px';
        dialog.style.boxShadow = '0 2px 16px rgba(0,0,0,0.3)';
        dialog.style.textAlign = 'center';

        dialog.innerHTML = `
            <h2>FX Converter API Key</h2>
            <p>Please enter your <b>exchangerate.host</b> API token:</p>
            <input type="text" id="fxApiKeyInput" style="width: 90%; padding: 8px; font-size: 16px;" />
            <br><br>
            <button id="fxApiKeySaveBtn" style="padding: 8px 24px; font-size: 16px;">Save</button>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        return new Promise(resolve => {
            document.getElementById('fxApiKeySaveBtn').onclick = async function() {
                const key = document.getElementById('fxApiKeyInput').value.trim();
                if (key) {
                    await GM.setValue('apiKey', key);
                    document.body.removeChild(overlay);
                    resolve(key);
                }
            };
        });
    }

    async function fetchRatesCached() {
        let apiKey = await GM.getValue('apiKey', null);
        const apiCacheKey = 'fx_raw_cache';

        if (!apiKey) {
            apiKey = await promptForApiKey();
            if (!apiKey) {
                console.error('FX Converter', 'No API key provided.');
                return;
            }
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
                    GM.xmlhttpRequest({
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

        if (!q.USDCZK || !q.USDEUR || !q.USDGBP || !q.USDDKK) {
            console.error('FX Converter', 'Required currency quotes missing from response.', rawData);
            return;
        }
        const usdToCzk = q.USDCZK;
        const newRates = {
            'USD': usdToCzk,
            'EUR': usdToCzk / q.USDEUR,
            'GBP': usdToCzk / q.USDGBP,
            'DKK': usdToCzk / q.USDDKK
        };
        Object.assign(rates, newRates);
    }

    function formatCZK(value) {
        return value.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 2 });
    }

    function createTooltip(tooltipText) {
        const tooltipElement = document.createElement('span');
        tooltipElement.textContent = tooltipText;
        tooltipElement.className = 'fx-czk-tooltip';
        Object.assign(tooltipElement.style, {
            position: 'fixed',
            zIndex: '9999',
            background: '#222',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            display: 'none' // Initially hidden
        });
        return tooltipElement;
    }

    function moveTooltip(tooltipElement, ev) {
        tooltipElement.style.left = (ev.clientX + 12) + 'px';
        tooltipElement.style.top = (ev.clientY - 36) + 'px';
    }

    function scanAndTagPrices() {
        // using a TreeWalker to find only the text nodes that match our regex
        const treeWalker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // don't traverse into script and style tags
                    if (node.parentNode.nodeName === 'SCRIPT' || node.parentNode.nodeName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // regex is stateful because of the /g flag, so we must reset it.
                    priceRegex.lastIndex = 0;
                    if (priceRegex.test(node.nodeValue)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            }
        );

        // collect all nodes to process in an array beforehand, to avoid issues with live NodeList
        const nodesToProcess = [];
        while (treeWalker.nextNode()) {
            nodesToProcess.push(treeWalker.currentNode);
        }
        
        // now we're done with the TreeWalker -> we can process the nodes
        for (const node of nodesToProcess) {
            priceRegex.lastIndex = 0;
            let parent = node.parentNode;

                // if parent of the text node is our span.fx-converted-to-czk from previous run,
                // we need to get rid of it
                // TODO: however, if the value did not change, maybe we can just skip it and not touch it
                if (parent && parent.classList && parent.classList.contains('fx-converted-to-czk')) {
                    const grandParent = parent.parentNode;
                    if (grandParent) {
                        grandParent.replaceChild(node, parent);
                        parent = grandParent;
                    }
                }

            const frag = document.createDocumentFragment();
            let lastIndex = 0;

            for (const match of node.nodeValue.matchAll(priceRegex)) {
                const before = node.nodeValue.slice(lastIndex, match.index);
                if (before) frag.appendChild(document.createTextNode(before));

                // This is where we determine the currency and number
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

                const val = normalizePriceNumber(number);
                const czkValue = val * rates[currency];
                
                // Create a minimal wrapper (span)
                const priceNode = document.createElement('span');
                priceNode.textContent = match[0];
                priceNode.classList.add('fx-converted-to-czk');
                priceNode.dataset.czkValue = czkValue.toFixed(2);
                const tooltipElement = createTooltip(`≈ ${formatCZK(czkValue)}`);
                priceNode.addEventListener('mouseenter', (e) => {
                    tooltipElement.style.display = 'block';
                    document.addEventListener('mousemove', (ev) => moveTooltip(tooltipElement, ev));
                });
                priceNode.addEventListener('mouseleave', (e) => {
                    document.removeEventListener('mousemove', (ev) => moveTooltip(tooltipElement, ev));
                    tooltipElement.style.display = 'none';
                });
                priceNode.appendChild(tooltipElement);
                frag.appendChild(priceNode);

                lastIndex = match.index + match[0].length;
            }

            const after = node.nodeValue.slice(lastIndex);
            if (after) frag.appendChild(document.createTextNode(after));

            parent.replaceChild(frag, node);
        }
    }

    function normalizePriceNumber(number) {
        let normalized = number.replace(/\s/g, '');
        if (normalized.includes('.') && normalized.includes(',')) {
            // Find last separator (comma or dot)
            const lastComma = normalized.lastIndexOf(',');
            const lastDot = normalized.lastIndexOf('.');
            let decimalSep, thousandSep;
            if (lastComma > lastDot) {
                decimalSep = ',';
                thousandSep = '.';
            } else {
                decimalSep = '.';
                thousandSep = ',';
            }
            // Remove all thousand separators
            normalized = normalized.replace(new RegExp('\\' + thousandSep, 'g'), '');
            // Replace decimal separator with dot
            normalized = normalized.replace(new RegExp('\\' + decimalSep), '.');
        } else {
            // If only comma, treat as decimal if after thousands
            if (normalized.includes(',')) {
                // If comma is after 3 digits from end, treat as decimal
                const commaPos = normalized.lastIndexOf(',');
                if (normalized.length - commaPos - 1 === 2) {
                    normalized = normalized.replace(/,/g, '.');
                } else {
                    normalized = normalized.replace(/,/g, '');
                }
            }
            // Remove any other non-digit except dot and minus
            normalized = normalized.replace(/[^\d.-]/g, '');
        }
        return parseFloat(normalized);
    }

    const observer = new MutationObserver(mutations => {
              for (const mutation of mutations) {
                if (
                      mutation.type === 'childList' && mutation.addedNodes.length > 0 ||
                      mutation.type === 'characterData'
                ) {
                      throttledScanAndTagPrices();
                      break;
                  }
              }
          });

    let lastExecutionTime = 0;
    function throttledScanAndTagPrices() {
        const now = Date.now();
        if (now - lastExecutionTime >= 1000) {
            lastExecutionTime = now;
            observer.disconnect();
            scanAndTagPrices();
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    // Initialize the script
    fetchRatesCached()
      .then(() => {
          scanAndTagPrices(); // Initial scan and tag
          observer.observe(document.body, {
              childList: true,
              subtree: true,
              characterData: true
          });
      })
      .catch(err => console.error('FX Converter', 'Failed to initialize FX rates:', err));

})();
