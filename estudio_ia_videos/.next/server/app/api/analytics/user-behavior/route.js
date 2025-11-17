"use strict";(()=>{var e={};e.id=9490,e.ids=[9490,3474],e.modules={453524:e=>{e.exports=require("@prisma/client")},572934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},554580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},345869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},220399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},430517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},627790:e=>{e.exports=require("assert")},978893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},532615:e=>{e.exports=require("http")},735240:e=>{e.exports=require("https")},986624:e=>{e.exports=require("querystring")},917360:e=>{e.exports=require("url")},521764:e=>{e.exports=require("util")},671568:e=>{e.exports=require("zlib")},935577:(e,r,a)=>{a.r(r),a.d(r,{originalPathname:()=>O,patchFetch:()=>T,requestAsyncStorage:()=>y,routeModule:()=>g,serverHooks:()=>v,staticGenerationAsyncStorage:()=>m});var t={};a.r(t),a.d(t,{GET:()=>E,POST:()=>N});var s=a(349303),i=a(88716),n=a(60670),o=a(387070),u=a(95715),c=a(491284),d=a(303474);(function(){var e=Error("Cannot find module '@/lib/auth/auth-config'");throw e.code="MODULE_NOT_FOUND",e})(),function(){var e=Error("Cannot find module '@/lib/analytics/api-performance-middleware'");throw e.code="MODULE_NOT_FOUND",e}();let l=e=>"number"==typeof e?e:Number(e??0);async function p(e){try{let r=await (0,u.getServerSession)(Object(function(){var e=Error("Cannot find module '@/lib/auth/auth-config'");throw e.code="MODULE_NOT_FOUND",e}()));if(!r?.user?.id)return o.NextResponse.json({error:"Authentication required"},{status:401});let{searchParams:a}=new URL(e.url),t=a.get("period")||"7d",s=a.get("metric")||"all",i=a.get("userId"),n=(0,c.Uu)(r.user),p=new Date;switch(t){case"24h":p.setHours(p.getHours()-24);break;case"7d":default:p.setDate(p.getDate()-7);break;case"30d":p.setDate(p.getDate()-30);break;case"90d":p.setDate(p.getDate()-90)}let _={createdAt:{gte:p},...n&&{organizationId:n},...i&&{userId:i}},E={};if("engagement"===s||"all"===s){let e=await d.prisma.$queryRaw`
        SELECT 
          user_id,
          DATE(created_at) as date,
          MIN(created_at) as session_start,
          MAX(created_at) as session_end,
          COUNT(*) as events,
          TIMESTAMPDIFF(SECOND, MIN(created_at), MAX(created_at)) as session_duration
        FROM analytics_event 
        WHERE created_at >= ${p}
        AND user_id IS NOT NULL
        ${n?d.prisma.$queryRaw`AND organization_id = ${n}`:d.prisma.$queryRaw``}
        ${i?d.prisma.$queryRaw`AND user_id = ${i}`:d.prisma.$queryRaw``}
        GROUP BY user_id, DATE(created_at)
        HAVING session_duration > 0
      `,r=await d.prisma.analyticsEvent.groupBy({by:["label"],where:{..._,category:"page_view",label:{not:null}},_count:{id:!0},orderBy:{_count:{id:"desc"}},take:10}),a=await d.prisma.analyticsEvent.groupBy({by:["action"],where:{..._,category:{in:["click","scroll","form","download"]}},_count:{id:!0},orderBy:{_count:{id:"desc"}}}),t=e.reduce((e,r)=>e+l(r.session_duration),0)/Math.max(1,e.length),s=e.reduce((e,r)=>e+l(r.events),0)/Math.max(1,e.length);E.engagement={avgSessionDuration:Math.round(t),avgEventsPerSession:Math.round(s),totalSessions:e.length,uniqueUsers:new Set(e.map(e=>String(e.user_id))).size,pageViews:r.map(e=>({page:e.label,views:e._count.id})),interactions:a.map(e=>({action:e.action,count:e._count.id}))}}if("navigation"===s||"all"===s){let e=await d.prisma.$queryRaw`
        SELECT 
          prev.label as from_page,
          curr.label as to_page,
          COUNT(*) as transitions
        FROM analytics_event prev
        JOIN analytics_event curr ON (
          curr.user_id = prev.user_id 
          AND curr.created_at > prev.created_at
          AND curr.created_at <= DATE_ADD(prev.created_at, INTERVAL 30 MINUTE)
        )
        WHERE prev.created_at >= ${p}
        AND prev.category = 'page_view'
        AND curr.category = 'page_view'
        AND prev.label IS NOT NULL
        AND curr.label IS NOT NULL
        ${n?d.prisma.$queryRaw`AND prev.organization_id = ${n}`:d.prisma.$queryRaw``}
        GROUP BY prev.label, curr.label
        ORDER BY transitions DESC
        LIMIT 20
      `,r=await d.prisma.$queryRaw`
        SELECT 
          label as page,
          COUNT(*) as entries
        FROM (
          SELECT 
            user_id,
            label,
            ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at) as rn
          FROM analytics_event
          WHERE created_at >= ${p}
          AND category = 'page_view'
          AND label IS NOT NULL
          ${n?d.prisma.$queryRaw`AND organization_id = ${n}`:d.prisma.$queryRaw``}
        ) first_pages
        WHERE rn = 1
        GROUP BY label
        ORDER BY entries DESC
        LIMIT 10
      `,a=await d.prisma.$queryRaw`
        SELECT 
          label as page,
          COUNT(*) as exits
        FROM (
          SELECT 
            user_id,
            label,
            ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at DESC) as rn
          FROM analytics_event
          WHERE created_at >= ${p}
          AND category = 'page_view'
          AND label IS NOT NULL
          ${n?d.prisma.$queryRaw`AND organization_id = ${n}`:d.prisma.$queryRaw``}
        ) last_pages
        WHERE rn = 1
        GROUP BY label
        ORDER BY exits DESC
        LIMIT 10
      `;E.navigation={flow:e,entryPages:r,exitPages:a}}if("conversion"===s||"all"===s){let e=await Promise.all([{step:"visit",category:"page_view",action:null},{step:"signup",category:"auth",action:"signup"},{step:"project_create",category:"project",action:"create"},{step:"content_upload",category:"pptx",action:"upload"},{step:"video_render",category:"render",action:"start"}].map(async e=>{let r=await d.prisma.analyticsEvent.count({where:{..._,category:e.category,...e.action&&{action:e.action}}}),a=await d.prisma.analyticsEvent.groupBy({by:["userId"],where:{..._,category:e.category,...e.action&&{action:e.action},userId:{not:null}}});return{step:e.step,events:r,users:a.length}})),r=e.map((r,a)=>{if(0===a)return{...r,conversionRate:100};let t=e[a-1],s=t.users>0?(r.users/t.users*100).toFixed(1):"0";return{...r,conversionRate:parseFloat(s)}});E.conversion={funnel:r,totalConversions:e[e.length-1]?.users||0,overallConversionRate:e[0]?.users>0?((e[e.length-1]?.users||0)/e[0].users*100).toFixed(2):"0"}}if("retention"===s||"all"===s){let e=await d.prisma.$queryRaw`
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
            DATEDIFF(DATE(created_at), MIN(DATE(created_at)) OVER (PARTITION BY user_id)) as days_since_first
          FROM analytics_event
          WHERE created_at >= ${p}
          AND user_id IS NOT NULL
          ${n?d.prisma.$queryRaw`AND organization_id = ${n}`:d.prisma.$queryRaw``}
          GROUP BY user_id, DATE(created_at)
        ) user_visits
        GROUP BY DATE(first_visit)
        ORDER BY cohort_date DESC
        LIMIT 30
      `,r=await d.prisma.$queryRaw`
        SELECT 
          'daily' as period,
          COUNT(DISTINCT user_id) as count
        FROM analytics_event
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        AND user_id IS NOT NULL
        ${n?d.prisma.$queryRaw`AND organization_id = ${n}`:d.prisma.$queryRaw``}
        
        UNION ALL
        
        SELECT 
          'weekly' as period,
          COUNT(DISTINCT user_id) as count
        FROM analytics_event
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND user_id IS NOT NULL
        ${n?d.prisma.$queryRaw`AND organization_id = ${n}`:d.prisma.$queryRaw``}
        
        UNION ALL
        
        SELECT 
          'monthly' as period,
          COUNT(DISTINCT user_id) as count
        FROM analytics_event
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND user_id IS NOT NULL
        ${n?d.prisma.$queryRaw`AND organization_id = ${n}`:d.prisma.$queryRaw``}
      `;E.retention={cohorts:e,activeUsers:r}}if("all"===s){let e=await d.prisma.analyticsEvent.groupBy({by:["metadata"],where:_,_count:{id:!0},orderBy:{_count:{id:"desc"}},take:100}),r={desktop:0,mobile:0,tablet:0},a=new Map,t=new Map;e.forEach(e=>{let s=e.metadata,i=s&&"object"==typeof s&&"userAgent"in s?s.userAgent:void 0;if("string"==typeof i&&i.length>0){let s=i.toLowerCase();s.includes("mobile")?r.mobile+=e._count.id:s.includes("tablet")?r.tablet+=e._count.id:r.desktop+=e._count.id;let n="Other";s.includes("chrome")?n="Chrome":s.includes("firefox")?n="Firefox":s.includes("safari")?n="Safari":s.includes("edge")&&(n="Edge"),a.set(n,(a.get(n)||0)+e._count.id);let o="Other";s.includes("windows")?o="Windows":s.includes("mac")?o="macOS":s.includes("linux")?o="Linux":s.includes("android")?o="Android":s.includes("ios")&&(o="iOS"),t.set(o,(t.get(o)||0)+e._count.id)}}),E.demographics={devices:Object.entries(r).map(([e,r])=>({type:e,count:r})),browsers:Array.from(a.entries()).map(([e,r])=>({browser:e,count:r})),operatingSystems:Array.from(t.entries()).map(([e,r])=>({os:e,count:r}))}}return o.NextResponse.json({period:t,metric:s,userId:i,generatedAt:new Date().toISOString(),...E})}catch(r){console.error("[Analytics User Behavior] Error:",r);let e=r instanceof Error?r.message:"Unknown error";return o.NextResponse.json({error:"Failed to fetch user behavior metrics",message:e},{status:500})}}async function _(e){try{let r=await (0,u.getServerSession)(Object(function(){var e=Error("Cannot find module '@/lib/auth/auth-config'");throw e.code="MODULE_NOT_FOUND",e}())),{eventType:a,page:t,element:s,value:i,coordinates:n,scrollDepth:l,timeOnPage:p,sessionId:_,metadata:E}=await e.json();if(!a)return o.NextResponse.json({error:"eventType is required"},{status:400});let N=r?.user?.id||null,g=(r?.user?(0,c.Uu)(r.user):void 0)||null;return await d.prisma.analyticsEvent.create({data:{organizationId:g,userId:N,category:"user_behavior",action:a,label:t,metadata:{value:i,element:s,coordinates:n,scrollDepth:l,timeOnPage:p,sessionId:_,userAgent:e.headers.get("user-agent"),ipAddress:e.headers.get("x-forwarded-for")||e.headers.get("x-real-ip"),referer:e.headers.get("referer"),...E}}}),o.NextResponse.json({success:!0,message:"User behavior event recorded"})}catch(r){console.error("[Analytics User Behavior POST] Error:",r);let e=r instanceof Error?r.message:"Unknown error";return o.NextResponse.json({error:"Failed to record user behavior event",message:e},{status:500})}}let E=Object(function(){var e=Error("Cannot find module '@/lib/analytics/api-performance-middleware'");throw e.code="MODULE_NOT_FOUND",e}())(p),N=Object(function(){var e=Error("Cannot find module '@/lib/analytics/api-performance-middleware'");throw e.code="MODULE_NOT_FOUND",e}())(_),g=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/analytics/user-behavior/route",pathname:"/api/analytics/user-behavior",filename:"route",bundlePath:"app/api/analytics/user-behavior/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\analytics\\user-behavior\\route.ts",nextConfigOutput:"",userland:t}),{requestAsyncStorage:y,staticGenerationAsyncStorage:m,serverHooks:v}=g,O="/api/analytics/user-behavior/route";function T(){return(0,n.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:m})}},491284:(e,r,a)=>{a.d(r,{Uu:()=>t,n5:()=>s});let t=e=>e.currentOrgId||e.organizationId||void 0,s=e=>e.id||""},303474:(e,r,a)=>{a.d(r,{prisma:()=>s});var t=a(453524);let s=global.prisma||new t.PrismaClient({log:["query"]})}};var r=require("../../../../webpack-runtime.js");r.C(e);var a=e=>r(r.s=e),t=r.X(0,[8948,5972,5715],()=>a(935577));module.exports=t})();