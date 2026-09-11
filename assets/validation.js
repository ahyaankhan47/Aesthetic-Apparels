(function (root) {
  'use strict';
  const products = ['Not specified', 'Denim Jeans', 'Denim Jackets', 'Shirts / Tops', 'Trousers / Bottoms', 'Workwear / Uniforms', 'Other Garment Product'];
  const timelines = ['Not specified', 'Within 1 month', '1–3 months', '3–6 months', 'More than 6 months'];
  const fields = ['name', 'email', 'message', 'company', 'product', 'quantity', 'timeline', 'consent', 'website'];
  function validate(input) {
    const errors = {}, value = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {errors:{form:'Please check your inquiry and try again.'}, value};
    if (Object.keys(input).some(key => !fields.includes(key))) errors.form = 'Unexpected information was included. Please reload this page.';
    for (const key of fields) {
      if (key === 'consent') { value.consent = input.consent === true; continue; }
      if (input[key] !== undefined && typeof input[key] !== 'string') { errors[key] = 'Please enter a valid value.'; value[key] = ''; continue; }
      value[key] = (input[key] || '').trim();
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value[key]) || (key !== 'message' && /[\r\n]/u.test(value[key]))) errors[key] = 'Please remove unsupported characters.';
    }
    if (value.name.length < 2 || value.name.length > 80) errors.name = 'Enter your name using 2–80 characters.';
    if (value.email.length > 120 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u.test(value.email)) errors.email = 'Enter a valid email address, such as you@company.com.';
    if (value.message.length < 20 || value.message.length > 2000) errors.message = 'Tell us a little more: use 20–2,000 characters.';
    if (value.company.length > 100) errors.company = 'Keep the company name to 100 characters or fewer.';
    if (!products.includes(value.product)) errors.product = 'Choose a product from the list.';
    if (!timelines.includes(value.timeline)) errors.timeline = 'Choose a timeline from the list.';
    if (value.quantity && (!/^\d{1,8}$/.test(value.quantity) || Number(value.quantity) < 1 || Number(value.quantity) > 10000000)) errors.quantity = 'Enter a whole number between 1 and 10,000,000.';
    if (!value.consent) errors.consent = 'Please read and acknowledge the privacy notice to continue.';
    if (value.website) errors.form = 'We could not accept this inquiry. Please contact us by email.';
    return {errors, value};
  }
  const api = {validate, fields, products, timelines};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AAInquiry = api;
})(typeof window !== 'undefined' ? window : globalThis);
