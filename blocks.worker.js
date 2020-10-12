!function(){"use strict";const t=self,e=16,s=80,o=15,n={type:0,light:1,sunlight:2,count:3},a=new Map,r={light:1,sunlight:1};let i;const l=(t,e)=>({x:t,z:e,voxels:new Uint8ClampedArray(20480*n.count),heightmap:new Uint8ClampedArray(256),hasPropagated:!1}),h=(t,e)=>{const s=`${t}:${e}`;let o=a.get(s);return o||(o={...l(t,e),key:s},a.set(s,o)),o},c=(t,o,a)=>(t*e*s+o*e+a)*n.count,x=t=>(s,o)=>{let n=t;const a=s<0||s>=e?Math.floor(s/e):0,r=o<0||o>=e?Math.floor(o/e):0;return(a||r)&&(n=h(t.x+a,t.z+r),s-=e*a,o-=e*r),{chunk:n,cx:s,cz:o}},u=[{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1},{x:0,y:1,z:0},{x:0,y:-1,z:0}],p=(t,a,r="light")=>{const l=x(t),h="sunlight"===r;for(;a.length;){const{x:t,y:x,z:p}=a.shift(),{chunk:f,cx:z,cz:y}=l(t,p),g=f.voxels[c(z,x,y)+n[r]];u.forEach((u=>{const f=x+u.y;if(f<0||f>=s)return;const z=t+u.x,y=p+u.z,m=g-(h&&-1===u.y&&g===o?0:1),{chunk:d,cx:v,cz:M}=l(z,y),k=c(v,f,M);var $;($=d.voxels[k],!i[$].isTranslucent||h&&-1!==u.y&&g===o&&f>d.heightmap[v*e+M]||d.voxels[k+n[r]]>=m)||(d.voxels[k+n[r]]=m,a.push({x:z,y:f,z:y}))}))}},f=t=>{const a=[],r=[];for(let l=0;l<e;l+=1)for(let h=0;h<s;h+=1)for(let s=0;s<e;s+=1){const e=c(l,h,s),x=t.voxels[e];79===h&&i[x].isTranslucent?(t.voxels[e+n.sunlight]=o,r.push({x:l,y:79,z:s})):i[x].isLight&&(t.voxels[e+n.light]=o,a.push({x:l,y:h,z:s}))}p(t,a,"light"),p(t,r,"sunlight"),t.hasPropagated=!0},z=(t,e,a,r,i="light")=>{const l=x(t),{chunk:h,cx:f,cz:z}=l(e,r),y=c(f,a,z),g=[],m=[];m.push({x:e,y:a,z:r,light:h.voxels[y+n[i]]}),h.voxels[y+n[i]]=0;const d="sunlight"===i;for(;m.length;){const{x:t,y:e,z:a,light:r}=m.shift();u.forEach((h=>{const x=e+h.y;if(x<0||x>=s)return;const u=t+h.x,p=a+h.z,{chunk:f,cx:z,cz:y}=l(u,p),v=c(z,x,y),M=f.voxels[v+n[i]];0!==M&&(M<r||d&&-1===h.y&&r===o&&M===o?(m.push({x:u,y:x,z:p,light:M}),f.voxels[v+n[i]]=0):M>=r&&g.push({x:u,y:x,z:p}))}))}p(t,g,i)},y=({x:t,y:a,z:r,type:l})=>{const f=h(Math.floor(t/e),Math.floor(r/e));t-=e*f.x,r-=e*f.z;const{heightmap:y,voxels:g,hasPropagated:m}=f,d=c(t,a,r),v=g[d];g[d]=l;const M=t*e+r,k=y[M];if(l===i.air){if(a===k)for(let e=a-1;e>=0;e-=1)if(0===e||0!==g[c(t,e,r)]){y[M]=e;break}}else k<a&&(y[M]=a);if(m)if(i[v].isLight?z(f,t,a,r):i[v].isTranslucent&&!i[l].isTranslucent&&["light","sunlight"].forEach((e=>{0!==g[d+n[e]]&&z(f,t,a,r,e)})),i[l].isLight)g[d+n.light]=o,p(f,[{x:t,y:a,z:r}]);else if(i[l].isTranslucent&&!i[v].isTranslucent){const e=x(f);["light","sunlight"].forEach((l=>{const h=[];"sunlight"===l&&79===a?(g[d+n[l]]=o,h.push({x:t,y:a,z:r})):u.forEach((o=>{const x=a+o.y;if(x<0||x>=s)return;const u=t+o.x,p=r+o.z,{chunk:f,cx:z,cz:y}=e(u,p),g=c(z,x,y),{isLight:m,isTranslucent:d}=i[f.voxels[g]];0!==f.voxels[g+n[l]]&&(d||m&&"light"===l)&&h.push({x:u,y:x,z:p})})),p(f,h,l)}))}return f},g=({light:t,sunlight:e},s)=>s.map((s=>{let n=i[s[0].type].hasAO,a=i[s[1].type].hasAO,l=n&&a||i[s[2].type].hasAO;const h=[n,a,l].reduce(((t,e)=>t-(e?.1:0)),1);let c=1,x=t,u=e;return n=i[s[0].type].isTranslucent,a=i[s[1].type].isTranslucent,l=(n||a)&&i[s[2].type].isTranslucent,[n,a,l].forEach(((t,e)=>{t&&(x+=s[e].light,u+=s[e].sunlight,c+=1)})),Math.max(Math.max(x*r.light,u*r.sunlight)/c/o,.02)*h})),m={type:0,light:0,sunlight:o},d=(t,e)=>!i[t].isCulled||!i[e].isCulled||i[e].isGhost&&(!i[t].isGhost||t!==e)||i[e].isTransparent&&(!i[t].isTransparent||t!==e),v=[{x:-1,z:-1},{x:0,z:-1},{x:1,z:-1},{x:-1,z:0},{x:1,z:0},{x:-1,z:1},{x:0,z:1},{x:1,z:1}],M=1/18,k=17/18,$=new Map,b=(t,a)=>{const l=h(t,a);$.has(l.key)||$.set(l.key,l),l.hasPropagated||f(l),v.forEach((({x:t,z:e})=>{const s=h(l.x+t,l.z+e);s.hasPropagated||f(s)}));const u=(t=>{const e=x(t);return(t,o,a)=>{if(o<0||o>=s)return m;const{chunk:r,cx:i,cz:l}=e(t,a),h=c(i,o,l);return{type:r.voxels[h],light:r.voxels[h+n.light],sunlight:r.voxels[h+n.sunlight]}}})(l);return[...Array(5)].map(((t,s)=>{const n=["ghost","opaque","transparent"].reduce(((t,e)=>(t[e]={color:[],position:[],uv:[],index:[],offset:0},t)),{}),a=(t,e,s,o,a,r,l)=>{const h=i[a].textures[l%6],c=[[h.from,l+k],[h.to,l+k],[h.to,l+M],[h.from,l+M]],x=[t,e,s,o];r[0]+r[2]<r[1]+r[3]&&(r.unshift(r.pop()),c.unshift(c.pop()),x.unshift(x.pop()));let u=n.opaque;i[a].isGhost?u=n.ghost:i[a].isTransparent&&(u=n.transparent),r.forEach((t=>u.color.push(t,t,t))),c.forEach((t=>u.uv.push(...t))),x.forEach((t=>u.position.push(...t))),[0,1,2,2,3,0].forEach((t=>u.index.push(u.offset+t))),u.offset+=4},l=(t,e,s,o)=>{const n=u(t,e+1,s),r=u(t,e-1,s),i=u(t,e,s+1),l=u(t,e,s-1),h=u(t-1,e,s),c=u(t+1,e,s);if(d(o,n.type)){const r=u(t,e+1,s-1),i=u(t+1,e+1,s),l=u(t-1,e+1,s),h=u(t,e+1,s+1);a([t,e+1,s+1],[t+1,e+1,s+1],[t+1,e+1,s],[t,e+1,s],o,g(n,[[l,h,u(t-1,e+1,s+1)],[i,h,u(t+1,e+1,s+1)],[i,r,u(t+1,e+1,s-1)],[l,r,u(t-1,e+1,s-1)]]),0)}if(d(o,r.type)){const n=u(t,e-1,s-1),i=u(t+1,e-1,s),l=u(t-1,e-1,s),h=u(t,e-1,s+1);a([t,e,s],[t+1,e,s],[t+1,e,s+1],[t,e,s+1],o,g(r,[[l,n,u(t-1,e-1,s-1)],[i,n,u(t+1,e-1,s-1)],[i,h,u(t+1,e-1,s+1)],[l,h,u(t-1,e-1,s+1)]]),1)}if(d(o,i.type)){const n=u(t+1,e,s+1),r=u(t-1,e,s+1),l=u(t,e+1,s+1),h=u(t,e-1,s+1);a([t,e,s+1],[t+1,e,s+1],[t+1,e+1,s+1],[t,e+1,s+1],o,g(i,[[r,h,u(t-1,e-1,s+1)],[n,h,u(t+1,e-1,s+1)],[n,l,u(t+1,e+1,s+1)],[r,l,u(t-1,e+1,s+1)]]),2)}if(d(o,l.type)){const n=u(t+1,e,s-1),r=u(t-1,e,s-1),i=u(t,e+1,s-1),h=u(t,e-1,s-1);a([t+1,e,s],[t,e,s],[t,e+1,s],[t+1,e+1,s],o,g(l,[[n,h,u(t+1,e-1,s-1)],[r,h,u(t-1,e-1,s-1)],[r,i,u(t-1,e+1,s-1)],[n,i,u(t+1,e+1,s-1)]]),3)}if(d(o,h.type)){const n=u(t-1,e,s-1),r=u(t-1,e,s+1),i=u(t-1,e+1,s),l=u(t-1,e-1,s);a([t,e,s],[t,e,s+1],[t,e+1,s+1],[t,e+1,s],o,g(h,[[n,l,u(t-1,e-1,s-1)],[r,l,u(t-1,e-1,s+1)],[r,i,u(t-1,e+1,s+1)],[n,i,u(t-1,e+1,s-1)]]),4)}if(d(o,c.type)){const n=u(t+1,e,s-1),r=u(t+1,e,s+1),i=u(t+1,e+1,s),l=u(t+1,e-1,s);a([t+1,e,s+1],[t+1,e,s],[t+1,e+1,s],[t+1,e+1,s+1],o,g(c,[[r,l,u(t+1,e-1,s+1)],[n,l,u(t+1,e-1,s-1)],[n,i,u(t+1,e+1,s-1)],[r,i,u(t+1,e+1,s+1)]]),5)}},h=(t,e,s,{type:n,light:i,sunlight:l})=>{const h=(()=>{const t=Math.max(Math.max(i*r.light,l*r.sunlight)/o,.02);return[...Array(4)].map((()=>t))})();a([t,e,s],[t+1,e,s+1],[t+1,e+1,s+1],[t,e+1,s],n,h,6),a([t,e,s+1],[t+1,e,s],[t+1,e+1,s],[t,e+1,s+1],n,h,6),a([t+1,e,s+1],[t,e,s],[t,e+1,s],[t+1,e+1,s+1],n,h,6),a([t+1,e,s],[t,e,s+1],[t,e+1,s+1],[t+1,e+1,s],n,h,6)},c=s*e,x=(s+1)*e;for(let t=0;t<e;t+=1)for(let s=c;s<x;s+=1)for(let o=0;o<e;o+=1){const e=u(t,s,o);if(0!==e.type)switch(i[e.type].model){case"cross":h(t,s,o,e);break;default:l(t,s,o,e.type)}}return["ghost","opaque","transparent"].reduce(((t,e)=>{const{color:s,position:o,uv:a,index:r}=n[e];return t[e]={color:new Float32Array(s),position:new Uint8Array(o),uv:new Float32Array(a),index:new Uint16Array(r)},t}),{})}))},T=(()=>{let e;const s=new Map,o=()=>{[...s.values()].forEach((e=>((e,s)=>{const o=b(e,s);t.postMessage({type:"chunk",position:{x:e,z:s},subchunks:o},o.reduce(((t,e)=>(["ghost","opaque","transparent"].forEach((s=>{s=e[s],t.push(s.color.buffer,s.position.buffer,s.uv.buffer,s.index.buffer)})),t)),[]))})(e.x,e.z))),s.clear()};return(t,n)=>{s.set(`${t}:${n}`,{x:t,z:n}),e&&clearTimeout(e),e=setTimeout(o,0)}})(),E=()=>{const t=[...$.values()];t.length?t.forEach((t=>T(t.x,t.z))):T(0,0)},A=({offset:t={x:-8,y:-1,z:-8}})=>{const s=(t,s,a)=>{const l=`${Math.floor(t/e)}:${Math.floor(a/e)}`,h=$.get(l);if(!h)return 0;t-=e*h.x,a-=e*h.z;const x=c(t,s,a);return i[h.voxels[x]].isTranslucent?Math.floor(255*Math.max(h.voxels[x+n.light]*r.light,h.voxels[x+n.sunlight]*r.sunlight)/o):0},{min:a,max:l}=[...$.values()].reduce((({min:t,max:s},{x:o,z:n,heightmap:a})=>{const r=a.reduce(((t,e)=>Math.max(t,e)),0);return{min:{x:Math.min(t.x,o*e),y:0,z:Math.min(t.z,n*e)},max:{x:Math.max(s.x,(o+1)*e),y:Math.max(s.y,r),z:Math.max(s.z,(n+1)*e)}}}),{min:{x:1/0,y:0,z:1/0},max:{x:-1/0,y:0,z:-1/0}});l.y=Math.ceil((l.y+8)/e)*e;const h={x:l.x-a.x,y:l.y-a.y,z:l.z-a.z},x=Array(h.x*h.y*h.z);for(let t=a.z,e=0;t<l.z;t+=1)for(let o=a.y;o<l.y;o+=1)for(let n=a.x;n<l.x;n+=1,e+=1)x[e]=String.fromCharCode(s(n,o,t));return{data:btoa(x.join("")),origin:{x:a.x+t.x,y:a.y+t.y,z:a.z+t.z},size:h}},w=({offset:t={x:-8,y:-1,z:-8}})=>{const o=(t,o,n)=>{if(o<0||o>=s)return!1;const a=`${Math.floor(t/e)}:${Math.floor(n/e)}`,r=$.get(a);if(!r)return!1;t-=e*r.x,n-=e*r.z;const l=r.voxels[c(t,o,n)];return 0!==l&&!i[l].isGhost&&"cross"!==i[l].model},{min:n,max:a}=[...$.values()].reduce((({min:t,max:s},{x:o,z:n})=>({min:{x:Math.min(t.x,o*e),z:Math.min(t.z,n*e)},max:{x:Math.max(s.x,(o+1)*e),z:Math.max(s.z,(n+1)*e)}})),{min:{x:1/0,z:1/0},max:{x:-1/0,z:-1/0}}),r=[],l=new Map;for(let t=n.x;t<a.x;t+=1)for(let e=0;e<s;e+=1)for(let i=n.z;i<a.z;i+=1)if(o(t,e,i)&&!l.has(`${t}:${e}:${i}`)){const n={position:{x:t,y:e,z:i},size:{x:0,y:0,z:0}};r.push(n);for(let s=t+1;s<=a.x;s+=1)if(!o(s,e,i)||l.has(`${s}:${e}:${i}`)){n.size.x=s-t;break}n.size.y=s-e;for(let s=t;s<t+n.size.x;s+=1)for(let t=e+1;t<=e+n.size.y;t+=1)o(s,t,i)&&!l.has(`${s}:${t}:${i}`)||(n.size.y=t-e);n.size.z=a.z-i;for(let s=t;s<t+n.size.x;s+=1)for(let t=e;t<e+n.size.y;t+=1)for(let e=i+1;e<=i+n.size.z;e+=1)o(s,t,e)&&!l.has(`${s}:${t}:${e}`)||(n.size.z=e-i);for(let s=t;s<t+n.size.x;s+=1)for(let t=e;t<e+n.size.y;t+=1)for(let e=i;e<i+n.size.z;e+=1)l.set(`${s}:${t}:${e}`,!0)}return r.map((({position:e,size:s})=>[[e.x+t.x,e.y+t.y,e.z+t.z],[s.x,s.y,s.z]]))};t.addEventListener("message",(({data:l})=>{switch(l.type){case"types":{const t=i,e={opaque:0,transparent:0};if(i=[{name:"Air",isLight:!1,isTranslucent:!0},...l.types.map((t=>{const s=t.isTransparent?"transparent":"opaque",o="cross"===t.model,n=e[s];return t.isGhost||(e[s]+=o?1:3),{...t,hasAO:!o,isCulled:!o,isTranslucent:o||t.isTransparent,textures:o?[n]:[n,n+2,n+1,n+1,n+1,n+1]}})).map((t=>({...t,textures:t.textures.map((s=>{const o=1/e[t.isTransparent?"transparent":"opaque"],n=o/18,a=s*o+n;return{from:a,to:a+16*n}}))})))],t){let e=!1,s=!1;if(i.length<t.length)e=!0,s=t.map((({key:t})=>{if(!t)return 0;const e=i.findIndex((({key:e})=>e===t));return~e?e:0}));else{const s=t.length;for(let o=0;o<s;o+=1){const s=t[o],n=i[o];if(s.model!==n.model||s.isGhost!==n.isGhost||s.isLight!==n.isLight||s.isTransparent!==n.isTransparent){e=!0;break}}}e&&([...a.values()].forEach((({key:t})=>{$.has(t)||a.delete(t)})),[...$.values()].forEach((t=>{const{voxels:e}=t,{length:a}=e;for(let t=0;t<a;t+=n.count)s&&(e[t]=s[e[t]]),e[t+n.light]=i[e[t]].isLight?o:0,e[t+n.sunlight]=0;t.hasPropagated=!1})))}E();break}case"lighting":r.light=l.channels.light,r.sunlight=l.channels.sunlight,E();break;case"clone":if(l.from.y>0&&l.from.y<s&&l.to.y>0&&l.to.y<s){const t=(({x:t,y:s,z:o},n)=>{const a=h(Math.floor(t/e),Math.floor(o/e));return t-=e*a.x,o-=e*a.z,y({...n,type:a.voxels[c(t,s,o)]})})(l.from,l.to);[t,...v.map((({x:e,z:s})=>({x:t.x+e,z:t.z+s})))].forEach((t=>T(t.x,t.z)))}break;case"update":if(l.update.y>0&&l.update.y<s){const t=y(l.update);[t,...v.map((({x:e,z:s})=>({x:t.x+e,z:t.z+s})))].forEach((t=>T(t.x,t.z)))}break;case"pick":{const{block:o}=l;if(o.y>0&&o.y<s){const s=h(Math.floor(o.x/e),Math.floor(o.z/e));o.x-=e*s.x,o.z-=e*s.z,t.postMessage({type:"pick",block:s.voxels[c(o.x,o.y,o.z)]})}break}case"load":a.clear(),$.clear(),i=void 0,l.chunks.forEach((({x:t,z:r,voxels:i})=>{const h=`${t}:${r}`,c=new Uint8ClampedArray(atob(i).split("").map((t=>t.charCodeAt(0)))),x=new Uint8ClampedArray(20480*n.count),u=new Uint8ClampedArray(256);for(let t=0,a=0,r=0;t<e;t+=1)for(let i=0;i<s;i+=1)for(let s=0;s<e;s+=1,a+=n.count,r+=1){const h=c[r];if(x[a]=h,0!==h){const r=t*e+s;u[r]<i&&(u[r]=i),l.types[h-1].isLight&&(x[a+n.light]=o)}}const p={x:t,z:r,voxels:x,heightmap:u,hasPropagated:!1,key:h};a.set(h,p),$.set(h,p)}));break;case"save":t.postMessage({type:"save",chunks:[...$.values()].map((({x:t,z:e,voxels:s})=>{const o=new Uint8ClampedArray(20480),{length:a}=s;for(let t=0,e=0;t<a;t+=1,e+=n.count)o[t]=s[e];return{x:t,z:e,voxels:btoa(String.fromCharCode.apply(null,o))}}))});break;case"computeLightmap":t.postMessage({type:"lightmap",lightmap:A(l)});break;case"computePhysics":t.postMessage({type:"physics",boxes:w(l)});break;case"reset":a.clear(),$.clear()}}))}();
//# sourceMappingURL=blocks.worker.js.map
