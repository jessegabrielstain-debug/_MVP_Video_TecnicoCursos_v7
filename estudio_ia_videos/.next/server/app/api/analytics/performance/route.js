"use strict";(()=>{var e={};e.id=1375,e.ids=[1375,3474],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},96331:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>b,patchFetch:()=>R,requestAsyncStorage:()=>v,routeModule:()=>h,serverHooks:()=>w,staticGenerationAsyncStorage:()=>E});var a={};r.r(a),r.d(a,{GET:()=>g,POST:()=>A});var n=r(49303),s=r(88716),o=r(60670),i=r(87070),u=r(75571),d=r(95306),c=r(55944),l=r(3474),p=r(20276),f=r(53524);async function m(e){try{let t=await (0,u.getServerSession)(d.L);if(!t?.user?.id)return i.NextResponse.json({error:"Authentication required"},{status:401});let{searchParams:r}=new URL(e.url),a=r.get("period")||"24h",n=r.get("metric")||"all",s=r.get("endpoint");(0,c.Uu)(t.user);let o=new Date;switch(a){case"1h":o.setHours(o.getHours()-1);break;case"24h":default:o.setHours(o.getHours()-24);break;case"7d":o.setDate(o.getDate()-7);break;case"30d":o.setDate(o.getDate()-30)}let p={};if("response_time"===n||"all"===n){let e=(await l.prisma.$queryRaw`
        SELECT 
          AVG(CAST(event_data->>'duration' AS FLOAT)) as avg,
          MAX(CAST(event_data->>'duration' AS FLOAT)) as max,
          MIN(CAST(event_data->>'duration' AS FLOAT)) as min,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= ${o}
        AND event_data->>'duration' IS NOT NULL
        ${s?f.Prisma.sql`AND event_data->'metadata'->>'endpoint' LIKE ${"%"+s+"%"}`:f.Prisma.sql``}
      `)[0]||{avg:0,max:0,min:0,count:0},t=await l.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN CAST(event_data->>'duration' AS FLOAT) < 100 THEN '0-100ms'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 500 THEN '100-500ms'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 1000 THEN '500ms-1s'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 2000 THEN '1-2s'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 5000 THEN '2-5s'
            ELSE '5s+'
          END as range,
          COUNT(*) as count
        FROM "AnalyticsEvent" 
        WHERE created_at >= ${o} 
        AND event_data->>'duration' IS NOT NULL
        ${s?f.Prisma.sql`AND event_data->'metadata'->>'endpoint' LIKE ${"%"+s+"%"}`:f.Prisma.sql``}
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN '0-100ms' THEN 1
            WHEN '100-500ms' THEN 2
            WHEN '500ms-1s' THEN 3
            WHEN '1-2s' THEN 4
            WHEN '2-5s' THEN 5
            WHEN '5s+' THEN 6
          END
      `,r=await l.prisma.$queryRaw`
        SELECT 
          event_data->'metadata'->>'endpoint' as endpoint,
          AVG(CAST(event_data->>'duration' AS FLOAT)) as avg_time,
          COUNT(*) as requests
        FROM "AnalyticsEvent"
        WHERE created_at >= ${o}
        AND event_data->'metadata'->>'endpoint' IS NOT NULL
        AND event_data->>'duration' IS NOT NULL
        GROUP BY event_data->'metadata'->>'endpoint'
        ORDER BY avg_time DESC
        LIMIT 10
      `;p.responseTime={stats:{avg:Math.round(Number(e.avg||0)),max:Number(e.max||0),min:Number(e.min||0),count:Number(e.count||0)},distribution:t.map(e=>({range:e.range,count:Number(e.count)})),byEndpoint:r.map(e=>({endpoint:e.endpoint||"Unknown",avgTime:Math.round(Number(e.avg_time||0)),requests:Number(e.requests)}))}}if("throughput"===n||"all"===n){let e=await l.prisma.$queryRaw`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:00') as minute,
          COUNT(*) as requests
        FROM "AnalyticsEvent" 
        WHERE created_at >= ${o}
        GROUP BY minute
        ORDER BY minute DESC
        LIMIT 60
      `,t=await l.prisma.analyticsEvent.count({where:{createdAt:{gte:o}}}),r=Math.max(1,(Date.now()-o.getTime())/6e4);p.throughput={avgRequestsPerMinute:Math.round(t/r),timeline:e.map(e=>({minute:e.minute,requests:Number(e.requests)})),totalRequests:t}}if("errors"===n||"all"===n){let e=await l.prisma.$queryRaw`
        SELECT 
          event_data->>'status' as status,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= ${o}
        AND event_data->>'status' IN ('error', 'warning')
        GROUP BY event_data->>'status'
      `,t=await l.prisma.$queryRaw`
        SELECT 
          event_type as category,
          event_data->>'errorCode' as error_code,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= ${o}
        AND event_data->>'status' = 'error'
        GROUP BY event_type, event_data->>'errorCode'
        ORDER BY count DESC
        LIMIT 10
      `,r=await l.prisma.analyticsEvent.count({where:{createdAt:{gte:o}}}),a=e.reduce((e,t)=>e+Number(t.count),0);p.errors={errorRate:r>0?(a/r*100).toFixed(2):"0",totalErrors:a,byStatus:e.map(e=>({status:e.status||"Unknown",count:Number(e.count)})),byCategory:t.map(e=>({category:e.category||"Unknown",errorCode:e.error_code||"Unknown",count:Number(e.count)}))}}if("all"===n){let e=await l.prisma.renderJob.count({where:{status:"queued"}}),t=await l.prisma.renderJob.count({where:{status:"processing"}});p.system={cpu:0,memory:0,disk:0,network:{inbound:0,outbound:0},activeConnections:0,queueSize:e+t}}if("all"===n){let e=await l.prisma.$queryRaw`
        SELECT 
          event_data->>'action' as action,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= ${o}
        AND event_type = 'cache_event'
        GROUP BY event_data->>'action'
      `,t=Number(e.find(e=>"hit"===e.action)?.count||0),r=Number(e.find(e=>"miss"===e.action)?.count||0),a=Number(e.find(e=>"eviction"===e.action)?.count||0),n=t+r,s=n>0?(t/n*100).toFixed(1):"0",i=n>0?(r/n*100).toFixed(1):"0";p.cache={hitRate:s,missRate:i,totalHits:t,totalMisses:r,evictions:a,size:0}}return i.NextResponse.json({period:a,metric:n,endpoint:s,generatedAt:new Date().toISOString(),...p})}catch(t){console.error("[Analytics Performance] Error:",t);let e=t instanceof Error?t.message:"Unknown error";return i.NextResponse.json({error:"Failed to fetch performance metrics",message:e},{status:500})}}async function y(e){try{let t=await (0,u.getServerSession)(d.L);if(!t?.user?.id)return i.NextResponse.json({error:"Authentication required"},{status:401});let{endpoint:r,method:a,responseTime:n,statusCode:s,requestSize:o,responseSize:p,userAgent:f,ipAddress:m,metadata:y}=await e.json();if(!r||!n)return i.NextResponse.json({error:"endpoint and responseTime are required"},{status:400});let g=t.user.id,A=(0,c.Uu)(t.user);return await l.prisma.analyticsEvent.create({data:{userId:g,eventType:"performance_metric",eventData:{organizationId:A,action:"api_call",label:r,duration:n,fileSize:o,status:s>=400?"error":"success",errorCode:s>=400?s.toString():null,metadata:{endpoint:r,method:a,statusCode:s,requestSize:o,responseSize:p,userAgent:f,ipAddress:m,...y}}}}),i.NextResponse.json({success:!0,message:"Performance metric recorded"})}catch(t){console.error("[Analytics Performance POST] Error:",t);let e=t instanceof Error?t.message:"Unknown error";return i.NextResponse.json({error:"Failed to record performance metric",message:e},{status:500})}}let g=(0,p.wi)(m),A=(0,p.wi)(y),h=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/analytics/performance/route",pathname:"/api/analytics/performance",filename:"route",bundlePath:"app/api/analytics/performance/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\analytics\\performance\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:v,staticGenerationAsyncStorage:E,serverHooks:w}=h,b="/api/analytics/performance/route";function R(){return(0,o.patchFetch)({serverHooks:w,staticGenerationAsyncStorage:E})}},20276:(e,t,r)=>{r.d(t,{wi:()=>n});let a=[],n=function(e){return async t=>{let r=Date.now(),n=await e(t),s=Date.now()-r;return a.push({path:t.nextUrl.pathname,method:t.method,duration:s,statusCode:n.status,timestamp:new Date}),a.length>1e3&&a.shift(),n}}},95306:(e,t,r)=>{r.d(t,{L:()=>a});let a={providers:[],session:{strategy:"jwt"},callbacks:{}}},55944:(e,t,r)=>{r.d(t,{Uu:()=>a,n5:()=>s,GJ:()=>n}),r(75571),r(95306),r(87070);let a=e=>e.currentOrgId||e.organizationId||void 0,n=e=>!0===e.isAdmin,s=e=>e.id},3474:(e,t,r)=>{r.d(t,{prisma:()=>n});var a=r(53524);let n=global.prisma||new a.PrismaClient({log:["query"]})},71615:(e,t,r)=>{r.r(t);var a=r(88757),n={};for(let e in a)"default"!==e&&(n[e]=()=>a[e]);r.d(t,n)},33085:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return s}});let a=r(45869),n=r(6278);class s{get isEnabled(){return this._provider.isEnabled}enable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,n.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,n.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{cookies:function(){return p},draftMode:function(){return f},headers:function(){return l}});let a=r(68996),n=r(53047),s=r(92044),o=r(72934),i=r(33085),u=r(6278),d=r(45869),c=r(54580);function l(){let e="headers",t=d.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return n.HeadersAdapter.seal(new Headers({}));(0,u.trackDynamicDataAccessed)(t,e)}return(0,c.getExpectedRequestStore)(e).headers}function p(){let e="cookies",t=d.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return a.RequestCookiesAdapter.seal(new s.RequestCookies(new Headers({})));(0,u.trackDynamicDataAccessed)(t,e)}let r=(0,c.getExpectedRequestStore)(e),n=o.actionAsyncStorage.getStore();return(null==n?void 0:n.isAction)||(null==n?void 0:n.isAppRoute)?r.mutableCookies:r.cookies}function f(){let e=(0,c.getExpectedRequestStore)("draftMode");return new i.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{HeadersAdapter:function(){return s},ReadonlyHeadersError:function(){return n}});let a=r(38238);class n extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new n}}class s extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,r,n){if("symbol"==typeof r)return a.ReflectAdapter.get(t,r,n);let s=r.toLowerCase(),o=Object.keys(e).find(e=>e.toLowerCase()===s);if(void 0!==o)return a.ReflectAdapter.get(t,o,n)},set(t,r,n,s){if("symbol"==typeof r)return a.ReflectAdapter.set(t,r,n,s);let o=r.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===o);return a.ReflectAdapter.set(t,i??r,n,s)},has(t,r){if("symbol"==typeof r)return a.ReflectAdapter.has(t,r);let n=r.toLowerCase(),s=Object.keys(e).find(e=>e.toLowerCase()===n);return void 0!==s&&a.ReflectAdapter.has(t,s)},deleteProperty(t,r){if("symbol"==typeof r)return a.ReflectAdapter.deleteProperty(t,r);let n=r.toLowerCase(),s=Object.keys(e).find(e=>e.toLowerCase()===n);return void 0===s||a.ReflectAdapter.deleteProperty(t,s)}})}static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"append":case"delete":case"set":return n.callable;default:return a.ReflectAdapter.get(e,t,r)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new s(e)}append(e,t){let r=this.headers[e];"string"==typeof r?this.headers[e]=[r,t]:Array.isArray(r)?r.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[r,a]of this.entries())e.call(t,a,r,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),r=this.get(t);yield[t,r]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{MutableRequestCookiesAdapter:function(){return l},ReadonlyRequestCookiesError:function(){return o},RequestCookiesAdapter:function(){return i},appendMutableCookies:function(){return c},getModifiedCookieValues:function(){return d}});let a=r(92044),n=r(38238),s=r(45869);class o extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new o}}class i{static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"clear":case"delete":case"set":return o.callable;default:return n.ReflectAdapter.get(e,t,r)}}})}}let u=Symbol.for("next.mutated.cookies");function d(e){let t=e[u];return t&&Array.isArray(t)&&0!==t.length?t:[]}function c(e,t){let r=d(t);if(0===r.length)return!1;let n=new a.ResponseCookies(e),s=n.getAll();for(let e of r)n.set(e);for(let e of s)n.set(e);return!0}class l{static wrap(e,t){let r=new a.ResponseCookies(new Headers);for(let t of e.getAll())r.set(t);let o=[],i=new Set,d=()=>{let e=s.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),o=r.getAll().filter(e=>i.has(e.name)),t){let e=[];for(let t of o){let r=new a.ResponseCookies(new Headers);r.set(t),e.push(r.toString())}t(e)}};return new Proxy(r,{get(e,t,r){switch(t){case u:return o;case"delete":return function(...t){i.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{d()}};case"set":return function(...t){i.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{d()}};default:return n.ReflectAdapter.get(e,t,r)}}})}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[8948,5972,5571],()=>r(96331));module.exports=a})();