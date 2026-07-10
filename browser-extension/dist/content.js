(function(){"use strict";const j={name:"Web app",color:"#7c3aed",panels:[],surfaces:[],views:[],actions:[],designSystem:{source:"manual",tokens:[],componentRefs:[]},profiles:[],contentBlocks:[],source:"none"};function O(r,c){var m,l;const y=Array.isArray(r==null?void 0:r.panels)?r.panels:[],f=Array.isArray(r==null?void 0:r.surfaces)&&r.surfaces.length>0?r.surfaces:y.map(u=>({id:u.id,label:u.label,type:"panel",selector:u.selector,side:u.side,required:!1,hideable:!0,movable:!1,resizable:!1}));return{appId:r==null?void 0:r.appId,name:(r==null?void 0:r.name)||j.name,version:r==null?void 0:r.version,color:(r==null?void 0:r.color)||j.color,panels:y,surfaces:f,views:Array.isArray(r==null?void 0:r.views)?r.views:[],actions:Array.isArray(r==null?void 0:r.actions)?r.actions:[],designSystem:{...(r==null?void 0:r.designSystem)??{},tokens:Array.isArray((m=r==null?void 0:r.designSystem)==null?void 0:m.tokens)?r.designSystem.tokens:[],componentRefs:Array.isArray((l=r==null?void 0:r.designSystem)==null?void 0:l.componentRefs)?r.designSystem.componentRefs:[]},profiles:Array.isArray(r==null?void 0:r.profiles)?r.profiles:[],contentBlocks:Array.isArray(r==null?void 0:r.contentBlocks)?r.contentBlocks:[],editKeyHash:r==null?void 0:r.editKeyHash,source:c}}const we=[["color-foreground","color-background","Page text"],["color-card-foreground","color-card","Card text"],["color-primary-foreground","color-primary","Primary text"],["color-secondary-foreground","color-secondary","Secondary text"],["color-muted-foreground","color-muted","Muted text"],["color-accent-foreground","color-accent","Accent text"]];function _e(r,c={}){return Le(Pe(r.designSystem.tokens),c)}function Le(r,c={}){const y={...r,...c};return we.flatMap(([f,m,l])=>{const u=y[f],p=y[m];if(!u||!p)return[];const S=De(u,p);if(S===null)return[];const h=Math.round(S*100)/100;return[{id:`${f}-on-${m}`,label:l,foregroundToken:f,backgroundToken:m,foreground:u,background:p,ratio:h,level:h>=7?"AAA":h>=4.5?"AA":"fail",passesAA:h>=4.5,passesAAA:h>=7}]})}function Oe(r){return r.filter(c=>!c.passesAA)}function Pe(r){return Object.fromEntries(r.map(c=>[c.id,c.value]))}function De(r,c){const y=Q(r),f=Q(c);if(!y||!f)return null;const m=Z(y),l=Z(f),u=Math.max(m,l),p=Math.min(m,l);return(u+.05)/(p+.05)}function Q(r){const c=r.trim();return c.startsWith("#")?Me(c):Be(c)}function Me(r){const c=r.slice(1),y=c.length===3?c.split("").map(f=>f+f).join(""):c;return/^[0-9a-f]{6}$/i.test(y)?[parseInt(y.slice(0,2),16),parseInt(y.slice(2,4),16),parseInt(y.slice(4,6),16)]:null}function Be(r){const c=r.match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);if(!c)return null;const y=Number(c[1]),f=Number(c[2])/100,m=Number(c[3])/100;if(!Number.isFinite(y)||!Number.isFinite(f)||!Number.isFinite(m))return null;const l=(1-Math.abs(2*m-1))*f,u=(y%360+360)%360/60,p=l*(1-Math.abs(u%2-1)),S=m-l/2;let h;return u<1?h=[l,p,0]:u<2?h=[p,l,0]:u<3?h=[0,l,p]:u<4?h=[0,p,l]:u<5?h=[p,0,l]:h=[l,0,p],h.map(T=>Math.round((T+S)*255))}function Z([r,c,y]){const[f,m,l]=[r,c,y].map(u=>{const p=u/255;return p<=.03928?p/12.92:((p+.055)/1.055)**2.4});return .2126*f+.7152*m+.0722*l}const ee=globalThis;if(window===window.top&&window.location.protocol.startsWith("http")&&document.documentElement&&!ee.__DYNARA_CONTENT_SCRIPT_LOADED__){let r=function(e,t){const n=`dynara-hide-${e}`;if(document.getElementById(n))return;const o=document.createElement("style");o.id=n,o.textContent=`${t} { display: none !important; transition: none !important; }`,document.head.appendChild(o),A.add(e)},c=function(e){var t;(t=document.getElementById(`dynara-hide-${e}`))==null||t.remove(),A.delete(e)},y=function(){if(document.getElementById("dynara-inspector-styles"))return;const e=document.createElement("style");e.id="dynara-inspector-styles",e.textContent=`
      .dynara-inspect-overlay {
        position: fixed;
        z-index: 2147483647;
        pointer-events: none;
        border: 2px solid #7c3aed;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.08);
        background: rgba(124, 58, 237, 0.06);
        transition: top 120ms ease, left 120ms ease, width 120ms ease, height 120ms ease;
      }

      .dynara-inspect-label {
        position: absolute;
        left: 0;
        top: -28px;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border-radius: 999px;
        background: #7c3aed;
        color: #fff;
        padding: 5px 9px;
        font: 700 11px/1 -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
      }
    `,document.head.appendChild(e)},f=function(){if(document.getElementById("dynara-action-styles"))return;const e=document.createElement("style");e.id="dynara-action-styles",e.textContent=`
      html.dynara-reading-large main,
      body.dynara-reading-large main {
        font-size: 18px !important;
        line-height: 1.85 !important;
      }

      html.dynara-reading-large main p,
      html.dynara-reading-large main li,
      html.dynara-reading-large main input,
      html.dynara-reading-large main textarea,
      html.dynara-reading-large main button,
      html.dynara-reading-large main a,
      body.dynara-reading-large main p,
      body.dynara-reading-large main li,
      body.dynara-reading-large main input,
      body.dynara-reading-large main textarea,
      body.dynara-reading-large main button,
      body.dynara-reading-large main a {
        font-size: 1.12em !important;
        line-height: 1.85 !important;
      }

      html.dynara-reading-large main h1,
      body.dynara-reading-large main h1 {
        font-size: clamp(2.5rem, 8vw, 5.5rem) !important;
      }

      html.dynara-reading-large main h2,
      body.dynara-reading-large main h2 {
        font-size: clamp(2rem, 5vw, 3.5rem) !important;
      }

      html.dynara-reading-width main,
      body.dynara-reading-width main {
        max-width: 820px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 24px !important;
        padding-right: 24px !important;
      }

      html.dynara-reading-width main section,
      html.dynara-reading-width main .container,
      body.dynara-reading-width main section,
      body.dynara-reading-width main .container {
        max-width: 820px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      html.dynara-high-contrast,
      body.dynara-high-contrast {
        background: #ffffff !important;
        filter: contrast(1.22) saturate(0.86) !important;
      }

      html.dynara-high-contrast main,
      html.dynara-high-contrast main *,
      body.dynara-high-contrast main,
      body.dynara-high-contrast main * {
        color: #020617 !important;
        text-shadow: none !important;
      }

      html.dynara-density-compact main section,
      body.dynara-density-compact main section {
        padding-top: 1.5rem !important;
        padding-bottom: 1.5rem !important;
      }

      html.dynara-density-spacious main section,
      body.dynara-density-spacious main section {
        padding-top: 5rem !important;
        padding-bottom: 5rem !important;
      }

      html.dynara-profile-active main,
      body.dynara-profile-active main {
        font-size: calc(16px * var(--dynara-font-scale, 1)) !important;
      }

	      html.dynara-motion-reduced *,
	      body.dynara-motion-reduced * {
	        animation-duration: 0.001ms !important;
	        animation-iteration-count: 1 !important;
	        transition-duration: 0.001ms !important;
	        scroll-behavior: auto !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="hero"],
	      body.dynara-hero-showcase [data-dynara-panel="hero"] {
	        min-height: min(760px, 86vh) !important;
	        display: grid !important;
	        align-items: center !important;
	        overflow: hidden !important;
	        background:
	          radial-gradient(circle at 18% 18%, rgba(244, 114, 182, 0.28), transparent 30%),
	          radial-gradient(circle at 82% 24%, rgba(20, 184, 166, 0.24), transparent 32%),
	          linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%) !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="hero"] > .container,
	      body.dynara-hero-showcase [data-dynara-panel="hero"] > .container {
	        padding-top: clamp(5rem, 11vh, 8rem) !important;
	        padding-bottom: clamp(4rem, 9vh, 7rem) !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="hero"] h1,
	      body.dynara-hero-showcase [data-dynara-panel="hero"] h1 {
	        max-width: 980px !important;
	        font-size: clamp(3.75rem, 10vw, 8.5rem) !important;
	        line-height: 0.96 !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="hero-search"],
	      body.dynara-hero-showcase [data-dynara-panel="hero-search"] {
	        max-width: 680px !important;
	      }

	      html.dynara-hero-showcase [data-dynara-panel="tool-categories"],
	      body.dynara-hero-showcase [data-dynara-panel="tool-categories"] {
	        padding-top: 3rem !important;
	      }

	      html.dynara-hero-compact [data-dynara-panel="hero"] > .container,
	      body.dynara-hero-compact [data-dynara-panel="hero"] > .container {
	        padding-top: 2.5rem !important;
	        padding-bottom: 2rem !important;
	      }

	      html.dynara-hero-compact [data-dynara-panel="hero"] h1,
	      body.dynara-hero-compact [data-dynara-panel="hero"] h1 {
	        font-size: clamp(2.75rem, 7vw, 5.5rem) !important;
	        line-height: 1 !important;
	      }

	      html.dynara-hero-compact [data-dynara-panel="hero"] p,
	      body.dynara-hero-compact [data-dynara-panel="hero"] p {
	        margin-top: 0.75rem !important;
	        font-size: 1rem !important;
	      }

	      html.dynara-hero-compact [data-dynara-panel="hero-search"],
	      body.dynara-hero-compact [data-dynara-panel="hero-search"] {
	        margin-top: 1.25rem !important;
	        max-width: 520px !important;
	      }

	      html.dynara-hero-clean [data-dynara-panel="hero"] > .pointer-events-none,
	      html.dynara-hero-clean [data-dynara-panel="hero"] > svg,
	      html.dynara-hero-clean [data-dynara-panel="hero"] > span,
	      body.dynara-hero-clean [data-dynara-panel="hero"] > .pointer-events-none,
	      body.dynara-hero-clean [data-dynara-panel="hero"] > svg,
	      body.dynara-hero-clean [data-dynara-panel="hero"] > span {
	        display: none !important;
	      }

	      html.dynara-hero-clean [data-dynara-panel="hero"],
	      body.dynara-hero-clean [data-dynara-panel="hero"] {
	        background: hsl(var(--background)) !important;
	      }
	    `,document.head.appendChild(e)},m=function(e){const t=document.documentElement.classList.toggle(e);document.body.classList.toggle(e,t),t?_.add(e):_.delete(e),console.info("[Dynara content] toggled page class",{className:e,isActive:t,htmlClassName:document.documentElement.className,bodyClassName:document.body.className})},l=function(e){for(const t of e)document.documentElement.classList.remove(t),document.body.classList.remove(t),_.delete(t)},u=function(e={}){$={...$,...e};for(const[t,n]of Object.entries(e)){const o=ve[t];o&&document.documentElement.style.setProperty(o,n)}},p=function(){$={};for(const e of Object.values(ve))document.documentElement.style.removeProperty(e)},S=function(e){f(),p(),l(["dynara-density-compact","dynara-density-comfortable","dynara-density-spacious","dynara-motion-reduced","dynara-profile-active"]),e&&(x=e.id,k=null,document.documentElement.classList.add("dynara-profile-active",`dynara-density-${e.density}`),document.body.classList.add("dynara-profile-active",`dynara-density-${e.density}`),document.documentElement.style.setProperty("--dynara-font-scale",String(e.accessibility.fontScale??1)),e.accessibility.motion==="reduced"&&(document.documentElement.classList.add("dynara-motion-reduced"),document.body.classList.add("dynara-motion-reduced")),u(e.tokenOverrides),console.info("[Dynara content] applied profile runtime",{profileId:e.id,density:e.density,accessibility:e.accessibility,tokenOverrides:e.tokenOverrides}))},h=function(e){f(),console.info("[Dynara content] apply built-in action",{actionId:e});const t=Date.now(),n=document.documentElement.dataset.dynaraLastActionId,o=Number(document.documentElement.dataset.dynaraLastActionAt??0);return n===e&&t-o<300?(console.info("[Dynara content] ignored duplicate action",{actionId:e,elapsedMs:t-o}),!1):(document.documentElement.dataset.dynaraLastActionId=e,document.documentElement.dataset.dynaraLastActionAt=String(t),e==="reading-large-text"?(m("dynara-reading-large"),!0):e==="reading-width"?(m("dynara-reading-width"),!0):e==="high-contrast"?(m("dynara-high-contrast"),!0):e==="reset-reading"?(l(["dynara-reading-large","dynara-reading-width","dynara-high-contrast"]),!0):e==="hero-showcase"?(l(["dynara-hero-compact","dynara-hero-clean"]),m("dynara-hero-showcase"),!0):e==="hero-compact"?(l(["dynara-hero-showcase"]),m("dynara-hero-compact"),!0):e==="hero-clean"?(m("dynara-hero-clean"),!0):e==="hero-reset"?(l(Ae),!0):e in Se?(p(),u(Se[e]),!0):e==="reset-interface"?(p(),Ue(),x=null,k=null,document.documentElement.style.removeProperty("--dynara-font-scale"),l(["dynara-reading-large","dynara-reading-width","dynara-high-contrast",...Ae,"dynara-density-compact","dynara-density-comfortable","dynara-density-spacious","dynara-motion-reduced","dynara-profile-active"]),!0):!1)},T=function(e){return`dynara:state:${e.appId||e.name}:${window.location.origin}`},$e=function(e){return new Promise(t=>{chrome.storage.local.get(e,n=>t(n[e]??null))})},te=function(e,t){return new Promise(n=>chrome.storage.local.set({[e]:t},()=>n()))},He=function(e){return new Promise(t=>chrome.storage.local.remove(e,()=>t()))},ne=function(e){return{autoApply:e,hiddenPanelIds:[...A],activeProfileId:x,activeViewId:k,actionClasses:[..._],tokenOverrides:$,surfaceStyles:v,savedAt:new Date().toISOString()}},Ke=function(e){f();for(const t of e)document.documentElement.classList.add(t),document.body.classList.add(t),_.add(t)},I=function(e,t){for(const n of e)t.includes(n.id)?c(n.id):r(n.id,n.selector)},P=function(e){return`dynara-style-${CSS.escape(e)}`},Re=function(e,t){const n=[],o=[];return t.background&&n.push(`background: ${t.background} !important`),t.color&&(n.push(`color: ${t.color} !important`),o.push("color: inherit !important")),t.spacing==="compact"&&n.push("padding-top: 1.25rem !important","padding-bottom: 1.25rem !important"),t.spacing==="spacious"&&n.push("padding-top: 5rem !important","padding-bottom: 5rem !important"),t.radius==="none"&&n.push("border-radius: 0 !important"),t.radius==="soft"&&n.push("border-radius: 12px !important"),t.radius==="round"&&n.push("border-radius: 28px !important"),t.fontScale==="small"&&n.push("font-size: 0.94em !important"),t.fontScale==="large"&&n.push("font-size: 1.12em !important"),n.length===0&&o.length===0?"":[`${e} { ${n.join("; ")}; }`,o.length>0?`${e} * { ${o.join("; ")}; }`:""].filter(Boolean).join(`
`)},oe=function(e,t){var s;const n=C,o=n==null?void 0:n.panels.find(E=>E.id===e);if(!o)return!1;const a=Object.fromEntries(Object.entries(t).filter(([,E])=>E&&E!=="normal"));v={...v,[e]:a};const i=Re(o.selector,a);if((s=document.getElementById(P(e)))==null||s.remove(),i){const E=document.createElement("style");E.id=P(e),E.textContent=i,document.head.appendChild(E)}return console.info("[Dynara content] applied surface style",{panelId:e,style:a}),!0},Ge=function(e){var n;(n=document.getElementById(P(e)))==null||n.remove();const t={...v};return delete t[e],v=t,!0},je=function(e){for(const[t,n]of Object.entries(e))oe(t,n)},Ue=function(){var e;for(const t of Object.keys(v))(e=document.getElementById(P(t)))==null||e.remove();v={}},D=function(){return{inspectMode:H,hoveredSurface:K,selectedSurface:L,surfaceStyles:v}},re=function(){y();let e=document.getElementById("dynara-inspect-overlay");if(e)return e;e=document.createElement("div"),e.id="dynara-inspect-overlay",e.className="dynara-inspect-overlay",e.style.display="none";const t=document.createElement("div");return t.className="dynara-inspect-label",e.appendChild(t),document.body.appendChild(e),e},U=function(e,t){const n=re(),o=t??(e?document.querySelector(e.selector):null);if(!e||!o){n.style.display="none";return}const a=o.getBoundingClientRect();n.style.display="block",n.style.top=`${Math.max(0,a.top)}px`,n.style.left=`${Math.max(0,a.left)}px`,n.style.width=`${Math.max(0,a.width)}px`,n.style.height=`${Math.max(0,a.height)}px`;const i=n.querySelector(".dynara-inspect-label");i&&(i.textContent=e.label)},ae=function(e,t){if(!e)return null;for(const n of t.panels){const o=e.matches(n.selector)?e:e.closest(n.selector);if(o)return{surface:{id:n.id,label:n.label,selector:n.selector},element:o}}return null},ie=function(e){if(!H||!C)return;const t=ae(e.target,C);K=(t==null?void 0:t.surface)??null,U(K,t==null?void 0:t.element)},ce=function(e){if(!H||!C)return;const t=ae(e.target,C);t&&(e.preventDefault(),e.stopPropagation(),L=t.surface,K=t.surface,U(L,t.element),se(!1),chrome.runtime.sendMessage({type:"WYSIWYG_SELECTED",selectedSurface:L,surfaceStyles:v}))},se=function(e){H=e,re(),e?(document.addEventListener("mousemove",ie,!0),document.addEventListener("click",ce,!0),document.documentElement.style.cursor="crosshair"):(document.removeEventListener("mousemove",ie,!0),document.removeEventListener("click",ce,!0),document.documentElement.style.cursor="",U(L)),console.info("[Dynara content] inspect mode",{enabled:e})},Fe=function(e,t){const n=document.querySelector("main"),o=n?getComputedStyle(n):null;return{actionId:e,handled:t,url:window.location.href,hasMain:!!n,hasActionStyles:!!document.getElementById("dynara-action-styles"),htmlClassName:document.documentElement.className,bodyClassName:document.body.className,mainFontSize:(o==null?void 0:o.fontSize)??null,mainLineHeight:(o==null?void 0:o.lineHeight)??null,mainMaxWidth:(o==null?void 0:o.maxWidth)??null,mainWidth:n?Math.round(n.getBoundingClientRect().width):null}},Ye=function(){return new Promise(e=>{const t=o=>{if(o.source!==window)return;const a=o.data;(a==null?void 0:a.source)!=="dynara-page"||(a==null?void 0:a.type)!=="DYNARA_MANIFEST_RESPONSE"||(window.removeEventListener("message",t),clearTimeout(n),e(O(a.manifest,"sdk")))};window.addEventListener("message",t),window.postMessage({source:"dynara-extension",type:"DYNARA_REQUEST_MANIFEST"},"*");const n=setTimeout(()=>{window.removeEventListener("message",t),e(null)},400)})},ze=function(){const e=document.querySelectorAll("[data-dynara-panel]");if(e.length===0)return null;const t=Array.from(e).map(n=>{const o=n.getAttribute("data-dynara-panel"),a=n.getAttribute("data-dynara-label")||o;return{id:o,label:a,selector:`[data-dynara-panel="${o}"]`}});return O({name:document.title||window.location.hostname,panels:t},"auto-discovery")},M=function(e){const t=e.panels.map(n=>{var o;return(o=n.selector)==null?void 0:o.trim()}).filter(n=>!!n&&!We(n));return t.length===0?!0:t.some(n=>{try{return!!document.querySelector(n)}catch{return!1}})},We=function(e){return/^(body|html|main|header|footer|nav|section|article|aside)$/i.test(e)},g=function(){return z||(z=at().then(e=>(C=e,e))),z},de=function(){return`dynara-content-blocks:${location.origin}${location.pathname}`},w=function(){try{const e=localStorage.getItem(de());return e?JSON.parse(e):[]}catch{return[]}},le=function(e){try{localStorage.setItem(de(),JSON.stringify(e))}catch{}},ue=function(e){const t=w(),n=t.findIndex(o=>o.selector===e.selector);n>=0?t[n]=e:t.push(e),le(t),chrome.runtime.sendMessage({type:"CONTENT_BLOCK_SAVED",block:e})},me=function(e){for(const t of e){const n=document.querySelector(t.selector);n&&(t.type==="text"?n.textContent=t.value:t.type==="image"&&n instanceof HTMLImageElement&&(n.src=t.value))}},qe=function(){me(w())},Ve=function(e){me(e.contentBlocks)},B=function(e){if(e.id)return`#${CSS.escape(e.id)}`;const t=[];let n=e;for(;n&&n.nodeType===1&&n!==document.body;){let o=n.tagName.toLowerCase();const a=n.parentElement;if(a){const i=Array.from(a.children).filter(s=>s.tagName===n.tagName);i.length>1&&(o+=`:nth-of-type(${i.indexOf(n)+1})`)}t.unshift(o),n=a}return t.length?`body > ${t.join(" > ")}`:e.tagName.toLowerCase()},ye=function(e){if(!it.has(e.tagName))return!1;const t=(e.textContent||"").trim();return!t||t.length>300?!1:Array.from(e.childNodes).some(n=>n.nodeType===Node.TEXT_NODE&&(n.textContent||"").trim().length>0)},Je=function(){const e=[],t=new Set,n=new Map(w().map(o=>[o.selector,o]));return document.querySelectorAll("body *").forEach(o=>{if(!(e.length>=60)&&!o.closest("#dynara-content-edit-styles, script, style, noscript")){if(o.tagName==="IMG"){const a=o;if(!a.src||a.naturalWidth<32||a.naturalHeight<32)return;const i=B(o);if(t.has(i))return;t.add(i);const s=n.get(i);e.push(s??{id:i,key:a.alt||i,type:"image",selector:i,value:a.src,label:a.alt||"Image"});return}if(ye(o)){const a=B(o);if(t.has(a))return;t.add(a);const i=n.get(a),s=(o.textContent||"").trim();e.push(i??{id:a,key:s.slice(0,40),type:"text",selector:a,value:s,label:o.tagName.toLowerCase()})}}}),e},fe=function(e){if(!e)return null;if(e.tagName==="IMG")return e;let t=e,n=0;for(;t&&n<4;){if(ye(t))return t;t=t.parentElement,n++}return null},Xe=function(){if(document.getElementById("dynara-content-edit-styles"))return;const e=document.createElement("style");e.id="dynara-content-edit-styles",e.textContent=".dynara-content-hover { outline: 2px dashed #7c3aed !important; outline-offset: 2px !important; cursor: text !important; background: rgba(124,58,237,0.06) !important; }.dynara-content-editing { outline: 2px solid #7c3aed !important; background: rgba(124,58,237,0.12) !important; cursor: text !important; }",document.head.appendChild(e)},pe=function(e){if(!R)return;const t=fe(e.target);t!==b&&(b==null||b.classList.remove("dynara-content-hover"),b=t,b==null||b.classList.add("dynara-content-hover"))},he=function(e){if(!R)return;const t=fe(e.target);if(t){if(e.preventDefault(),e.stopPropagation(),t.tagName==="IMG"){Ze(t);return}Qe(t)}},Qe=function(e){G!==e&&(F(),G=e,e.classList.add("dynara-content-editing"),e.setAttribute("contenteditable","true"),e.focus(),e.addEventListener("blur",F,{once:!0}))},F=function(){const e=G;if(!e)return;e.removeAttribute("contenteditable"),e.classList.remove("dynara-content-editing"),G=null;const t=B(e),n=(e.textContent||"").trim();ue({id:t,key:n.slice(0,40)||t,type:"text",selector:t,value:n,updatedAt:new Date().toISOString()})},Ze=function(e){const t=document.createElement("input");t.type="file",t.accept="image/*",t.style.display="none",document.body.appendChild(t),t.addEventListener("change",()=>{var a;const n=(a=t.files)==null?void 0:a[0];if(document.body.removeChild(t),!n)return;const o=new FileReader;o.onload=()=>{const i=o.result;e.src=i;const s=B(e);ue({id:s,key:e.alt||s,type:"image",selector:s,value:i,label:e.alt||"Image",updatedAt:new Date().toISOString()})},o.readAsDataURL(n)}),t.click()},ge=function(){return`dynara-content-edit-unlocked:${location.origin}${location.pathname}`},be=function(){return`dynara-content-edit-password:${location.origin}${location.pathname}`},Ee=function(){if(V)return!0;try{if(sessionStorage.getItem(ge())==="1")return V=!0,q=sessionStorage.getItem(be()),!0}catch{}return!1},Y=function(e){R=e,Xe(),e?(document.addEventListener("mousemove",pe,!0),document.addEventListener("click",he,!0)):(document.removeEventListener("mousemove",pe,!0),document.removeEventListener("click",he,!0),b==null||b.classList.remove("dynara-content-hover"),b=null,F()),console.info("[Dynara content] content edit mode",{enabled:e})};ee.__DYNARA_CONTENT_SCRIPT_LOADED__=!0;const A=new Set,_=new Set;let z=null,x=null,k=null,$={},H=!1,K=null,L=null,v={},C=null;const ve={"color-background":"--background","color-foreground":"--foreground","color-card":"--card","color-card-foreground":"--card-foreground","color-primary":"--primary","color-primary-foreground":"--primary-foreground","color-secondary":"--secondary","color-secondary-foreground":"--secondary-foreground","color-muted":"--muted","color-muted-foreground":"--muted-foreground","color-accent":"--accent","color-accent-foreground":"--accent-foreground","color-border":"--border","color-ring":"--ring","radius-base":"--radius"},Se={"theme-ocean":{"color-background":"190 60% 97%","color-foreground":"200 56% 14%","color-card":"0 0% 100%","color-primary":"196 87% 33%","color-primary-foreground":"0 0% 100%","color-secondary":"190 45% 90%","color-muted":"190 35% 92%","color-muted-foreground":"198 22% 34%","color-accent":"176 72% 38%","color-accent-foreground":"0 0% 8%","color-border":"190 30% 82%","color-ring":"196 87% 33%"},"theme-mono":{"color-background":"0 0% 98%","color-foreground":"0 0% 6%","color-card":"0 0% 100%","color-primary":"0 0% 6%","color-primary-foreground":"0 0% 100%","color-secondary":"0 0% 93%","color-muted":"0 0% 93%","color-muted-foreground":"0 0% 36%","color-accent":"0 0% 16%","color-accent-foreground":"0 0% 100%","color-border":"0 0% 84%","color-ring":"0 0% 6%"},"theme-sunset":{"color-background":"34 70% 97%","color-foreground":"18 50% 14%","color-card":"0 0% 100%","color-primary":"346 77% 50%","color-primary-foreground":"0 0% 100%","color-secondary":"32 72% 90%","color-muted":"32 55% 91%","color-muted-foreground":"20 25% 36%","color-accent":"24 95% 53%","color-accent-foreground":"0 0% 8%","color-border":"28 42% 82%","color-ring":"346 77% 50%"}},Ae=["dynara-hero-showcase","dynara-hero-compact","dynara-hero-clean"];async function W(e){return await $e(T(e))}async function ke(e=!0){const t=await g(),n=ne(e);return await te(T(t),n),console.info("[Dynara content] saved state",n),n}async function et(e){const t=await g(),o={...await W(t)??ne(e),autoApply:e,savedAt:new Date().toISOString()};return await te(T(t),o),o}async function tt(){const e=await g();return await He(T(e)),{autoApply:!1}}async function nt(e){var Ne;const t=await g(),n=new Set(t.panels.map(d=>d.id)),o=new Set(t.actions.map(d=>d.id)),a=new Set(t.designSystem.tokens.filter(d=>d.mutable).map(d=>d.id)),i=e.profileId?t.profiles.find(d=>d.id===e.profileId):void 0,s=e.viewId?t.views.find(d=>d.id===e.viewId):void 0;i?(I(t.panels,i.visibleSurfaces.filter(d=>n.has(d))),S(i)):s?(I(t.panels,s.panels.filter(d=>n.has(d))),k=s.id,x=null):(Ne=e.visibleSurfaces)!=null&&Ne.length&&(I(t.panels,e.visibleSurfaces.filter(d=>n.has(d))),k=null,x=null);const E=Object.fromEntries(Object.entries(e.tokenOverrides??{}).filter(([d])=>a.has(d))),dt=_e(t,{...(i==null?void 0:i.tokenOverrides)??{},...E}),J=Oe(dt);J.length>0&&console.warn("[Dynara content] contrast issues in interface plan",J),u(E);const xe=[];for(const d of e.actionIds??[])o.has(d)&&xe.push({actionId:d,handled:h(d)});let X=null;e.save&&(X=await ke(!0));const Ce={ok:!0,applied:{profileId:(i==null?void 0:i.id)??null,viewId:(s==null?void 0:s.id)??null,tokenOverrides:E,contrastIssues:J.map(d=>({label:d.label,ratio:d.ratio,foregroundToken:d.foregroundToken,backgroundToken:d.backgroundToken})),actionResults:xe,saved:!!X},state:X};return console.info("[Dynara content] applied interface plan",{plan:e,result:Ce}),Ce}async function ot(e){const t=await W(e);if(!(t!=null&&t.autoApply))return;const n=t.activeProfileId?e.profiles.find(a=>a.id===t.activeProfileId):void 0,o=t.activeViewId?e.views.find(a=>a.id===t.activeViewId):void 0;if(n)I(e.panels,n.visibleSurfaces),S(n);else if(o)I(e.panels,o.panels),k=o.id;else for(const a of e.panels)t.hiddenPanelIds.includes(a.id)?r(a.id,a.selector):c(a.id);u(t.tokenOverrides),je(t.surfaceStyles??{}),Ke(t.actionClasses),console.info("[Dynara content] auto-applied saved state",t)}async function rt(){try{const e=await fetch("/.well-known/dynara.json",{credentials:"same-origin"});if(!e.ok)return null;const t=await e.json();return O(t,"well-known")}catch{return null}}async function at(){const e=await Ye();if(e!=null&&e.editKeyHash&&M(e))return e;const t=await rt();if(e&&t){const o=O({...t,...e,contentBlocks:e.contentBlocks.length>0?e.contentBlocks:t.contentBlocks,editKeyHash:e.editKeyHash??t.editKeyHash},e.source);if(M(o))return o}if(e&&M(e))return e;if(t&&M(t))return t;const n=ze();return n||j}g().then(ot);let R=!1,b=null,G=null,q=null;const it=new Set(["H1","H2","H3","H4","H5","H6","P","SPAN","A","BUTTON","LI","LABEL"]);let V=!1;async function ct(e){const t=new TextEncoder().encode(e),n=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(n)).map(o=>o.toString(16).padStart(2,"0")).join("")}async function Te(e){const t=await g();if(!t.editKeyHash||await ct(e)!==t.editKeyHash)return!1;V=!0,q=e;try{sessionStorage.setItem(ge(),"1"),sessionStorage.setItem(be(),e)}catch{}return!0}async function st(e){const t=await g(),n=w(),o=q;if(!t.editKeyHash||!o||!Ee())return{ok:!1,error:"Unlock Edit mode before submitting."};if(n.length===0)return{ok:!1,error:"There are no saved edits to submit."};const a=e.replace(/\/$/,""),i=await fetch(`${a}/api/content-edit-drafts`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({appId:t.appId||t.name,password:o,pageUrl:location.href,pagePath:location.pathname,blocks:n})}),s=await i.json().catch(()=>({}));return i.ok?{ok:!0,draftId:s.draftId}:{ok:!1,error:s.error??"Could not submit edits."}}async function N(){const t=!!(await g()).editKeyHash;return{contentEditMode:R,blocks:w(),available:t,requiresPassword:t&&!Ee()}}g().then(e=>{Ve(e),qe()});const Ie=new URLSearchParams(location.search).get("dynaraEditKey");Ie&&Te(Ie).then(e=>{console.info("[Dynara content] link-based unlock",{ok:e})}),chrome.runtime.onMessage.addListener((e,t,n)=>{if(console.info("[Dynara content] received message",e),e.type==="PING"){n({ok:!0});return}if(e.type==="GET_STATE"){n({hidden:[...A]});return}if(e.type==="GET_MANIFEST")return g().then(o=>n({manifest:o})),!0;if(e.type==="TOGGLE_PANEL"){const{panelId:o,selector:a}=e;A.has(o)?c(o):r(o,a),n({hidden:[...A]});return}if(e.type==="APPLY_VIEW"){const{panels:o,visiblePanelIds:a}=e;k=e.viewId??null,x=null,I(o,a),n({hidden:[...A]});return}if(e.type==="APPLY_PROFILE"){const{panels:o,visiblePanelIds:a,profile:i}=e;for(const s of o)a.includes(s.id)?c(s.id):r(s.id,s.selector);S(i),n({hidden:[...A]});return}if(e.type==="TRIGGER_ACTION"){const{actionId:o}=e,a=h(o),i=Fe(o,a);console.info("[Dynara content] action result",i),window.postMessage({source:"dynara-extension",type:"DYNARA_TRIGGER_ACTION",actionId:o},"*"),n({ok:!0,debug:i});return}if(e.type==="GET_PERSISTENCE")return g().then(o=>W(o)).then(o=>n({state:o})),!0;if(e.type==="SAVE_CURRENT_STATE")return ke(!0).then(o=>n({ok:!0,state:o})),!0;if(e.type==="SET_AUTO_APPLY"){const{autoApply:o}=e;return et(o).then(a=>n({ok:!0,state:a})),!0}if(e.type==="CLEAR_SAVED_STATE")return tt().then(o=>n({ok:!0,state:o})),!0;if(e.type==="APPLY_INTERFACE_PLAN"){const{plan:o}=e;return nt(o).then(a=>n(a)),!0}if(e.type==="SET_INSPECT_MODE"){const{enabled:o}=e;return g().then(()=>{se(o),n({ok:!0,...D()})}),!0}if(e.type==="GET_WYSIWYG_STATE"){n(D());return}if(e.type==="APPLY_SURFACE_STYLE"){const{panelId:o,style:a}=e;return g().then(()=>{const i=oe(o,a);n({ok:i,...D()})}),!0}if(e.type==="RESET_SURFACE_STYLE"){const{panelId:o}=e;Ge(o),n({ok:!0,...D()});return}if(e.type==="SET_CONTENT_EDIT_MODE"){const{enabled:o}=e;return o?(N().then(a=>{if(!a.available||a.requiresPassword){n(a);return}Y(!0),N().then(n)}),!0):(Y(!1),N().then(n),!0)}if(e.type==="UNLOCK_CONTENT_EDIT"){const{password:o}=e;return Te(o).then(a=>{a&&Y(!0),N().then(i=>n({ok:a,...i}))}),!0}if(e.type==="GET_CONTENT_EDIT_STATE")return N().then(n),!0;if(e.type==="SCAN_CONTENT_BLOCKS"){n({blocks:Je()});return}if(e.type==="CLEAR_CONTENT_BLOCKS")return le([]),N().then(o=>n({ok:!0,...o})),!0;if(e.type==="SUBMIT_CONTENT_EDIT_DRAFT"){const{backendUrl:o}=e;return st(o).then(n).catch(a=>{n({ok:!1,error:a.message})}),!0}})}})();
