"use strict";(()=>{var e={};e.id=9490,e.ids=[9490],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},35577:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>R,patchFetch:()=>h,requestAsyncStorage:()=>v,routeModule:()=>y,serverHooks:()=>E,staticGenerationAsyncStorage:()=>g});var a={};r.r(a),r.d(a,{GET:()=>_,POST:()=>f});var s=r(49303),n=r(88716),i=r(60670),o=r(87070),d=r(75571),l=r(95306),u=r(8261),c=r(53524);let p=e=>"number"==typeof e?e:Number(e??0);async function _(e){try{let t=await (0,d.getServerSession)(l.L);if(!t?.user?.id)return o.NextResponse.json({error:"Authentication required"},{status:401});let{searchParams:r}=new URL(e.url),a=r.get("period")||"7d",s=r.get("metric")||"all",n=r.get("userId"),i=new Date;switch(a){case"24h":i.setHours(i.getHours()-24);break;case"7d":default:i.setDate(i.getDate()-7);break;case"30d":i.setDate(i.getDate()-30);break;case"90d":i.setDate(i.getDate()-90)}let _={};if("engagement"===s||"all"===s){let e=await u._.$queryRaw`
        SELECT 
          user_id,
          DATE(created_at) as date,
          MIN(created_at) as session_start,
          MAX(created_at) as session_end,
          COUNT(*) as events,
          EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as session_duration
        FROM analytics_events 
        WHERE created_at >= ${i}
        AND user_id IS NOT NULL
        ${n?c.Prisma.sql`AND user_id = ${n}::uuid`:c.Prisma.sql``}
        GROUP BY user_id, DATE(created_at)
        HAVING EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) > 0
      `,t=await u._.$queryRaw`
        SELECT 
          event_data->>'label' as page,
          COUNT(*) as views
        FROM analytics_events
        WHERE created_at >= ${i}
        AND event_type = 'page_view'
        AND event_data->>'label' IS NOT NULL
        ${n?c.Prisma.sql`AND user_id = ${n}::uuid`:c.Prisma.sql``}
        GROUP BY event_data->>'label'
        ORDER BY views DESC
        LIMIT 10
      `,r=await u._.$queryRaw`
        SELECT 
          event_data->>'action' as action,
          COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${i}
        AND event_type IN ('click', 'scroll', 'form', 'download')
        ${n?c.Prisma.sql`AND user_id = ${n}::uuid`:c.Prisma.sql``}
        GROUP BY event_data->>'action'
        ORDER BY count DESC
      `,a=e.reduce((e,t)=>e+p(t.session_duration),0)/Math.max(1,e.length),s=e.reduce((e,t)=>e+p(t.events),0)/Math.max(1,e.length);_.engagement={avgSessionDuration:Math.round(a),avgEventsPerSession:Math.round(s),totalSessions:e.length,uniqueUsers:new Set(e.map(e=>e.user_id)).size,pageViews:t,interactions:r}}if("navigation"===s||"all"===s){let e=await u._.$queryRaw`
        SELECT 
          prev.event_data->>'label' as from_page,
          curr.event_data->>'label' as to_page,
          COUNT(*) as transitions
        FROM analytics_events prev
        JOIN analytics_events curr ON (
          curr.user_id = prev.user_id 
          AND curr.created_at > prev.created_at
          AND curr.created_at <= (prev.created_at + interval '30 minutes')
        )
        WHERE prev.created_at >= ${i}
        AND prev.event_type = 'page_view'
        AND curr.event_type = 'page_view'
        AND prev.event_data->>'label' IS NOT NULL
        AND curr.event_data->>'label' IS NOT NULL
        ${n?c.Prisma.sql`AND prev.user_id = ${n}::uuid`:c.Prisma.sql``}
        GROUP BY prev.event_data->>'label', curr.event_data->>'label'
        ORDER BY transitions DESC
        LIMIT 20
      `,t=await u._.$queryRaw`
        SELECT 
          page,
          COUNT(*) as entries
        FROM (
          SELECT 
            user_id,
            event_data->>'label' as page,
            ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at) as rn
          FROM analytics_events
          WHERE created_at >= ${i}
          AND event_type = 'page_view'
          AND event_data->>'label' IS NOT NULL
          ${n?c.Prisma.sql`AND user_id = ${n}::uuid`:c.Prisma.sql``}
        ) first_pages
        WHERE rn = 1
        GROUP BY page
        ORDER BY entries DESC
        LIMIT 10
      `,r=await u._.$queryRaw`
        SELECT 
          page,
          COUNT(*) as exits
        FROM (
          SELECT 
            user_id,
            event_data->>'label' as page,
            ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at DESC) as rn
          FROM analytics_events
          WHERE created_at >= ${i}
          AND event_type = 'page_view'
          AND event_data->>'label' IS NOT NULL
          ${n?c.Prisma.sql`AND user_id = ${n}::uuid`:c.Prisma.sql``}
        ) last_pages
        WHERE rn = 1
        GROUP BY page
        ORDER BY exits DESC
        LIMIT 10
      `;_.navigation={flow:e,entryPages:t,exitPages:r}}if("conversion"===s||"all"===s){let e=await Promise.all([{step:"visit",type:"page_view",action:null},{step:"signup",type:"auth",action:"signup"},{step:"project_create",type:"project",action:"create"},{step:"content_upload",type:"pptx",action:"upload"},{step:"video_render",type:"render",action:"start"}].map(async e=>{let t={createdAt:{gte:i},eventType:e.type,...n&&{userId:n}};e.action&&(t.eventData={path:["action"],equals:e.action});let r=await u._.analyticsEvent.count({where:t}),a=await u._.analyticsEvent.groupBy({by:["userId"],where:{...t,userId:{not:null}}});return{step:e.step,events:r,users:a.length}})),t=e.map((t,r)=>{if(0===r)return{...t,conversionRate:100};let a=e[r-1],s=a.users>0?(t.users/a.users*100).toFixed(1):"0";return{...t,conversionRate:parseFloat(s)}});_.conversion={funnel:t,totalConversions:e[e.length-1]?.users||0,overallConversionRate:e[0]?.users>0?((e[e.length-1]?.users||0)/e[0].users*100).toFixed(2):"0"}}if("retention"===s||"all"===s){let e=await u._.$queryRaw`
        SELECT 
          DATE(first_visit) as cohort_date,
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN days_since_first = 1 THEN user_id END) as day_1,
          COUNT(DISTINCT CASE WHEN days_since_first = 7 THEN user_id END) as day_7,
          COUNT(DISTINCT CASE WHEN days_since_first = 30 THEN user_id END) as day_30
        FROM (
          SELECT 
            user_id,
            MIN(DATE(created_at)) as first_visit,
            (DATE(created_at) - MIN(DATE(created_at)) OVER (PARTITION BY user_id)) as days_since_first
          FROM analytics_events
          WHERE created_at >= ${i}
          AND user_id IS NOT NULL
          ${n?c.Prisma.sql`AND user_id = ${n}::uuid`:c.Prisma.sql``}
          GROUP BY user_id, DATE(created_at)
        ) user_visits
        GROUP BY DATE(first_visit)
        ORDER BY cohort_date DESC
        LIMIT 30
      `,t=await u._.$queryRaw`
        SELECT 'daily' as period, COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at >= NOW() - interval '1 day' AND user_id IS NOT NULL
        UNION ALL
        SELECT 'weekly' as period, COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at >= NOW() - interval '7 days' AND user_id IS NOT NULL
        UNION ALL
        SELECT 'monthly' as period, COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at >= NOW() - interval '30 days' AND user_id IS NOT NULL
      `;_.retention={cohorts:e,activeUsers:t}}if("all"===s){let e=await u._.$queryRaw`
        SELECT 
          event_data->>'userAgent' as ua,
          COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${i}
        AND event_data->>'userAgent' IS NOT NULL
        ${n?c.Prisma.sql`AND user_id = ${n}::uuid`:c.Prisma.sql``}
        GROUP BY event_data->>'userAgent'
        ORDER BY count DESC
        LIMIT 100
      `,t={desktop:0,mobile:0,tablet:0},r=new Map,a=new Map;e.forEach(e=>{let s=e.ua.toLowerCase(),n=Number(e.count);s.includes("mobile")?t.mobile+=n:s.includes("tablet")?t.tablet+=n:t.desktop+=n;let i="Other";s.includes("chrome")?i="Chrome":s.includes("firefox")?i="Firefox":s.includes("safari")?i="Safari":s.includes("edge")&&(i="Edge"),r.set(i,(r.get(i)||0)+n);let o="Other";s.includes("windows")?o="Windows":s.includes("mac")?o="macOS":s.includes("linux")?o="Linux":s.includes("android")?o="Android":s.includes("ios")&&(o="iOS"),a.set(o,(a.get(o)||0)+n)}),_.demographics={devices:Object.entries(t).map(([e,t])=>({type:e,count:t})),browsers:Array.from(r.entries()).map(([e,t])=>({browser:e,count:t})),operatingSystems:Array.from(a.entries()).map(([e,t])=>({os:e,count:t}))}}return o.NextResponse.json({period:a,metric:s,userId:n,generatedAt:new Date().toISOString(),..._})}catch(e){return console.error("[Analytics User Behavior] Error:",e),o.NextResponse.json({error:"Failed to fetch user behavior metrics",details:e instanceof Error?e.message:"Unknown"},{status:500})}}async function f(e){try{let t=await (0,d.getServerSession)(l.L),{eventType:r,page:a,element:s,value:n,coordinates:i,scrollDepth:c,timeOnPage:p,sessionId:_,metadata:f}=await e.json();if(!r)return o.NextResponse.json({error:"eventType is required"},{status:400});let y=t?.user?.id||null;return await u._.analyticsEvent.create({data:{userId:y,eventType:"user_behavior",eventData:{action:r,label:a,value:n,element:s,coordinates:i,scrollDepth:c,timeOnPage:p,sessionId:_,userAgent:e.headers.get("user-agent"),ipAddress:e.headers.get("x-forwarded-for")||e.headers.get("x-real-ip"),referer:e.headers.get("referer"),...f}}}),o.NextResponse.json({success:!0})}catch(e){return console.error("[Analytics User Behavior POST] Error:",e),o.NextResponse.json({error:"Failed to record user behavior event"},{status:500})}}let y=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/analytics/user-behavior/route",pathname:"/api/analytics/user-behavior",filename:"route",bundlePath:"app/api/analytics/user-behavior/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\analytics\\user-behavior\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:v,staticGenerationAsyncStorage:g,serverHooks:E}=y,R="/api/analytics/user-behavior/route";function h(){return(0,i.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:g})}},95306:(e,t,r)=>{r.d(t,{L:()=>a});let a={providers:[],session:{strategy:"jwt"},callbacks:{}}},8261:(e,t,r)=>{r.d(t,{_:()=>s});var a=r(53524);let s=global.prisma||new a.PrismaClient({log:["error"]})},71615:(e,t,r)=>{r.r(t);var a=r(88757),s={};for(let e in a)"default"!==e&&(s[e]=()=>a[e]);r.d(t,s)},33085:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return n}});let a=r(45869),s=r(6278);class n{get isEnabled(){return this._provider.isEnabled}enable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,s.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,s.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{cookies:function(){return p},draftMode:function(){return _},headers:function(){return c}});let a=r(68996),s=r(53047),n=r(92044),i=r(72934),o=r(33085),d=r(6278),l=r(45869),u=r(54580);function c(){let e="headers",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return s.HeadersAdapter.seal(new Headers({}));(0,d.trackDynamicDataAccessed)(t,e)}return(0,u.getExpectedRequestStore)(e).headers}function p(){let e="cookies",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return a.RequestCookiesAdapter.seal(new n.RequestCookies(new Headers({})));(0,d.trackDynamicDataAccessed)(t,e)}let r=(0,u.getExpectedRequestStore)(e),s=i.actionAsyncStorage.getStore();return(null==s?void 0:s.isAction)||(null==s?void 0:s.isAppRoute)?r.mutableCookies:r.cookies}function _(){let e=(0,u.getExpectedRequestStore)("draftMode");return new o.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{HeadersAdapter:function(){return n},ReadonlyHeadersError:function(){return s}});let a=r(38238);class s extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new s}}class n extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,r,s){if("symbol"==typeof r)return a.ReflectAdapter.get(t,r,s);let n=r.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===n);if(void 0!==i)return a.ReflectAdapter.get(t,i,s)},set(t,r,s,n){if("symbol"==typeof r)return a.ReflectAdapter.set(t,r,s,n);let i=r.toLowerCase(),o=Object.keys(e).find(e=>e.toLowerCase()===i);return a.ReflectAdapter.set(t,o??r,s,n)},has(t,r){if("symbol"==typeof r)return a.ReflectAdapter.has(t,r);let s=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===s);return void 0!==n&&a.ReflectAdapter.has(t,n)},deleteProperty(t,r){if("symbol"==typeof r)return a.ReflectAdapter.deleteProperty(t,r);let s=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===s);return void 0===n||a.ReflectAdapter.deleteProperty(t,n)}})}static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"append":case"delete":case"set":return s.callable;default:return a.ReflectAdapter.get(e,t,r)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new n(e)}append(e,t){let r=this.headers[e];"string"==typeof r?this.headers[e]=[r,t]:Array.isArray(r)?r.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[r,a]of this.entries())e.call(t,a,r,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),r=this.get(t);yield[t,r]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{MutableRequestCookiesAdapter:function(){return c},ReadonlyRequestCookiesError:function(){return i},RequestCookiesAdapter:function(){return o},appendMutableCookies:function(){return u},getModifiedCookieValues:function(){return l}});let a=r(92044),s=r(38238),n=r(45869);class i extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new i}}class o{static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"clear":case"delete":case"set":return i.callable;default:return s.ReflectAdapter.get(e,t,r)}}})}}let d=Symbol.for("next.mutated.cookies");function l(e){let t=e[d];return t&&Array.isArray(t)&&0!==t.length?t:[]}function u(e,t){let r=l(t);if(0===r.length)return!1;let s=new a.ResponseCookies(e),n=s.getAll();for(let e of r)s.set(e);for(let e of n)s.set(e);return!0}class c{static wrap(e,t){let r=new a.ResponseCookies(new Headers);for(let t of e.getAll())r.set(t);let i=[],o=new Set,l=()=>{let e=n.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),i=r.getAll().filter(e=>o.has(e.name)),t){let e=[];for(let t of i){let r=new a.ResponseCookies(new Headers);r.set(t),e.push(r.toString())}t(e)}};return new Proxy(r,{get(e,t,r){switch(t){case d:return i;case"delete":return function(...t){o.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{l()}};case"set":return function(...t){o.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{l()}};default:return s.ReflectAdapter.get(e,t,r)}}})}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[8948,5972,5571],()=>r(35577));module.exports=a})();