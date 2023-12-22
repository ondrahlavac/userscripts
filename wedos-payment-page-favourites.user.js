// ==UserScript==
// @name        WEDOS - Streamlining payment page
// @version     2.0.2
// @author      Ondra Hlaváč <ondra@hlavac.cz>
// @description Preselects your favourite payment method and hides the rest.
// @namespace   https://ondra.hlavac.cz/
// @match       https://client.wedos.com/pay/order*
// @grant       GM.setValue
// @grant       GM.getValue
// @license     ISC
// @run-at      document-end
// @homepageURL https://github.com/ondrahlavac/userscripts
// @updateURL   https://github.com/ondrahlavac/userscripts/raw/master/wedos-payment-page-favourites.user.js
// @downloadURL https://github.com/ondrahlavac/userscripts/raw/master/wedos-payment-page-favourites.user.js
// @supportURL  https://github.com/ondrahlavac/userscripts/issues
// ==/UserScript==

const availableMethods = Array()

const pollAvailableMethods = () => {
  let methodsRows = document.querySelectorAll('#methods_list table.orderpay_method_tbl')
  for (var i=0; i < methodsRows.length; i++) {
    let methodRow, methodId, methodRadioButton
    methodRow = methodsRows[i]
    try {
      methodId = methodRow.querySelector('td.frm_title label').getAttribute('for')
      methodRadioButton = methodRow.querySelector(`input#${methodId}`)
    } catch (ex) {
      // ignoring DOMException in case of nonstandard ids
      // like 'frm_input_method_bank:CZK' which don't play nice with querySelector()
      // console.warn(ex);
    }
    availableMethods.push({
      'id': methodId,
      'rowElement': methodRow,
      'radioButton': methodRadioButton,
    })
  }
}

const simplifyAndPreselectPaymentMethods = (fav) => {
  for (var i=0; i < availableMethods.length; i++) {
    const method = availableMethods[i]
    if (method.id == fav) {
      method.radioButton.click()
    } else {
      method.rowElement.style.display = 'none'
    }
  }
}

window.addEventListener('load', async function () {
  pollAvailableMethods();
  let favouriteMethodId = await GM.getValue('favourite', 'frm_input_method_cc')
  simplifyAndPreselectPaymentMethods(favouriteMethodId);
}, false);
