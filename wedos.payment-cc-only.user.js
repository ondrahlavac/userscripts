// ==UserScript==
// @name     WEDOS - Streamlining payment experience - Only CreditCard payments
// @version  1
// @author   Ondra Hlaváč <ondrej.hlavac@korunka.eu>
// @grant    none
// @include  https://client.wedos.com/pay/order*
// @run-at   document-start
// ==/UserScript==

document.addEventListener('DOMContentLoaded', function(event){
	document.removeEventListener('DOMContentLoaded', arguments.callee, false);
	hideAllOtherPaymentMethods();
	selectCreditCardPayment();
}, false);


function selectCreditCardPayment() {
	let creditCardRadio = document.querySelectorAll('input#frm_input_method_cc');
	creditCardRadio[0].checked = true;
}

function hideAllOtherPaymentMethods() {
	let allPaymentMethods = document.querySelectorAll('table.orderpay_method_tbl');
	allPaymentMethods.forEach( (onePaymentMethod) => {
		let childRadioForCreditCard = onePaymentMethod.querySelector('input#frm_input_method_cc');
		if (!childRadioForCreditCard) {
			onePaymentMethod.setAttribute(
				'style',
				onePaymentMethod.getAttribute('style') + ' display: none;'
			);
		}
	});
}
