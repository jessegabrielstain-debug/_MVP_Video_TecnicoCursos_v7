"use strict";exports.id=7550,exports.ids=[7550],exports.modules={17550:(e,t,r)=>{r.d(t,{PPTXAnimationParser:()=>s});var a=r(18159);class s{static async extractAnimationsFromSlide(e,t){try{let r=`ppt/slides/slide${t}.xml`,s=await e.file(r)?.async("text");if(!s)return{success:!1,sequences:[],error:`Slide ${t} n\xe3o encontrado`};let o=await (0,a.parseStringPromise)(s),n=[],i=o["p:sld"]?.[0]?.["p:timing"]?.[0];if(!i)return{success:!0,sequences:[{slideNumber:t,totalDuration:0,animations:[]}]};let l=i["p:tnLst"]?.[0];if(!l)return{success:!0,sequences:[{slideNumber:t,totalDuration:0,animations:[]}]};let c=l["p:par"]?.[0];if(c){let e=c["p:cTn"]?.[0]?.["p:childTnLst"]?.[0];if(e)for(let r of e["p:seq"]||[]){let e=await this.parseSequence(r,t);n.push(...e)}}let p=n.reduce((e,t)=>Math.max(e,t.delay+t.duration),0);return console.log(`🎬 Extra\xeddas ${n.length} anima\xe7\xf5es do slide ${t}`),{success:!0,sequences:[{slideNumber:t,totalDuration:p,animations:n}]}}catch(e){return console.error(`Erro ao extrair anima\xe7\xf5es do slide ${t}:`,e),{success:!1,sequences:[],error:e instanceof Error?e.message:"Erro desconhecido"}}}static async parseSequence(e,t){let r=[];try{let a=e["p:cTn"]?.[0],s=a?.["p:childTnLst"]?.[0];if(!s)return r;let o=s["p:par"]||[];for(let e=0;e<o.length;e++){let a=await this.parseParallel(o[e],e,t);r.push(...a)}}catch(e){console.error("Erro ao parsear sequ\xeancia:",e)}return r}static async parseParallel(e,t,r){let a=[];try{let r=e["p:cTn"]?.[0],s=r?.["p:childTnLst"]?.[0];if(!s)return a;let o=s["p:animEffect"]||[],n=s["p:animMotion"]||[],i=s["p:set"]||[];for(let e of o){let r=this.parseAnimationEffect(e,t);r&&a.push(r)}for(let e of n){let r=this.parseAnimationMotion(e,t);r&&a.push(r)}for(let e of i){let r=this.parseAnimationSet(e,t);r&&a.push(r)}}catch(e){console.error("Erro ao parsear parallel:",e)}return a}static parseAnimationEffect(e,t){try{let r=e["p:cBhvr"]?.[0],a=r?.["p:cTn"]?.[0],s=r?.["p:tgtEl"]?.[0],o=s?.["p:spTgt"]?.[0],n=o?.$?.spid;if(!n)return null;let i=parseInt(a?.$?.dur||"1000"),l=a?.$?.fill||"hold",c=e.$?.transition||"in",p=e.$?.filter||"fade",{type:d,effect:m}=this.mapPowerPointEffect(c,p),f=this.extractEasing(a);return{id:`anim-${t}-${Date.now()}`,elementId:n,type:d,effect:m,duration:i,delay:0,easing:f.type,easingParams:f.params,iterations:1,direction:"normal",fillMode:this.mapFillMode(l),customProperties:{powerPointTransition:c,powerPointFilter:p}}}catch(e){return console.error("Erro ao parsear efeito:",e),null}}static parseAnimationMotion(e,t){try{let r=e["p:cBhvr"]?.[0],a=r?.["p:cTn"]?.[0],s=r?.["p:tgtEl"]?.[0],o=s?.["p:spTgt"]?.[0],n=o?.$?.spid;if(!n)return null;let i=parseInt(a?.$?.dur||"1000"),l=e.$?.origin||"layout",c=e.$?.path||"",p=e.$?.pathEditMode||"relative";return{id:`motion-${t}-${Date.now()}`,elementId:n,type:"motion",effect:"path",duration:i,delay:0,easing:"linear",iterations:1,direction:"normal",fillMode:"forwards",customProperties:{origin:l,path:c,pathEditMode:p}}}catch(e){return console.error("Erro ao parsear motion:",e),null}}static parseAnimationSet(e,t){try{let r=e["p:cBhvr"]?.[0],a=r?.["p:tgtEl"]?.[0],s=a?.["p:spTgt"]?.[0],o=s?.$?.spid;if(!o)return null;let n=e["p:to"]?.[0],i=n?.["p:strVal"]?.[0]?.$?.val;return{id:`set-${t}-${Date.now()}`,elementId:o,type:"emphasis",effect:"set",duration:0,delay:0,easing:"linear",iterations:1,direction:"normal",fillMode:"both",customProperties:{property:"visibility",value:i||"visible"}}}catch(e){return console.error("Erro ao parsear set:",e),null}}static mapPowerPointEffect(e,t){return"in"===e?{type:"entrance",effect:({fade:"fadeIn",appear:"appear",fly:"slideIn",blinds:"blinds",box:"boxIn",checkerboard:"checkerboard",circle:"circleIn",crawl:"crawlIn",diamond:"diamondIn",dissolve:"dissolve",peek:"peekIn",plus:"plusIn",random:"random",split:"split",strips:"strips",wedge:"wedge",wheel:"wheel",wipe:"wipe",zoom:"zoomIn"})[t]||"fadeIn"}:"out"===e?{type:"exit",effect:({fade:"fadeOut",disappear:"disappear",fly:"slideOut",box:"boxOut",circle:"circleOut",crawl:"crawlOut",diamond:"diamondOut",peek:"peekOut",plus:"plusOut",zoom:"zoomOut"})[t]||"fadeOut"}:{type:"emphasis",effect:({color:"changeColor",spin:"spin",grow:"grow",lighten:"lighten",darken:"darken",pulse:"pulse",teeter:"teeter",transparency:"transparency",wave:"wave"})[t]||"pulse"}}static extractEasing(e){let t=parseFloat(e?.$?.accel||"0"),r=parseFloat(e?.$?.decel||"0");return t>0&&r>0?{type:"ease-in-out"}:t>0?{type:"ease-in"}:r>0?{type:"ease-out"}:{type:"linear"}}static mapFillMode(e){return({remove:"none",hold:"forwards",freeze:"both",transition:"both"})[e]||"forwards"}static async extractAllAnimations(e){try{let t=[];for(let r of Object.keys(e.files).filter(e=>e.match(/ppt\/slides\/slide\d+\.xml/))){let a=parseInt(r.match(/slide(\d+)\.xml/)?.[1]||"0"),s=await this.extractAnimationsFromSlide(e,a);s.success&&t.push(...s.sequences)}return console.log(`🎬 Total de ${t.length} sequ\xeancias de anima\xe7\xe3o extra\xeddas`),{success:!0,sequences:t}}catch(e){return console.error("Erro ao extrair todas as anima\xe7\xf5es:",e),{success:!1,sequences:[],error:e instanceof Error?e.message:"Erro desconhecido"}}}static generateCSSAnimation(e){let{effect:t,duration:r,delay:a,easing:s,iterations:o,direction:n,fillMode:i}=e,l=-1===o?"infinite":o.toString();return`
      animation-name: ${t};
      animation-duration: ${r}ms;
      animation-delay: ${a}ms;
      animation-timing-function: ${s};
      animation-iteration-count: ${l};
      animation-direction: ${n};
      animation-fill-mode: ${i};
    `.trim()}static generateKeyframes(e){return({fadeIn:`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,fadeOut:`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `,slideIn:`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `,slideOut:`
        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `,zoomIn:`
        @keyframes zoomIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `,zoomOut:`
        @keyframes zoomOut {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0); opacity: 0; }
        }
      `,pulse:`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `,spin:`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `})[e]||""}}}};