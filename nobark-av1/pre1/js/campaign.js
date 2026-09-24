/* Variables */

const publicKey = "";

const loadOverlay = document.querySelector(".site-overlay");

const campaignRetrieveURL = "https://campaigns.apps.29next.com/api/v1/campaigns/";
const cartsCreateURL = "https://campaigns.apps.29next.com/api/v1/carts/";
const ordersURL = "https://campaigns.apps.29next.com/api/v1/orders/";

const successURLEnd = "/thank-you.html";

const headers = {
  "Content-Type": "application/json",
  "Authorization": publicKey,
};

// Campaign Data
const lineArr = [];
const voucherArr = [];
let campaignName,
  campaignCurrency,
  payEnvKey,
  refId,
  successURL,
  debugLevel,
  eOfferId,
  upsellTaken;

const queryString = window.location.search;
const cartUrlParams = new URLSearchParams(queryString);

const currentYearElement = document.getElementById("currentYear");
if (currentYearElement) {
  currentYearElement.innerText = new Date().getFullYear();
}

/* Methods */

let campaign = (function () {
  const captureURLParams = () => {
    for (const [key, value] of cartUrlParams) {
      console.log(`${key}, ${value}`);
      sessionStorage.setItem(`${key}`, `${value}`);
    }
  };

  const getSuccessUrl = () => {
    const base = location.protocol + "//" + location.host;
    if (successURL === "/wuzutech/nobarkultra/en/us/int1") {
      const url = new URL(successURL + queryString, base);
      return url.href;
    }
    const path = location.pathname.split("/");
    const campaignPath = path.slice(0, path.length - 1).join("/");

    const url = new URL(campaignPath + successURL + queryString, base);
    return url.href;
  };

  const getSuccessUrlSkip = () => {
    const path = location.pathname.split("/");
    const campaignPath = path.slice(0, path.length - 1).join("/");
    const base = location.protocol + "//" + location.host;
    const url = new URL(campaignPath + successURLEnd + queryString, base);
    return url.href;
  };

  // Fire a function only once
  const once = (fn) => {
    let called = false;
    return function (...args) {
      if (called) return;
      called = true;
      return fn.apply(this, args);
    };
  };

  // Create a cookie
  const cookieService = {
    setCookie(name, value, days) {
      let expires = "";

      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
      }

      document.cookie = name + "=" + (value || "") + expires + ";";
    },

    getCookie(name) {
      const cookies = document.cookie.split(";");

      for (const cookie of cookies) {
        if (cookie.indexOf(name + "=") > -1) {
          return cookie.split("=")[1];
        }
      }

      return null;
    },
  };

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const preventBack = () => {
    window.history.forward();
  };

  return {
    captureURLParams,
    getSuccessUrl,
    getSuccessUrlSkip,
    once,
    cookieService,
    currency,
    preventBack,
  };
})();

/* Get Campaign */

const getCampaign = async () => {
  console.log("get campaign");
  try {
    const response = await fetch(campaignRetrieveURL, {
      method: "GET",
      headers,
    });
    const data = await response.json();

    if (!response.ok) {
      console.log("Something went wrong");
      return;
    }

    console.log(data);

    sessionStorage.setItem("funnelname", data.name);

    getCampaignData(data);

    // GTM Data Layer View Item list
    let viewItemListArr = [];
    for (const item of data.packages) {
      viewItemListArr.push({
        item_id: item.external_id,
        item_name: item.name,
        price: item.price,
        currency: data.currency,
        google_business_vertical: "retail",
        quantity: item.qty,
      });
    }

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "view_item_list",
      ecommerce: {
        items: viewItemListArr,
      },
    });
    console.log("view item list event:", dataLayer);
  } catch (error) {
    console.log(error);
  }
};

// const getCampaignData = (data) => {
//   campaignCurrency = data.currency;
//   payEnvKey = data.payment_env_key;
// }

/* Create Cart / New Prospect */

const createCart = async () => {
  console.log("create prospect");
  const formData = new FormData(formEl);
  const data = Object.fromEntries(formData);

  console.log(data);

  const cartData = {
    user: {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_number: data.phone_full,
    },
    lines: lineArr,
    attribution: {
      utm_source: utm_source,
      utm_medium: utm_medium,
      utm_campaign: utm_campaign,
      utm_term: utm_term,
      utm_content: utm_content,
      gclid: gclid,
      funnel: campaignName,
      metadata: {
        domain: domain,
        device: data.userAgent,
      },
      affiliate: affiliate,
      subaffiliate1: sub1,
      subaffiliate2: sub2,
      subaffiliate3: sub3,
      subaffiliate4: sub4,
      subaffiliate5: sub5,
    },
  };

  try {
    const response = await fetch(cartsCreateURL, {
      method: "POST",
      headers,
      body: JSON.stringify(cartData),
    });
    const result = await response.json();

    if (!response.ok) {
      console.log("Something went wrong");
      return;
    }

    // GTM Data Layer Add to Cart
    let addCartItemListArr = [];
    console.log("Line Items", result.lines);
    for (const item of result.lines) {
      addCartItemListArr.push({
        item_id: item.id,
        item_name: item.product_title,
        price: item.price_incl_tax,
        currency: campaignCurrency,
        google_business_vertical: "retail",
        quantity: item.quantity,
      });
    }
    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        items: addCartItemListArr,
      },
    });
    console.log("add to cart event:", dataLayer);
  } catch (error) {
    console.log(error);
  }
};

/* Use Create Order with Credit Card */

const createOrder = async () => {
  console.log("create order");
  loadOverlay.classList.add("is-active");
  const evclid = localStorage.getItem("evclid");
  btnCC.disabled = true;
  const formData = new FormData(formEl);
  const data = Object.fromEntries(formData);

  handleDebug();

  const orderData = {
    user: {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_full: data.phone_full,
    },
    lines: lineArr,
    vouchers: voucherArr,
    use_default_shipping_address: false,
    use_default_billing_address: false,
    billing_same_as_shipping_address: data.billing_same_as_shipping_address,
    payment_detail: {
      payment_method: data.payment_method,
    },
    attribution: {
      utm_source: utm_source,
      utm_medium: utm_medium,
      utm_campaign: utm_campaign,
      utm_term: utm_term,
      utm_content: utm_content,
      gclid: gclid,
      funnel: campaignName,
      metadata: {
        domain: domain,
        device: data.userAgent,
        everflow_transaction_id: evclid,
      },
      affiliate: affiliate,
      subaffiliate1: sub1,
      subaffiliate2: sub2,
      subaffiliate3: sub3,
      subaffiliate4: sub4,
      subaffiliate5: sub5,
    },
    shipping_method: data.shipping_method,
    success_url: campaign.getSuccessUrl(successURL),
  };

  const useCCInput = document.getElementById("id_use_cc");
  if (useCCInput && !useCCInput.checked) {
    // Checking for checkout pages that have the 'id_use_cc' inputs
    includeShippingAddress = false;
  }

  if (includeShippingAddress) {
    orderData.shipping_address = {
      first_name: data.first_name,
      last_name: data.last_name,
      line1: data.shipping_address_line1,
      line2: data.shipping_address_line2,
      line4: data.shipping_address_line4,
      state: data.shipping_state,
      postcode: data.shipping_postcode,
      phone_number: data.phone_full,
      country: data.shipping_country,
    };
    orderData.payment_detail["card_token"] = data.card_token;
  }

  if (!document.getElementById("id_same_as_shipping").checked) {
    // Checking for checkout pages that have the 'id_same_as_shipping' inputs
    orderData.billing_address = {
      first_name: data.first_name_billing,
      last_name: data.last_name_billing,
      line1: data.billing_address_line1,
      line2: data.billing_address_line2,
      line4: data.billing_address_line4,
      state: data.billing_state,
      postcode: data.billing_postcode,
      phone_number: data.phone_full,
      country: data.billing_country,
    };
  }

  console.log(orderData);

  try {
    const response = await fetch(ordersURL, {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });
    const result = await response.json();

    if (!response.ok && result.non_field_errors) {
      loadOverlay.classList.remove("is-active");
      btnCC.disabled = false;
      console.log("bad result", result);
      let error = result.non_field_errors;
      document.getElementById("validation-error-block").innerHTML = `
                <div class="alert alert-danger">
                    ${error}
                </div>
            `;
      return;
    } else if (!response.ok && result.postcode) {
      loadOverlay.classList.remove("is-active");
      btnCC.disabled = false;
      console.log("bad postcode", result);
      let error = result.postcode;
      document.getElementById("validation-error-block").innerHTML = `
                <div class="alert alert-danger">
                    ${error}
                </div>
            `;
      return;
    } else if (!response.ok) {
      loadOverlay.classList.remove("is-active");
      btnCC.disabled = false;
      console.log("bad result", result);
      let error = Object.values(result)[0];
      document.getElementById("payment-error-block").innerHTML = `
                <div class="alert alert-danger">
                    ${error}
                </div>
            `;
      return;
    }

    refId = sessionStorage.getItem("ref_id");

    loadOverlay.classList.remove("is-active");

    sessionStorage.setItem("ref_id", result.ref_id);

    if (!result.payment_complete_url && result.number) {
      location.href = campaign.getSuccessUrl(successURL);
    } else if (result.payment_complete_url) {
      window.location.href = result.payment_complete_url;
    }
  } catch (error) {
    console.log(error);
  }
};

/* Use Create Order with PayPal */

const createPPOrder = async () => {
  console.log("create order paypal order");
  loadOverlay.classList.add("is-active");
  evclid = localStorage.getItem("evclid");
  const formData = new FormData(formEl);
  const data = Object.fromEntries(formData);

  handleDebug();

  const orderPPData = {
    user: {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_full: data.phone_full,
    },
    lines: lineArr,
    vouchers: voucherArr,
    attribution: {
      utm_source: utm_source,
      utm_medium: utm_medium,
      utm_campaign: utm_campaign,
      utm_term: utm_term,
      utm_content: utm_content,
      gclid: gclid,
      funnel: campaignName,
      metadata: {
        domain: domain,
        device: data.userAgent,
        everflow_transaction_id: evclid,
      },
      affiliate: affiliate,
      subaffiliate1: sub1,
      subaffiliate2: sub2,
      subaffiliate3: sub3,
      subaffiliate4: sub4,
      subaffiliate5: sub5,
    },
    payment_detail: {
      payment_method: data.payment_method,
    },
    shipping_method: data.shipping_method,
    success_url: campaign.getSuccessUrl(successURL),
  };

  try {
    const response = await fetch(ordersURL, {
      method: "POST",
      headers,
      body: JSON.stringify(orderPPData),
    });
    const result = await response.json();

    if (!response.ok) {
      console.log("Something went wrong");
      loadOverlay.classList.remove("is-active");
      console.log(orderPPData);
      return;
    }

    console.log(result);
    loadOverlay.classList.remove("is-active");
    sessionStorage.setItem("ref_id", result.ref_id);

    window.location.href = result.payment_complete_url;
  } catch (error) {
    console.log(error);
  }
};

/* Get Order Details for upsell pages */

const getOrder = async () => {
  console.log("get order");
  try {
    const response = await fetch(ordersURL + refId + "/", {
      method: "GET",
      headers,
    });
    const result = await response.json();

    if (!response.ok) {
      console.log("Something went wrong");
      return;
    }

    if (result.supports_post_purchase_upsells === false) {
      window.location.href = campaign.getSuccessUrlSkip(successURLEnd);
      sessionStorage.setItem("upsell", "n");
    } else {
      loadOverlay.classList.remove("is-active", "is-upsell");
    }
    console.log(result);

    // hash email
    String.prototype.hashCode = function () {
      var hash = 0,
        i,
        chr;
      if (this.length === 0) return hash;
      for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    };

    const hashEmail = result.user.email.hashCode();

    sessionStorage.setItem("hashedEmail", hashEmail);

    let purchaseItemListArr = [];
    for (const item of result.lines) {
      purchaseItemListArr.push({
        item_id: item.id,
        item_name: item.product_title,
        price: item.price_incl_tax,
        currency: result.currency,
        google_business_vertical: "retail",
        quantity: item.quantity,
        coupon: voucherCode,
      });
    }

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: result.number,
        affiliation: "Google Merchandise Store",
        value: result.total_incl_tax,
        tax: result.total_tax,
        shipping: result.shipping_incl_tax,
        currency: result.currency,
        coupon: voucherCode,
        firstname: result.user.first_name,
        lastname: result.user.last_name,
        phone: result.user.phone_number,
        email1: hashEmail,
        email: result.user.email,
        city: result.shipping_address.line4,
        state: result.shipping_address.state,
        zipcode: result.shipping_address.postcode,
        country: result.shipping_address.country,
        items: purchaseItemListArr,
      },
      everflow: {
        oid: eOfferId,
      },
    });
    console.log("purchase event:", dataLayer);

    getOrderData(result);
  } catch (error) {
    console.log(error);
  }
};

const retrieveOrder = campaign.once(getOrder);

/* Get Order Details for thankyou / receipt page */

const getOrderReceipt = async () => {
  try {
    const response = await fetch(ordersURL + refId + "/", {
      method: "GET",
      headers,
    });
    const order = await response.json();

    if (!response.ok) {
      console.log("Something went wrong");
      return;
    }

    console.log(order);

    show(order);
  } catch (error) {
    console.log(error);
  }
};

/* Create Upsell */

const createUpsell = async () => {
  console.log("create upsell");
  loadOverlay.classList.add("is-active");
  const orderData = {
    lines: lineArr,
  };
  console.log(orderData);

  try {
    const response = await fetch(ordersURL + refId + "/upsells/", {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });
    const result = await response.json();

    if (!response.ok) {
      console.log("Something went wrong");
      return;
    }

    console.log(result);

    let purchaseItemListArr = [];
    for (const item of result.lines) {
      purchaseItemListArr.push({
        item_id: item.id,
        item_name: item.product_title,
        price: item.price_incl_tax,
        currency: item.currency,
        google_business_vertical: "retail",
        quantity: item.quantity,
        coupon: voucherCode,
      });
    }

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: result.number,
        affiliation: "Google Merchandise Store",
        value: result.total_incl_tax,
        tax: result.total_tax,
        shipping: result.shipping_incl_tax,
        currency: result.currency,
        coupon: voucherCode,
        firstname: result.user.first_name,
        lastname: result.user.last_name,
        phone: result.user.phone_number,
        email1: hashEmail,
        email: result.user.email,
        city: result.shipping_address.line4,
        state: result.shipping_address.state,
        zipcode: result.shipping_address.postcode,
        country: result.shipping_address.country,
        items: purchaseItemListArr,
      },
    });
    console.log("purchase event:", dataLayer);

    upsellTaken = sessionStorage.setItem("upsellTaken", true);
    loadOverlay.classList.remove("is-active");
    location.href = campaign.getSuccessUrl(successURL);
  } catch (error) {
    console.log(error);
  }
};

/* Create Receipt Page Upsell */

const createUpsellReceipt = async () => {
  console.log("create upsell");
  loadOverlay.classList.add("is-active");

  const orderData = {
    lines: [
      {
        package_id: 6,
        quantity: sessionStorage.getItem("package_quantity"),
        is_upsell: true,
      },
    ],
  };
  console.log(orderData);

  try {
    const response = await fetch(ordersURL + refId + "/upsells/", {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });
    const result = await response.json();

    if (!response.ok) {
      console.log("Something went wrong");
      return;
    }
    console.log(result);
    let purchaseItemListArr = [];
    for (const item of result.lines) {
      purchaseItemListArr.push({
        item_id: item.id,
        item_name: item.product_title,
        price: item.price_incl_tax,
        currency: item.currency,
        google_business_vertical: "retail",
        quantity: item.quantity,
        coupon: voucherCode,
      });
    }

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: result.number,
        affiliation: "Google Merchandise Store",
        value: result.total_incl_tax,
        tax: result.total_tax,
        shipping: result.shipping_incl_tax,
        currency: result.currency,
        coupon: voucherCode,
        firstname: result.user.first_name,
        lastname: result.user.last_name,
        phone: result.user.phone_number,
        email1: hashEmail,
        email: result.user.email,
        city: result.shipping_address.line4,
        state: result.shipping_address.state,
        zipcode: result.shipping_address.postcode,
        country: result.shipping_address.country,
        items: purchaseItemListArr,
      },
    });

    console.log("purchase event:", dataLayer);
    receiptUpsell.classList.add("d-none");
    // receiptUpsellText.classList.add("d-none");
    loadOverlay.classList.remove("is-active");
    upsellTaken = sessionStorage.setItem("upsellTaken", true);
    getOrderReceipt();
  } catch (error) {
    console.log(error);
  }
};
