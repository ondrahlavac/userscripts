// You can run this in Node.js or a browser console for quick testing

const regex = /(?:(?<code1>EUR|USD|GBP)\s*(?<num1>-?\d{1,3}(?:[.,\s]?\d{3})*(?:[.,]\d+)?))|(?:(?<num2>-?\d{1,3}(?:[.,\s]?\d{3})*(?:[.,]\d+)?)\s*(?<code2>EUR|USD|GBP))|(?:(?<sym>[$€£])\s*(?<num3>-?\d{1,3}(?:[.,\s]?\d{3})*(?:[.,]\d+)?))/gi;

const tests = [
    { str: "€89.99", expected: { currency: "EUR", number: "89.99" } },
    { str: "USD 45.00", expected: { currency: "USD", number: "45.00" } },
    { str: "$129.95", expected: { currency: "USD", number: "129.95" } },
    { str: "199 GBP", expected: { currency: "GBP", number: "199" } },
    { str: "1,250.50 EUR", expected: { currency: "EUR", number: "1,250.50" } },
    { str: "GBP 1,250.50", expected: { currency: "GBP", number: "1,250.50" } },
    { str: "£1,250.50", expected: { currency: "GBP", number: "1,250.50" } },
    { str: "EUR 1 250,50", expected: { currency: "EUR", number: "1 250,50" } }
];

const currencySymbols = { '€': 'EUR', '$': 'USD', '£': 'GBP' };

for (const { str, expected } of tests) {
    regex.lastIndex = 0;
    const match = regex.exec(str);
    let currency, number;
    if (match) {
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
    }
    console.log(`Test: "${str}" →`, currency === expected.currency && number === expected.number ? "PASS" : "FAIL", { currency, number });
}