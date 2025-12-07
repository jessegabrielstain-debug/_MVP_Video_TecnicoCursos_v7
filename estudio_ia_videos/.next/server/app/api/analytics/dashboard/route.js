"use strict";(()=>{var e={};e.id=358,e.ids=[358,3474],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},24922:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>w,patchFetch:()=>R,requestAsyncStorage:()=>g,routeModule:()=>v,serverHooks:()=>_,staticGenerationAsyncStorage:()=>h});var r={};a.r(r),a.d(r,{GET:()=>m,dynamic:()=>f});var n=a(49303),s=a(88716),o=a(60670),i=a(87070),d=a(75571),u=a(95306),c=a(55944),l=a(3474),p=a(20276);let f="force-dynamic";async function y(e){try{let t=await (0,d.getServerSession)(u.L);if(!t?.user?.id)return i.NextResponse.json({error:"Authentication required"},{status:401});let{searchParams:a}=new URL(e.url),r=a.get("period")||"7d";a.get("organizationId")||(0,c.Uu)(t.user);let n=new Date;switch(r){case"7d":default:n.setDate(n.getDate()-7);break;case"30d":n.setDate(n.getDate()-30);break;case"90d":n.setDate(n.getDate()-90)}let s={createdAt:{gte:n}},[o,p,f,y,m,v,g,h,_,w]=await Promise.all([l.prisma.analyticsEvent.count({where:s}),l.prisma.analyticsEvent.count({where:{...s,createdAt:{gte:new Date(Date.now()-6048e5)}}}),l.prisma.analyticsEvent.count({where:{...s,eventData:{path:["status"],equals:"error"}}}),l.prisma.$queryRaw`
        SELECT event_data->>'category' as category, COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${n}
        GROUP BY event_data->>'category'
        ORDER BY count DESC
      `,l.prisma.$queryRaw`
        SELECT event_data->>'action' as action, COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${n}
        GROUP BY event_data->>'action'
        ORDER BY count DESC
      `,l.prisma.analyticsEvent.findMany({where:s,orderBy:{createdAt:"desc"},take:20,select:{id:!0,eventData:!0,createdAt:!0}}),l.prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as events,
          COUNT(CASE WHEN event_data->>'status' = 'error' THEN 1 END) as errors,
          COUNT(DISTINCT user_id) as users
        FROM analytics_events 
        WHERE created_at >= ${n}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,l.prisma.$queryRaw`
        SELECT 
          AVG((event_data->>'duration')::numeric) as avg_duration,
          MAX((event_data->>'duration')::numeric) as max_duration,
          MIN((event_data->>'duration')::numeric) as min_duration
        FROM analytics_events
        WHERE created_at >= ${n}
        AND event_data->>'duration' IS NOT NULL
      `,l.prisma.$queryRaw`
        SELECT event_type as type, COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${n}
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      `,l.prisma.project.count({where:{createdAt:{gte:n}}})]),R=v.map(e=>{let t=e.eventData||{};return{id:e.id,category:t.category,action:t.action,label:t.label,status:t.status,duration:t.duration,fileSize:t.fileSize,createdAt:e.createdAt}}),b=o>0?(f/o*100).toFixed(2):"0",E=y.map(e=>({category:e.category||"Unknown",count:Number(e.count)})),A=E.reduce((e,t)=>e+t.count,0),O=E.map(e=>({category:e.category,count:e.count,percentage:A>0?(e.count/A*100).toFixed(1):"0"})),C=m.map(e=>({action:e.action||"Unknown",count:Number(e.count)})),D=await l.prisma.analyticsEvent.groupBy({by:["userId"],where:{...s,userId:{not:null}},_count:{id:!0}}),S=(await l.prisma.$queryRaw`
        SELECT 
          event_data->'metadata'->>'endpoint' as endpoint,
          AVG((event_data->>'duration')::numeric) as avg_time,
          COUNT(*) as calls
        FROM analytics_events
        WHERE created_at >= ${n}
        AND event_data->'metadata'->>'endpoint' IS NOT NULL
        AND event_data->>'duration' IS NOT NULL
        GROUP BY event_data->'metadata'->>'endpoint'
        ORDER BY avg_time DESC
        LIMIT 5
      `).map(e=>({endpoint:e.endpoint||"Unknown",avgTime:Math.round(Number(e.avg_time)),calls:Number(e.calls)})),x=(await l.prisma.$queryRaw`
        SELECT 
          event_data->'metadata'->>'page' as page,
          COUNT(*) as views,
          AVG((event_data->>'duration')::numeric) as avg_time
        FROM analytics_events
        WHERE created_at >= ${n}
        AND event_data->>'action' = 'page_view'
        AND event_data->'metadata'->>'page' IS NOT NULL
        GROUP BY event_data->'metadata'->>'page'
        ORDER BY views DESC
        LIMIT 5
      `).map(e=>({page:e.page||"Unknown",views:Number(e.views),avgTimeOnPage:Math.round(Number(e.avg_time||0))})),N=(await l.prisma.$queryRaw`
        SELECT 
          event_data->'metadata'->>'deviceType' as type,
          COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${n}
        AND event_data->'metadata'->>'deviceType' IS NOT NULL
        GROUP BY event_data->'metadata'->>'deviceType'
        ORDER BY count DESC
      `).map(e=>({type:e.type||"Unknown",count:Number(e.count)})),T=(await l.prisma.$queryRaw`
        SELECT 
          event_data->'metadata'->>'browser' as browser,
          COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${n}
        AND event_data->'metadata'->>'browser' IS NOT NULL
        GROUP BY event_data->'metadata'->>'browser'
        ORDER BY count DESC
        LIMIT 5
      `).map(e=>({browser:e.browser||"Unknown",count:Number(e.count)})),k=h[0]||{avg_duration:0,max_duration:0,min_duration:0},M={overview:{totalEvents:o,eventsLast7Days:p,errorEvents:f,errorRate:b,activeUsers:D.length,avgSessionDuration:1800,conversionRate:w>0?(w/D.length*100).toFixed(1):"0",totalProjects:w},eventsByCategory:O,eventsByAction:C,timelineData:g.map(e=>({date:String(e.date),events:Number(e.events),errors:Number(e.errors),users:Number(e.users)})),performanceMetrics:{avgLoadTime:Math.round(Number(k.avg_duration||0)),avgRenderTime:Math.round(.7*Number(k.avg_duration||0)),avgProcessingTime:Math.round(1.2*Number(k.avg_duration||0)),slowestEndpoints:S},userBehavior:{topPages:x,deviceTypes:N,browserStats:T},recentEvents:R};return i.NextResponse.json(M)}catch(t){console.error("[Analytics Dashboard] Error:",t);let e=t instanceof Error?t.message:"Unknown error";return i.NextResponse.json({error:"Internal server error",message:e},{status:500})}}let m=(0,p.wi)(y),v=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/analytics/dashboard/route",pathname:"/api/analytics/dashboard",filename:"route",bundlePath:"app/api/analytics/dashboard/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\analytics\\dashboard\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:g,staticGenerationAsyncStorage:h,serverHooks:_}=v,w="/api/analytics/dashboard/route";function R(){return(0,o.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:h})}},20276:(e,t,a)=>{a.d(t,{wi:()=>n});let r=[],n=function(e){return async t=>{let a=Date.now(),n=await e(t),s=Date.now()-a;return r.push({path:t.nextUrl.pathname,method:t.method,duration:s,statusCode:n.status,timestamp:new Date}),r.length>1e3&&r.shift(),n}}},95306:(e,t,a)=>{a.d(t,{L:()=>r});let r={providers:[],session:{strategy:"jwt"},callbacks:{}}},55944:(e,t,a)=>{a.d(t,{Uu:()=>r,n5:()=>s,GJ:()=>n}),a(75571),a(95306),a(87070);let r=e=>e.currentOrgId||e.organizationId||void 0,n=e=>!0===e.isAdmin,s=e=>e.id},3474:(e,t,a)=>{a.d(t,{prisma:()=>n});var r=a(53524);let n=global.prisma||new r.PrismaClient({log:["query"]})},71615:(e,t,a)=>{a.r(t);var r=a(88757),n={};for(let e in r)"default"!==e&&(n[e]=()=>r[e]);a.d(t,n)},33085:(e,t,a)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return s}});let r=a(45869),n=a(6278);class s{get isEnabled(){return this._provider.isEnabled}enable(){let e=r.staticGenerationAsyncStorage.getStore();return e&&(0,n.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=r.staticGenerationAsyncStorage.getStore();return e&&(0,n.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,a)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var a in t)Object.defineProperty(e,a,{enumerable:!0,get:t[a]})}(t,{cookies:function(){return p},draftMode:function(){return f},headers:function(){return l}});let r=a(68996),n=a(53047),s=a(92044),o=a(72934),i=a(33085),d=a(6278),u=a(45869),c=a(54580);function l(){let e="headers",t=u.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return n.HeadersAdapter.seal(new Headers({}));(0,d.trackDynamicDataAccessed)(t,e)}return(0,c.getExpectedRequestStore)(e).headers}function p(){let e="cookies",t=u.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return r.RequestCookiesAdapter.seal(new s.RequestCookies(new Headers({})));(0,d.trackDynamicDataAccessed)(t,e)}let a=(0,c.getExpectedRequestStore)(e),n=o.actionAsyncStorage.getStore();return(null==n?void 0:n.isAction)||(null==n?void 0:n.isAppRoute)?a.mutableCookies:a.cookies}function f(){let e=(0,c.getExpectedRequestStore)("draftMode");return new i.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,a)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var a in t)Object.defineProperty(e,a,{enumerable:!0,get:t[a]})}(t,{HeadersAdapter:function(){return s},ReadonlyHeadersError:function(){return n}});let r=a(38238);class n extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new n}}class s extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,a,n){if("symbol"==typeof a)return r.ReflectAdapter.get(t,a,n);let s=a.toLowerCase(),o=Object.keys(e).find(e=>e.toLowerCase()===s);if(void 0!==o)return r.ReflectAdapter.get(t,o,n)},set(t,a,n,s){if("symbol"==typeof a)return r.ReflectAdapter.set(t,a,n,s);let o=a.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===o);return r.ReflectAdapter.set(t,i??a,n,s)},has(t,a){if("symbol"==typeof a)return r.ReflectAdapter.has(t,a);let n=a.toLowerCase(),s=Object.keys(e).find(e=>e.toLowerCase()===n);return void 0!==s&&r.ReflectAdapter.has(t,s)},deleteProperty(t,a){if("symbol"==typeof a)return r.ReflectAdapter.deleteProperty(t,a);let n=a.toLowerCase(),s=Object.keys(e).find(e=>e.toLowerCase()===n);return void 0===s||r.ReflectAdapter.deleteProperty(t,s)}})}static seal(e){return new Proxy(e,{get(e,t,a){switch(t){case"append":case"delete":case"set":return n.callable;default:return r.ReflectAdapter.get(e,t,a)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new s(e)}append(e,t){let a=this.headers[e];"string"==typeof a?this.headers[e]=[a,t]:Array.isArray(a)?a.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[a,r]of this.entries())e.call(t,r,a,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),a=this.get(t);yield[t,a]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,a)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var a in t)Object.defineProperty(e,a,{enumerable:!0,get:t[a]})}(t,{MutableRequestCookiesAdapter:function(){return l},ReadonlyRequestCookiesError:function(){return o},RequestCookiesAdapter:function(){return i},appendMutableCookies:function(){return c},getModifiedCookieValues:function(){return u}});let r=a(92044),n=a(38238),s=a(45869);class o extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new o}}class i{static seal(e){return new Proxy(e,{get(e,t,a){switch(t){case"clear":case"delete":case"set":return o.callable;default:return n.ReflectAdapter.get(e,t,a)}}})}}let d=Symbol.for("next.mutated.cookies");function u(e){let t=e[d];return t&&Array.isArray(t)&&0!==t.length?t:[]}function c(e,t){let a=u(t);if(0===a.length)return!1;let n=new r.ResponseCookies(e),s=n.getAll();for(let e of a)n.set(e);for(let e of s)n.set(e);return!0}class l{static wrap(e,t){let a=new r.ResponseCookies(new Headers);for(let t of e.getAll())a.set(t);let o=[],i=new Set,u=()=>{let e=s.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),o=a.getAll().filter(e=>i.has(e.name)),t){let e=[];for(let t of o){let a=new r.ResponseCookies(new Headers);a.set(t),e.push(a.toString())}t(e)}};return new Proxy(a,{get(e,t,a){switch(t){case d:return o;case"delete":return function(...t){i.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{u()}};case"set":return function(...t){i.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{u()}};default:return n.ReflectAdapter.get(e,t,a)}}})}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[8948,5972,5571],()=>a(24922));module.exports=r})();