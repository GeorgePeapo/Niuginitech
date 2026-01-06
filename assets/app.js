const money = (k) => `K${Number(k).toFixed(2)}`;
const STORE_WHATSAPP = "67572666985";       // my phn num
const STORE_EMAIL = "georgepeapo@gmail.com";


async function loadProducts(){
  const res = await fetch('./products.json', {cache:'no-store'});
  return await res.json();
}

function getCart(){
  try { return JSON.parse(localStorage.getItem('nt_cart') || '[]'); } catch { return []; }
}
function setCart(items){ localStorage.setItem('nt_cart', JSON.stringify(items)); }
function cartCount(){
  return getCart().reduce((s,i)=>s+i.qty,0);
}
function updateCartBadge(){
  const el = document.querySelector('[data-cart-count]');
  if(el) el.textContent = cartCount();
}

function addToCart(product){
  const cart = getCart();
  const idx = cart.findIndex(x=>x.id===product.id);
  if(idx>=0) cart[idx].qty += 1;
  else cart.push({id:product.id, name:product.name, price_kina:product.price_kina, qty:1});
  setCart(cart);
  updateCartBadge();
}

function removeFromCart(id){
  const cart = getCart().filter(x=>x.id!==id);
  setCart(cart);
  updateCartBadge();
}

function setQty(id, qty){
  const cart = getCart().map(x=> x.id===id ? {...x, qty: Math.max(0, qty|0)} : x).filter(x=>x.qty>0);
  setCart(cart);
  updateCartBadge();
}

function cartTotal(){
  return getCart().reduce((s,i)=>s+(i.price_kina*i.qty),0);
}

function buildWhatsAppMessage(order){
  const lines = [];
  lines.push(`Niugini Tech Order`);
  lines.push(`Customer: ${order.name}`);
  lines.push(`Phone: ${order.phone}`);
  if(order.email) lines.push(`Email: ${order.email}`);
  lines.push(`Address: ${order.address}`);
  lines.push(`Payment: ${order.payment}`);
  if(order.notes) lines.push(`Notes: ${order.notes}`);
  lines.push(`--- Items ---`);
  const cart = getCart();
  cart.forEach(i => lines.push(`${i.name} x${i.qty} = ${money(i.price_kina*i.qty)}`));
  lines.push(`TOTAL: ${money(cartTotal())}`);
  return lines.join('\n');
}

async function renderShop(){
  const grid = document.querySelector('#productGrid');
  if(!grid) return;

  const products = await loadProducts();

  // Read filter from URL hash (e.g. #laptops, #routers)
  const hash = (location.hash || "").replace("#","").toLowerCase();

  const filtered = products.filter(p => {
    const cat = (p.category || "").toLowerCase();

    if(hash === "laptops") return cat.includes("laptop");
    if(hash === "routers") return cat.includes("router") || cat.includes("wi");
    if(hash === "networking") return cat.includes("network");
    if(hash === "printers") return cat.includes("printer");
    if(hash === "bilums") return cat.includes("bilum");
    if(hash === "blouses") return cat.includes("blouse");

    return true; // show all if no filter
  });

  grid.innerHTML = filtered.map(p => `
    <div class="card">
      <div class="thumb">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : ``}
      </div>
      <div style="flex:1">
        <div class="row" style="margin-top:0">
          <div>
            <h4>${p.name}</h4>
            <div class="pill">${p.category || "General"}</div>
          </div>
          <div class="price">${money(p.price_kina)}</div>
        </div>
        <p>${p.desc || ""}</p>
        <div class="row">
          <button class="btn primary" data-add="${p.id}">Add to cart</button>
          <a class="btn" href="cart.html">View cart</a>
        </div>
      </div>
    </div>
  `).join('');

  // Re-attach Add to Cart buttons
  grid.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-add');
      const product = products.find(x=>x.id===id);
      if(product){
        addToCart(product);
        btn.textContent = 'Added ✓';
        setTimeout(()=>btn.textContent='Add to cart', 900);
      }
    });
  });
}


function renderCart(){
  const body = document.querySelector('#cartBody');
  const totalEl = document.querySelector('#cartTotal');
  if(!body || !totalEl) return;

  const cart = getCart();
  if(cart.length===0){
    body.innerHTML = `<tr><td colspan="5">Your cart is empty. <a href="shop.html" style="text-decoration:underline">Go to shop</a></td></tr>`;
    totalEl.textContent = money(0);
    return;
  }

  body.innerHTML = cart.map(i=>`
    <tr>
      <td><b>${i.name}</b></td>
      <td>${money(i.price_kina)}</td>
      <td style="max-width:140px">
        <input class="input" type="number" min="1" value="${i.qty}" data-qty="${i.id}">
      </td>
      <td><b>${money(i.price_kina*i.qty)}</b></td>
      <td><button class="btn" data-remove="${i.id}">Remove</button></td>
    </tr>
  `).join('');

  totalEl.textContent = money(cartTotal());

  body.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      removeFromCart(btn.getAttribute('data-remove'));
      renderCart();
    });
  });

  body.querySelectorAll('[data-qty]').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const id = inp.getAttribute('data-qty');
      setQty(id, Number(inp.value));
      renderCart();
    });
  });
}

function wireCheckout(){
  const form = document.querySelector('#checkoutForm');
  if(!form) return;

  const totalEl = document.querySelector('#checkoutTotal');
  if(totalEl) totalEl.textContent = money(cartTotal());

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const cart = getCart();
    if(cart.length===0){
      alert("Your cart is empty.");
      return;
    }
    const fd = new FormData(form);
    const order = {
      name: String(fd.get('name')||''),
      phone: String(fd.get('phone')||''),
      email: String(fd.get('email')||''),
      address: String(fd.get('address')||''),
      payment: String(fd.get('payment')||''),
      notes: String(fd.get('notes')||''),
    };

    // Build WhatsApp link (user can edit number later)
    const msg = buildWhatsAppMessage(order);
    const to = STORE_WHATSAPP.replace(/[^\d]/g,'');
    const waUrl = `https://wa.me/${to}?text=${encodeURIComponent(msg)}`;
    const mail = `mailto:${encodeURIComponent(STORE_EMAIL)}?subject=${encodeURIComponent('Niugini Tech Order')}&body=${encodeURIComponent(msg)}`;


    // show next actions
    const box = document.querySelector('#nextActions');
    if(box){
      box.innerHTML = `
        <div class="notice">
          <b>Order ready!</b><br>
          Choose one option to send your order:
          <div class="cta-row">
            <a class="btn primary" href="${waUrl}" target="_blank" rel="noopener">Send via WhatsApp</a>
            <a class="btn" href="${mail}">Send via Email</a>
            <button class="btn" id="copyBtn" type="button">Copy message</button>
          </div>
          <div class="small">After sending, we will confirm price, schedule, and delivery/service details.</div>
        </div>
      `;
      const copyBtn = box.querySelector('#copyBtn');
      if(copyBtn){
        copyBtn.addEventListener('click', async ()=>{
          try{
            await navigator.clipboard.writeText(msg);
            copyBtn.textContent = 'Copied ✓';
            setTimeout(()=>copyBtn.textContent='Copy message', 900);
          }catch{
            alert('Copy failed. You can select and copy the message manually.');
          }
        });
      }
    }

    // Keep cart (so they can edit), but you can clear it if you want:
    // localStorage.removeItem('nt_cart');
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateCartBadge();
  renderShop();
  renderCart();
  wireCheckout();
});
