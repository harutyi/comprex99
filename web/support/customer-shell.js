(() => {
  const main=document.querySelector('main'), header=document.querySelector('body > header');
  document.body.classList.add('customer-support');document.body.dataset.theme='lime';
  const layout=document.createElement('div');layout.className='layout';
  const aside=document.createElement('aside');aside.className='side';
  aside.innerHTML='<a class="side-logo" href="/">COMPREX<span>99</span></a><nav class="side-nav" aria-label="主要ナビゲーション"><a href="/" data-t="TOP"><i>TOP</i></a><a href="/web/#patterns" data-t="WORKS"><i>WORKS</i></a><a href="/web/#price" data-t="PRICE"><i>PRICE</i></a><a href="/web/#contact" data-t="CONTACT"><i>CONTACT</i></a></nav><div class="side-bottom"><div class="side-line">CUSTOMER SUPPORT</div></div>';
  const content=document.createElement('section');content.className='customer-content pad';
  if(header){header.className='customer-topline';content.append(header);}
  while(main.firstChild)content.append(main.firstChild);
  main.append(content);const footer=document.createElement('footer');footer.className='footer';
  footer.innerHTML='<div>© COMPREX99</div><div class="footer-links"><a href="/legal/terms.html">TERMS</a><a href="/legal/privacy.html">PRIVACY</a><a href="/web/">WEB PRODUCTION</a></div>';main.append(footer);
  layout.append(aside,main);document.body.append(layout);
})();
