import{S as t,i as r,s,e,t as o,c as a,a as n,g as c,d as l,b as h,f,D as i,h as u,k as p,n as j,E as g,P as d}from"../../chunks/vendor-47cffbd8.js";function v(t,r,s){const e=t.slice();return e[1]=r[s],e}function E(t){let r,s,p,j,g=t[1]+"";return{c(){r=e("li"),s=e("a"),p=o(g),this.h()},l(t){r=a(t,"LI",{});var e=n(r);s=a(e,"A",{href:!0});var o=n(s);p=c(o,g),o.forEach(l),e.forEach(l),this.h()},h(){h(s,"href",j="projects/"+t[1])},m(t,e){f(t,r,e),i(r,s),i(s,p)},p(t,r){1&r&&g!==(g=t[1]+"")&&u(p,g),1&r&&j!==(j="projects/"+t[1])&&h(s,"href",j)},d(t){t&&l(r)}}}function m(t){let r,s,u,m,w,P=t[0],b=[];for(let e=0;e<P.length;e+=1)b[e]=E(v(t,P,e));return{c(){r=e("div"),s=e("h3"),u=o("Projects"),m=p(),w=e("ul");for(let t=0;t<b.length;t+=1)b[t].c();this.h()},l(t){r=a(t,"DIV",{class:!0});var e=n(r);s=a(e,"H3",{});var o=n(s);u=c(o,"Projects"),o.forEach(l),m=j(e),w=a(e,"UL",{});var h=n(w);for(let r=0;r<b.length;r+=1)b[r].l(h);h.forEach(l),e.forEach(l),this.h()},h(){h(r,"class","object svelte-5l7giw")},m(t,e){f(t,r,e),i(r,s),i(s,u),i(r,m),i(r,w);for(let r=0;r<b.length;r+=1)b[r].m(w,null)},p(t,[r]){if(1&r){let s;for(P=t[0],s=0;s<P.length;s+=1){const e=v(t,P,s);b[s]?b[s].p(e,r):(b[s]=E(e),b[s].c(),b[s].m(w,null))}for(;s<b.length;s+=1)b[s].d(1);b.length=P.length}},i:g,o:g,d(t){t&&l(r),d(b,t)}}}async function w({page:t,fetch:r}){const s=await r("/data/projects.json");if(s.ok){return{props:await s.json()}}return{status:404,error:new Error("Page not found")}}function P(t,r,s){let{projects:e}=r;return t.$$set=t=>{"projects"in t&&s(0,e=t.projects)},[e]}export default class extends t{constructor(t){super(),r(this,t,P,m,s,{projects:0})}}export{w as load};