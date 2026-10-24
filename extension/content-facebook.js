(() => {
  if (!location.pathname.startsWith("/marketplace/")) return;
  const marker = new URLSearchParams(location.hash.slice(1));
  if (marker.get("df") !== "1") return;
  const token=marker.get("token"), returnUrl=marker.get("return");
  if(!token||!returnUrl) return;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const fail=async error=>{try{await browser.runtime.sendMessage({type:"DF_STORE_STATUS",payload:{token,error,searchedUrl:location.href}});const u=new URL(returnUrl);u.searchParams.set("df_import","1");location.href=u}catch{}};
  const pageText=(document.body?.innerText||"").toLowerCase();
  if(location.pathname.includes("/login")||location.pathname.includes("/checkpoint")||/security check|captcha|confirm your identity|unusual activity/.test(pageText)){void fail("Facebook needs your attention. Complete the login or security check yourself, then run the search again.");return;}
  const scrape=()=>[...document.querySelectorAll('a[href*="/marketplace/item/"]')].map(a=>{
    const id=(a.href.match(/\/marketplace\/item\/(\d+)/)||[])[1], text=(a.innerText||a.textContent||"").trim();
    if(!id||!text)return null;const lines=text.split("\n").map(x=>x.trim()).filter(Boolean);
    const priceMatch=text.match(/\$\s*([0-9][0-9,]*(?:\.\d{1,2})?)/);
    const title=lines.find(x=>!/\$\s*[0-9]/.test(x)&&!/^(sponsored|shipping available|delivery available|new listing|sold)$/i.test(x))||lines[0];
    return {id,provider:"Facebook Marketplace",title,price:priceMatch?Number(priceMatch[1].replace(/,/g,"")):null,currency:"USD",url:a.href.split("?")[0],imageUrl:a.querySelector("img")?.src,location:lines.filter(x=>/,\s*[A-Z]{2}\b/.test(x)).pop(),retrievedAt:new Date().toISOString()};
  }).filter(Boolean);
  let running=false;const run=async()=>{if(running)return;running=true;await sleep(1800);const found=new Map();let stable=0,last=0;
    for(let i=0;i<14;i++){scrape().forEach(x=>found.set(x.id,x));window.scrollBy({top:Math.max(innerHeight*1.8,1400),behavior:"smooth"});await sleep(1200);stable=found.size===last?stable+1:0;last=found.size;if(stable>=3&&last>=30)break;}
    scrape().forEach(x=>found.set(x.id,x));try{await browser.runtime.sendMessage({type:"DF_STORE_RESULTS",payload:{token,listings:[...found.values()].slice(0,100),searchedUrl:location.href}});const u=new URL(returnUrl);u.searchParams.set("df_import","1");location.href=u}catch(e){console.error("Deal Finder import failed",e)}};
  const observer=new MutationObserver(()=>{if(document.querySelector('a[href*="/marketplace/item/"]')){observer.disconnect();void run()}});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.querySelector('a[href*="/marketplace/item/"]')){observer.disconnect();void run()} setTimeout(()=>{observer.disconnect();void run()},7000);
})();