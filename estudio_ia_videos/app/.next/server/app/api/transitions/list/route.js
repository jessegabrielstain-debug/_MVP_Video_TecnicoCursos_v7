"use strict";(()=>{var e={};e.id=8708,e.ids=[8708],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},97740:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>h,patchFetch:()=>$,requestAsyncStorage:()=>f,routeModule:()=>u,serverHooks:()=>y,staticGenerationAsyncStorage:()=>c});var i={};a.r(i),a.d(i,{GET:()=>d,dynamic:()=>p});var o=a(49303),r=a(88716),s=a(60670),n=a(87070);class l{listTransitions(){return[{type:"none",name:"Sem transi\xe7\xe3o",duration:0},{type:"fade",name:"Fade",duration:.5},{type:"slide-left",name:"Deslizar ←",duration:.6},{type:"slide-right",name:"Deslizar →",duration:.6},{type:"slide-up",name:"Deslizar ↑",duration:.6},{type:"slide-down",name:"Deslizar ↓",duration:.6},{type:"zoom-in",name:"Zoom In",duration:.7},{type:"zoom-out",name:"Zoom Out",duration:.7},{type:"dissolve",name:"Dissolver",duration:.8},{type:"wipe",name:"Wipe",duration:.5}]}applyTransitions(e,t){return e.map((e,a)=>({...e,transition:a>0?t:{type:"none",duration:0,easing:"linear"}}))}generateCSS(e){let{type:t,duration:a,easing:i}=e;return({none:"",fade:`
        @keyframes fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        animation: fade ${a}s ${i};
      `,"slide-left":`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        animation: slideLeft ${a}s ${i};
      `,"slide-right":`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        animation: slideRight ${a}s ${i};
      `,"slide-up":`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        animation: slideUp ${a}s ${i};
      `,"slide-down":`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        animation: slideDown ${a}s ${i};
      `,"zoom-in":`
        @keyframes zoomIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        animation: zoomIn ${a}s ${i};
      `,"zoom-out":`
        @keyframes zoomOut {
          from { transform: scale(2); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        animation: zoomOut ${a}s ${i};
      `,dissolve:`
        @keyframes dissolve {
          0% { opacity: 0; filter: blur(10px); }
          100% { opacity: 1; filter: blur(0); }
        }
        animation: dissolve ${a}s ${i};
      `,wipe:`
        @keyframes wipe {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        animation: wipe ${a}s ${i};
      `})[t]||""}constructor(){this.defaultTransition={type:"fade",duration:.5,easing:"ease-in-out"}}}let m=new l,p="force-dynamic";async function d(){try{let e=m.listTransitions();return n.NextResponse.json({success:!0,transitions:e,total:e.length})}catch(e){return n.NextResponse.json({error:"Erro ao listar transi\xe7\xf5es"},{status:500})}}let u=new o.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/transitions/list/route",pathname:"/api/transitions/list",filename:"route",bundlePath:"app/api/transitions/list/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\app\\api\\transitions\\list\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:f,staticGenerationAsyncStorage:c,serverHooks:y}=u,h="/api/transitions/list/route";function $(){return(0,s.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:c})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[9276,5972],()=>a(97740));module.exports=i})();