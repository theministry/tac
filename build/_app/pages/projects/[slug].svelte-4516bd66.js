import{S as s,i as t,s as r,e,j as a,c as o,a as c,m as n,d as p,b as f,f as u,o as i,v as j,r as l,w as $}from"../../chunks/vendor-47cffbd8.js";import{P as d}from"../../chunks/Project-3464e3cc.js";function m(s){let t,r,m;return r=new d({props:{project:s[0],closable:!0,expanded:!0}}),{c(){t=e("div"),a(r.$$.fragment),this.h()},l(s){t=o(s,"DIV",{class:!0});var e=c(t);n(r.$$.fragment,e),e.forEach(p),this.h()},h(){f(t,"class","project svelte-1cfvgg3")},m(s,e){u(s,t,e),i(r,t,null),m=!0},p(s,[t]){const e={};1&t&&(e.project=s[0]),r.$set(e)},i(s){m||(j(r.$$.fragment,s),m=!0)},o(s){l(r.$$.fragment,s),m=!1},d(s){s&&p(t),$(r)}}}async function h({page:s,fetch:t}){const r=await t(`/data/projects/${s.params.slug}.json`);if(r.ok){return{props:{project:await r.json()}}}return{status:404,error:new Error("Page not found")}}function g(s,t,r){let{project:e}=t;return s.$$set=s=>{"project"in s&&r(0,e=s.project)},[e]}export default class extends s{constructor(s){super(),t(this,s,g,m,r,{project:0})}}export{h as load};