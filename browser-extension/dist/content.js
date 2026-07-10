(function(){"use strict";const M={name:"Web app",color:"#7c3aed",panels:[],surfaces:[],views:[],actions:[],designSystem:{source:"manual",tokens:[],componentRefs:[]},profiles:[],source:"none"};function D(r,i){var l,c;const m=Array.isArray(r==null?void 0:r.panels)?r.panels:[],y=Array.isArray(r==null?void 0:r.surfaces)&&r.surfaces.length>0?r.surfaces:m.map(s=>({id:s.id,label:s.label,type:"panel",selector:s.selector,side:s.side,required:!1,hideable:!0,movable:!1,resizable:!1}));return{appId:r==null?void 0:r.appId,name:(r==null?void 0:r.name)||M.name,version:r==null?void 0:r.version,color:(r==null?void 0:r.color)||M.color,panels:m,surfaces:y,views:Array.isArray(r==null?void 0:r.views)?r.views:[],actions:Array.isArray(r==null?void 0:r.actions)?r.actions:[],designSystem:{...(r==null?void 0:r.designSystem)??{},tokens:Array.isArray((l=r==null?void 0:r.designSystem)==null?void 0:l.tokens)?r.designSystem.tokens:[],componentRefs:Array.isArray((c=r==null?void 0:r.designSystem)==null?void 0:c.componentRefs)?r.designSystem.componentRefs:[]},profiles:Array.isArray(r==null?void 0:r.profiles)?r.profiles:[],source:i}}const oe=[["color-foreground","color-background","Page text"],["color-card-foreground","color-card","Card text"],["color-primary-foreground","color-primary","Primary text"],["color-secondary-foreground","color-secondary","Secondary text"],["color-muted-foreground","color-muted","Muted text"],["color-accent-foreground","color-accent","Accent text"]];function ie(r,i={}){return de(se(r.designSystem.tokens),i)}function de(r,i={}){const m={...r,...i};return oe.flatMap(([y,l,c])=>{const s=m[y],p=m[l];if(!s||!p)return[];const E=le(s,p);if(E===null)return[];const f=Math.round(E*100)/100;return[{id:`${y}-on-${l}`,label:c,foregroundToken:y,backgroundToken:l,foreground:s,background:p,ratio:f,level:f>=7?"AAA":f>=4.5?"AA":"fail",passesAA:f>=4.5,passesAAA:f>=7}]})}function ce(r){return r.filter(i=>!i.passesAA)}function se(r){return Object.fromEntries(r.map(i=>[i.id,i.value]))}function le(r,i){const m=Y(r),y=Y(i);if(!m||!y)return null;const l=z(m),c=z(y),s=Math.max(l,c),p=Math.min(l,c);return(s+.05)/(p+.05)}function Y(r){const i=r.trim();return i.startsWith("#")?ue(i):me(i)}function ue(r){const i=r.slice(1),m=i.length===3?i.split("").map(y=>y+y).join(""):i;return/^[0-9a-f]{6}$/i.test(m)?[parseInt(m.slice(0,2),16),parseInt(m.slice(2,4),16),parseInt(m.slice(4,6),16)]:null}function me(r){const i=r.match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);if(!i)return null;const m=Number(i[1]),y=Number(i[2])/100,l=Number(i[3])/100;if(!Number.isFinite(m)||!Number.isFinite(y)||!Number.isFinite(l))return null;const c=(1-Math.abs(2*l-1))*y,s=(m%360+360)%360/60,p=c*(1-Math.abs(s%2-1)),E=l-c/2;let f;return s<1?f=[c,p,0]:s<2?f=[p,c,0]:s<3?f=[0,c,p]:s<4?f=[0,p,c]:s<5?f=[p,0,c]:f=[c,0,p],f.map(x=>Math.round((x+E)*255))}function z([r,i,m]){const[y,l,c]=[r,i,m].map(s=>{const p=s/255;return p<=.03928?p/12.92:((p+.055)/1.055)**2.4});return .2126*y+.7152*l+.0722*c}const G=globalThis;if(window===window.top&&window.location.protocol.startsWith("http")&&document.documentElement&&!G.__DYNARA_CONTENT_SCRIPT_LOADED__){let r=function(e,t){const n=`dynara-hide-${e}`;if(document.getElementById(n))return;const a=document.createElement("style");a.id=n,a.textContent=`${t} { display: none !important; transition: none !important; }`,document.head.appendChild(a),A.add(e)},i=function(e){var t;(t=document.getElementById(`dynara-hide-${e}`))==null||t.remove(),A.delete(e)},m=function(){if(document.getElementById("dynara-inspector-styles"))return;const e=document.createElement("style");e.id="dynara-inspector-styles",e.textContent=`
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
    `,document.head.appendChild(e)},y=function(){if(document.getElementById("dynara-action-styles"))return;const e=document.createElement("style");e.id="dynara-action-styles",e.textContent=`
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
	    `,document.head.appendChild(e)},l=function(e){const t=document.documentElement.classList.toggle(e);document.body.classList.toggle(e,t),t?T.add(e):T.delete(e),console.info("[Dynara content] toggled page class",{className:e,isActive:t,htmlClassName:document.documentElement.className,bodyClassName:document.body.className})},c=function(e){for(const t of e)document.documentElement.classList.remove(t),document.body.classList.remove(t),T.delete(t)},s=function(e={}){L={...L,...e};for(const[t,n]of Object.entries(e)){const a=X[t];a&&document.documentElement.style.setProperty(a,n)}},p=function(){L={};for(const e of Object.values(X))document.documentElement.style.removeProperty(e)},E=function(e){y(),p(),c(["dynara-density-compact","dynara-density-comfortable","dynara-density-spacious","dynara-motion-reduced","dynara-profile-active"]),e&&(w=e.id,S=null,document.documentElement.classList.add("dynara-profile-active",`dynara-density-${e.density}`),document.body.classList.add("dynara-profile-active",`dynara-density-${e.density}`),document.documentElement.style.setProperty("--dynara-font-scale",String(e.accessibility.fontScale??1)),e.accessibility.motion==="reduced"&&(document.documentElement.classList.add("dynara-motion-reduced"),document.body.classList.add("dynara-motion-reduced")),s(e.tokenOverrides),console.info("[Dynara content] applied profile runtime",{profileId:e.id,density:e.density,accessibility:e.accessibility,tokenOverrides:e.tokenOverrides}))},f=function(e){y(),console.info("[Dynara content] apply built-in action",{actionId:e});const t=Date.now(),n=document.documentElement.dataset.dynaraLastActionId,a=Number(document.documentElement.dataset.dynaraLastActionAt??0);return n===e&&t-a<300?(console.info("[Dynara content] ignored duplicate action",{actionId:e,elapsedMs:t-a}),!1):(document.documentElement.dataset.dynaraLastActionId=e,document.documentElement.dataset.dynaraLastActionAt=String(t),e==="reading-large-text"?(l("dynara-reading-large"),!0):e==="reading-width"?(l("dynara-reading-width"),!0):e==="high-contrast"?(l("dynara-high-contrast"),!0):e==="reset-reading"?(c(["dynara-reading-large","dynara-reading-width","dynara-high-contrast"]),!0):e==="hero-showcase"?(c(["dynara-hero-compact","dynara-hero-clean"]),l("dynara-hero-showcase"),!0):e==="hero-compact"?(c(["dynara-hero-showcase"]),l("dynara-hero-compact"),!0):e==="hero-clean"?(l("dynara-hero-clean"),!0):e==="hero-reset"?(c(ee),!0):e in Z?(p(),s(Z[e]),!0):e==="reset-interface"?(p(),ve(),w=null,S=null,document.documentElement.style.removeProperty("--dynara-font-scale"),c(["dynara-reading-large","dynara-reading-width","dynara-high-contrast",...ee,"dynara-density-compact","dynara-density-comfortable","dynara-density-spacious","dynara-motion-reduced","dynara-profile-active"]),!0):!1)},x=function(e){return`dynara:state:${e.appId||e.name}:${window.location.origin}`},ye=function(e){return new Promise(t=>{chrome.storage.local.get(e,n=>t(n[e]??null))})},W=function(e,t){return new Promise(n=>chrome.storage.local.set({[e]:t},()=>n()))},pe=function(e){return new Promise(t=>chrome.storage.local.remove(e,()=>t()))},V=function(e){return{autoApply:e,hiddenPanelIds:[...A],activeProfileId:w,activeViewId:S,actionClasses:[...T],tokenOverrides:L,surfaceStyles:v,savedAt:new Date().toISOString()}},fe=function(e){y();for(const t of e)document.documentElement.classList.add(t),document.body.classList.add(t),T.add(t)},I=function(e,t){for(const n of e)t.includes(n.id)?i(n.id):r(n.id,n.selector)},C=function(e){return`dynara-style-${CSS.escape(e)}`},he=function(e,t){const n=[],a=[];return t.background&&n.push(`background: ${t.background} !important`),t.color&&(n.push(`color: ${t.color} !important`),a.push("color: inherit !important")),t.spacing==="compact"&&n.push("padding-top: 1.25rem !important","padding-bottom: 1.25rem !important"),t.spacing==="spacious"&&n.push("padding-top: 5rem !important","padding-bottom: 5rem !important"),t.radius==="none"&&n.push("border-radius: 0 !important"),t.radius==="soft"&&n.push("border-radius: 12px !important"),t.radius==="round"&&n.push("border-radius: 28px !important"),t.fontScale==="small"&&n.push("font-size: 0.94em !important"),t.fontScale==="large"&&n.push("font-size: 1.12em !important"),n.length===0&&a.length===0?"":[`${e} { ${n.join("; ")}; }`,a.length>0?`${e} * { ${a.join("; ")}; }`:""].filter(Boolean).join(`
`)},H=function(e,t){var h;const n=k,a=n==null?void 0:n.panels.find(g=>g.id===e);if(!a)return!1;const o=Object.fromEntries(Object.entries(t).filter(([,g])=>g&&g!=="normal"));v={...v,[e]:o};const u=he(a.selector,o);if((h=document.getElementById(C(e)))==null||h.remove(),u){const g=document.createElement("style");g.id=C(e),g.textContent=u,document.head.appendChild(g)}return console.info("[Dynara content] applied surface style",{panelId:e,style:o}),!0},ge=function(e){var n;(n=document.getElementById(C(e)))==null||n.remove();const t={...v};return delete t[e],v=t,!0},be=function(e){for(const[t,n]of Object.entries(e))H(t,n)},ve=function(){var e;for(const t of Object.keys(v))(e=document.getElementById(C(t)))==null||e.remove();v={}},P=function(){return{inspectMode:N,hoveredSurface:O,selectedSurface:_,surfaceStyles:v}},q=function(){m();let e=document.getElementById("dynara-inspect-overlay");if(e)return e;e=document.createElement("div"),e.id="dynara-inspect-overlay",e.className="dynara-inspect-overlay",e.style.display="none";const t=document.createElement("div");return t.className="dynara-inspect-label",e.appendChild(t),document.body.appendChild(e),e},R=function(e,t){const n=q(),a=t??(e?document.querySelector(e.selector):null);if(!e||!a){n.style.display="none";return}const o=a.getBoundingClientRect();n.style.display="block",n.style.top=`${Math.max(0,o.top)}px`,n.style.left=`${Math.max(0,o.left)}px`,n.style.width=`${Math.max(0,o.width)}px`,n.style.height=`${Math.max(0,o.height)}px`;const u=n.querySelector(".dynara-inspect-label");u&&(u.textContent=e.label)},U=function(e,t){if(!e)return null;for(const n of t.panels){const a=e.matches(n.selector)?e:e.closest(n.selector);if(a)return{surface:{id:n.id,label:n.label,selector:n.selector},element:a}}return null},K=function(e){if(!N||!k)return;const t=U(e.target,k);O=(t==null?void 0:t.surface)??null,R(O,t==null?void 0:t.element)},Q=function(e){if(!N||!k)return;const t=U(e.target,k);t&&(e.preventDefault(),e.stopPropagation(),_=t.surface,O=t.surface,R(_,t.element),J(!1),chrome.runtime.sendMessage({type:"WYSIWYG_SELECTED",selectedSurface:_,surfaceStyles:v}))},J=function(e){N=e,q(),e?(document.addEventListener("mousemove",K,!0),document.addEventListener("click",Q,!0),document.documentElement.style.cursor="crosshair"):(document.removeEventListener("mousemove",K,!0),document.removeEventListener("click",Q,!0),document.documentElement.style.cursor="",R(_)),console.info("[Dynara content] inspect mode",{enabled:e})},Ee=function(e,t){const n=document.querySelector("main"),a=n?getComputedStyle(n):null;return{actionId:e,handled:t,url:window.location.href,hasMain:!!n,hasActionStyles:!!document.getElementById("dynara-action-styles"),htmlClassName:document.documentElement.className,bodyClassName:document.body.className,mainFontSize:(a==null?void 0:a.fontSize)??null,mainLineHeight:(a==null?void 0:a.lineHeight)??null,mainMaxWidth:(a==null?void 0:a.maxWidth)??null,mainWidth:n?Math.round(n.getBoundingClientRect().width):null}},Ae=function(){return new Promise(e=>{const t=a=>{if(a.source!==window)return;const o=a.data;(o==null?void 0:o.source)!=="dynara-page"||(o==null?void 0:o.type)!=="DYNARA_MANIFEST_RESPONSE"||(window.removeEventListener("message",t),clearTimeout(n),e(D(o.manifest,"sdk")))};window.addEventListener("message",t),window.postMessage({source:"dynara-extension",type:"DYNARA_REQUEST_MANIFEST"},"*");const n=setTimeout(()=>{window.removeEventListener("message",t),e(null)},400)})},Se=function(){const e=document.querySelectorAll("[data-dynara-panel]");if(e.length===0)return null;const t=Array.from(e).map(n=>{const a=n.getAttribute("data-dynara-panel"),o=n.getAttribute("data-dynara-label")||a;return{id:a,label:o,selector:`[data-dynara-panel="${a}"]`}});return D({name:document.title||window.location.hostname,panels:t},"auto-discovery")},b=function(){return $||($=_e().then(e=>(k=e,e))),$};G.__DYNARA_CONTENT_SCRIPT_LOADED__=!0;const A=new Set,T=new Set;let $=null,w=null,S=null,L={},N=!1,O=null,_=null,v={},k=null;const X={"color-background":"--background","color-foreground":"--foreground","color-card":"--card","color-card-foreground":"--card-foreground","color-primary":"--primary","color-primary-foreground":"--primary-foreground","color-secondary":"--secondary","color-secondary-foreground":"--secondary-foreground","color-muted":"--muted","color-muted-foreground":"--muted-foreground","color-accent":"--accent","color-accent-foreground":"--accent-foreground","color-border":"--border","color-ring":"--ring","radius-base":"--radius"},Z={"theme-ocean":{"color-background":"190 60% 97%","color-foreground":"200 56% 14%","color-card":"0 0% 100%","color-primary":"196 87% 33%","color-primary-foreground":"0 0% 100%","color-secondary":"190 45% 90%","color-muted":"190 35% 92%","color-muted-foreground":"198 22% 34%","color-accent":"176 72% 38%","color-accent-foreground":"0 0% 8%","color-border":"190 30% 82%","color-ring":"196 87% 33%"},"theme-mono":{"color-background":"0 0% 98%","color-foreground":"0 0% 6%","color-card":"0 0% 100%","color-primary":"0 0% 6%","color-primary-foreground":"0 0% 100%","color-secondary":"0 0% 93%","color-muted":"0 0% 93%","color-muted-foreground":"0 0% 36%","color-accent":"0 0% 16%","color-accent-foreground":"0 0% 100%","color-border":"0 0% 84%","color-ring":"0 0% 6%"},"theme-sunset":{"color-background":"34 70% 97%","color-foreground":"18 50% 14%","color-card":"0 0% 100%","color-primary":"346 77% 50%","color-primary-foreground":"0 0% 100%","color-secondary":"32 72% 90%","color-muted":"32 55% 91%","color-muted-foreground":"20 25% 36%","color-accent":"24 95% 53%","color-accent-foreground":"0 0% 8%","color-border":"28 42% 82%","color-ring":"346 77% 50%"}},ee=["dynara-hero-showcase","dynara-hero-compact","dynara-hero-clean"];async function B(e){return await ye(x(e))}async function te(e=!0){const t=await b(),n=V(e);return await W(x(t),n),console.info("[Dynara content] saved state",n),n}async function xe(e){const t=await b(),a={...await B(t)??V(e),autoApply:e,savedAt:new Date().toISOString()};return await W(x(t),a),a}async function Ie(){const e=await b();return await pe(x(e)),{autoApply:!1}}async function we(e){var re;const t=await b(),n=new Set(t.panels.map(d=>d.id)),a=new Set(t.actions.map(d=>d.id)),o=new Set(t.designSystem.tokens.filter(d=>d.mutable).map(d=>d.id)),u=e.profileId?t.profiles.find(d=>d.id===e.profileId):void 0,h=e.viewId?t.views.find(d=>d.id===e.viewId):void 0;u?(I(t.panels,u.visibleSurfaces.filter(d=>n.has(d))),E(u)):h?(I(t.panels,h.panels.filter(d=>n.has(d))),S=h.id,w=null):(re=e.visibleSurfaces)!=null&&re.length&&(I(t.panels,e.visibleSurfaces.filter(d=>n.has(d))),S=null,w=null);const g=Object.fromEntries(Object.entries(e.tokenOverrides??{}).filter(([d])=>o.has(d))),Ce=ie(t,{...(u==null?void 0:u.tokenOverrides)??{},...g}),j=ce(Ce);j.length>0&&console.warn("[Dynara content] contrast issues in interface plan",j),s(g);const ne=[];for(const d of e.actionIds??[])a.has(d)&&ne.push({actionId:d,handled:f(d)});let F=null;e.save&&(F=await te(!0));const ae={ok:!0,applied:{profileId:(u==null?void 0:u.id)??null,viewId:(h==null?void 0:h.id)??null,tokenOverrides:g,contrastIssues:j.map(d=>({label:d.label,ratio:d.ratio,foregroundToken:d.foregroundToken,backgroundToken:d.backgroundToken})),actionResults:ne,saved:!!F},state:F};return console.info("[Dynara content] applied interface plan",{plan:e,result:ae}),ae}async function ke(e){const t=await B(e);if(!(t!=null&&t.autoApply))return;const n=t.activeProfileId?e.profiles.find(o=>o.id===t.activeProfileId):void 0,a=t.activeViewId?e.views.find(o=>o.id===t.activeViewId):void 0;if(n)I(e.panels,n.visibleSurfaces),E(n);else if(a)I(e.panels,a.panels),S=a.id;else for(const o of e.panels)t.hiddenPanelIds.includes(o.id)?r(o.id,o.selector):i(o.id);s(t.tokenOverrides),be(t.surfaceStyles??{}),fe(t.actionClasses),console.info("[Dynara content] auto-applied saved state",t)}async function Te(){try{const e=await fetch("/.well-known/dynara.json",{credentials:"same-origin"});if(!e.ok)return null;const t=await e.json();return D(t,"well-known")}catch{return null}}async function _e(){const e=await Ae();if(e)return e;const t=await Te();if(t)return t;const n=Se();return n||M}b().then(ke),chrome.runtime.onMessage.addListener((e,t,n)=>{if(console.info("[Dynara content] received message",e),e.type==="PING"){n({ok:!0});return}if(e.type==="GET_STATE"){n({hidden:[...A]});return}if(e.type==="GET_MANIFEST")return b().then(a=>n({manifest:a})),!0;if(e.type==="TOGGLE_PANEL"){const{panelId:a,selector:o}=e;A.has(a)?i(a):r(a,o),n({hidden:[...A]});return}if(e.type==="APPLY_VIEW"){const{panels:a,visiblePanelIds:o}=e;S=e.viewId??null,w=null,I(a,o),n({hidden:[...A]});return}if(e.type==="APPLY_PROFILE"){const{panels:a,visiblePanelIds:o,profile:u}=e;for(const h of a)o.includes(h.id)?i(h.id):r(h.id,h.selector);E(u),n({hidden:[...A]});return}if(e.type==="TRIGGER_ACTION"){const{actionId:a}=e,o=f(a),u=Ee(a,o);console.info("[Dynara content] action result",u),window.postMessage({source:"dynara-extension",type:"DYNARA_TRIGGER_ACTION",actionId:a},"*"),n({ok:!0,debug:u});return}if(e.type==="GET_PERSISTENCE")return b().then(a=>B(a)).then(a=>n({state:a})),!0;if(e.type==="SAVE_CURRENT_STATE")return te(!0).then(a=>n({ok:!0,state:a})),!0;if(e.type==="SET_AUTO_APPLY"){const{autoApply:a}=e;return xe(a).then(o=>n({ok:!0,state:o})),!0}if(e.type==="CLEAR_SAVED_STATE")return Ie().then(a=>n({ok:!0,state:a})),!0;if(e.type==="APPLY_INTERFACE_PLAN"){const{plan:a}=e;return we(a).then(o=>n(o)),!0}if(e.type==="SET_INSPECT_MODE"){const{enabled:a}=e;return b().then(()=>{J(a),n({ok:!0,...P()})}),!0}if(e.type==="GET_WYSIWYG_STATE"){n(P());return}if(e.type==="APPLY_SURFACE_STYLE"){const{panelId:a,style:o}=e;return b().then(()=>{const u=H(a,o);n({ok:u,...P()})}),!0}if(e.type==="RESET_SURFACE_STYLE"){const{panelId:a}=e;ge(a),n({ok:!0,...P()});return}})}})();
