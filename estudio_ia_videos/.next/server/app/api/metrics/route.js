"use strict";(()=>{var e={};e.id=2996,e.ids=[2996],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2520:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>c,patchFetch:()=>m,requestAsyncStorage:()=>d,routeModule:()=>n,serverHooks:()=>l,staticGenerationAsyncStorage:()=>_});var o={};r.r(o),r.d(o,{GET:()=>u});var p=r(49303),a=r(88716),s=r(60670),i=r(87070);async function u(){let e=function(){let e=(process.env.STORAGE_PROVIDER||"local").toLowerCase(),t=process.env.NEXT_PUBLIC_APP_VERSION||"unknown",r=process.uptime();return`# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds gauge
app_uptime_seconds ${r.toFixed(0)}
# HELP app_build_info Build info
# TYPE app_build_info gauge
app_build_info{version="${t}"} 1
# HELP app_storage_provider Storage provider selected
# TYPE app_storage_provider gauge
app_storage_provider{provider="${e}"} 1
# HELP app_upload_requests_total Total upload requests
# TYPE app_upload_requests_total counter
app_upload_requests_total 0
# HELP app_upload_errors_total Total upload errors
# TYPE app_upload_errors_total counter
app_upload_errors_total 0`}();return new i.NextResponse(e,{headers:{"Content-Type":"text/plain; version=0.0.4"}})}let n=new p.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/metrics/route",pathname:"/api/metrics",filename:"route",bundlePath:"app/api/metrics/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\metrics\\route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:d,staticGenerationAsyncStorage:_,serverHooks:l}=n,c="/api/metrics/route";function m(){return(0,s.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:_})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972],()=>r(2520));module.exports=o})();