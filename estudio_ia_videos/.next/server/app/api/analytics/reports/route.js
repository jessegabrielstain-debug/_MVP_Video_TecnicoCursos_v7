"use strict";(()=>{var e={};e.id=3118,e.ids=[3118],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},14982:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>T,patchFetch:()=>_,requestAsyncStorage:()=>D,routeModule:()=>b,serverHooks:()=>x,staticGenerationAsyncStorage:()=>E});var r={};a.r(r),a.d(r,{DELETE:()=>f,GET:()=>w,POST:()=>R});var n=a(49303),s=a(88716),o=a(60670),i=a(87070),d=a(75571),l=a(95306),u=a(55944),c=a(46781),p=a(20276),m=a(8261);async function y(e){try{let t=await (0,d.getServerSession)(l.L);if(!t?.user?.id)return i.NextResponse.json({error:"Authentication required"},{status:401});let{searchParams:a}=new URL(e.url),r=a.get("type"),n=a.get("format")||"json",s=a.get("date"),o="true"===a.get("generate"),p=(0,u.Uu)(t.user);if(!r){let e=await m._.analyticsEvent.findMany({where:{eventType:"report_generated",...p&&{eventData:{path:["organizationId"],equals:p}}},orderBy:{createdAt:"desc"},take:50,select:{id:!0,eventData:!0,createdAt:!0}});return i.NextResponse.json({reports:e.map(e=>{let t=e.eventData;return{id:e.id,type:t.action,period:t.label,generatedAt:e.createdAt,metadata:t}}),availableTypes:["daily","weekly","monthly"],availableFormats:["json","html","pdf"]})}if(!["daily","weekly","monthly"].includes(r))return i.NextResponse.json({error:"Invalid report type. Must be daily, weekly, or monthly"},{status:400});if(!["json","html","pdf"].includes(n))return i.NextResponse.json({error:"Invalid format. Must be json, html, or pdf"},{status:400});let y=s?new Date(s):new Date;if(isNaN(y.getTime()))return i.NextResponse.json({error:"Invalid date format"},{status:400});let g=new c.y;if(!o){let e=g.getDateRange(r,y).label,t=await m._.analyticsEvent.findFirst({where:{eventType:"report_generated",eventData:{path:["action"],equals:r},AND:{eventData:{path:["label"],equals:e}},...p&&{eventData:{path:["organizationId"],equals:p}}},orderBy:{createdAt:"desc"}});if(t&&t.eventData){let e=t.eventData;if("html"===n){let t=await g.generateHTMLReport(e);return new i.NextResponse(t,{headers:{"Content-Type":"text/html","Content-Disposition":`inline; filename="report-${r}-${y.toISOString().split("T")[0]}.html"`}})}if("pdf"===n){let t=await g.generateHTMLReport(e);return i.NextResponse.json({type:"pdf",htmlContent:t,filename:`report-${r}-${y.toISOString().split("T")[0]}.pdf`})}return i.NextResponse.json({...e,cached:!0,generatedAt:t.createdAt})}}let h=await g.generateReport(r,p,y);if(await m._.analyticsEvent.create({data:{userId:t.user.id,eventType:"report_generated",eventData:{organizationId:p||null,action:r,label:h.period.label,status:"success",...h}}}),"html"===n){let e=await g.generateHTMLReport(h);return new i.NextResponse(e,{headers:{"Content-Type":"text/html","Content-Disposition":`inline; filename="report-${r}-${y.toISOString().split("T")[0]}.html"`}})}if("pdf"===n){let e=await g.generateHTMLReport(h);return i.NextResponse.json({type:"pdf",htmlContent:e,filename:`report-${r}-${y.toISOString().split("T")[0]}.pdf`})}return i.NextResponse.json({...h,cached:!1,generatedAt:new Date})}catch(e){return console.error("[Analytics Reports] Error:",e),i.NextResponse.json({error:"Failed to generate report",message:e instanceof Error?e.message:String(e)},{status:500})}}async function g(e){try{let t=await (0,d.getServerSession)(l.L);if(!t?.user?.id)return i.NextResponse.json({error:"Authentication required"},{status:401});let{type:a,schedule:r,recipients:n,format:s="html",customFilters:o,autoGenerate:p=!1}=await e.json();if(!a||!["daily","weekly","monthly"].includes(a))return i.NextResponse.json({error:"Invalid or missing report type"},{status:400});if(r&&!["daily","weekly","monthly"].includes(r))return i.NextResponse.json({error:"Invalid schedule. Must be daily, weekly, or monthly"},{status:400});let y=(0,u.Uu)(t.user),g=new c.y;if(p){let e=await g.generateReport(a,y,new Date);return await m._.analyticsEvent.create({data:{userId:t.user.id,eventType:"report_scheduled",eventData:{organizationId:y||null,action:a,label:`Auto-report ${a}`,status:"success",schedule:r,recipients:n,format:s,customFilters:o,createdBy:t.user.id,createdAt:new Date().toISOString()}}}),i.NextResponse.json({success:!0,message:"Automatic report configured and generated",reportData:e,schedule:{type:r,nextRun:v(r||a)}})}return await m._.analyticsEvent.create({data:{userId:t.user.id,eventType:"report_scheduled",eventData:{organizationId:y||null,action:a,label:`Scheduled ${a} report`,status:"pending",schedule:r,recipients:n,format:s,customFilters:o,createdBy:t.user.id,createdAt:new Date().toISOString()}}}),i.NextResponse.json({success:!0,message:"Report scheduled successfully",schedule:{type:r||a,nextRun:v(r||a),recipients:n?.length||0,format:s}})}catch(e){return console.error("[Analytics Reports POST] Error:",e),i.NextResponse.json({error:"Failed to schedule report",message:e instanceof Error?e.message:String(e)},{status:500})}}async function h(e){try{let t=await (0,d.getServerSession)(l.L);if(!t?.user?.id)return i.NextResponse.json({error:"Authentication required"},{status:401});let{searchParams:a}=new URL(e.url),r=a.get("id"),n=a.get("type");if(!r&&!n)return i.NextResponse.json({error:"Report ID or type is required"},{status:400});let s=(0,u.Uu)(t.user);return r?await m._.analyticsEvent.deleteMany({where:{id:r,userId:t.user.id,...s&&{eventData:{path:["organizationId"],equals:s}}}}):n&&await m._.analyticsEvent.deleteMany({where:{eventType:"report_scheduled",userId:t.user.id,eventData:{path:["action"],equals:n},...s&&{eventData:{path:["organizationId"],equals:s}}}}),i.NextResponse.json({success:!0,message:"Report schedule removed successfully"})}catch(e){return console.error("[Analytics Reports DELETE] Error:",e),i.NextResponse.json({error:"Failed to remove report schedule",message:e instanceof Error?e.message:String(e)},{status:500})}}function v(e){let t=new Date;switch(e){case"daily":let a=new Date(t);return a.setDate(a.getDate()+1),a.setHours(8,0,0,0),a;case"weekly":let r=new Date(t);return r.setDate(r.getDate()+(7-r.getDay()+1)),r.setHours(8,0,0,0),r;case"monthly":let n=new Date(t);return n.setMonth(n.getMonth()+1),n.setDate(1),n.setHours(8,0,0,0),n;default:return new Date(t.getTime()+864e5)}}let w=(0,p.wi)(y),R=(0,p.wi)(g),f=(0,p.wi)(h),b=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/analytics/reports/route",pathname:"/api/analytics/reports",filename:"route",bundlePath:"app/api/analytics/reports/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\analytics\\reports\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:D,staticGenerationAsyncStorage:E,serverHooks:x}=b,T="/api/analytics/reports/route";function _(){return(0,o.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:E})}},20276:(e,t,a)=>{a.d(t,{wi:()=>n});let r=[],n=function(e){return async t=>{let a=Date.now(),n=await e(t),s=Date.now()-a;return r.push({path:t.nextUrl.pathname,method:t.method,duration:s,statusCode:n.status,timestamp:new Date}),r.length>1e3&&r.shift(),n}}},46781:(e,t,a)=>{a.d(t,{y:()=>c});var r=a(8261),n=a(53524),s=a(64080),o=a(67965),i=a(45195),d=a(45883),l=a(96944),u=a(1377);class c{getDateRange(e,t=new Date){let a,r,n;switch(e){case"daily":a=(0,s.b)(t),r=(0,o.i)(t),n=t.toISOString().split("T")[0];break;case"weekly":a=(0,i.z)(t),r=(0,d.v)(t),n=`Week ${function(e){(e=new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate()))).setUTCDate(e.getUTCDate()+4-(e.getUTCDay()||7));let t=new Date(Date.UTC(e.getUTCFullYear(),0,1));return Math.ceil(((e.getTime()-t.getTime())/864e5+1)/7)}(t)} ${t.getFullYear()}`;break;case"monthly":a=(0,l.N)(t),r=(0,u.V)(t),n=`${t.toLocaleString("default",{month:"long"})} ${t.getFullYear()}`;break;default:a=(0,s.b)(t),r=(0,o.i)(t),n="Custom"}return{start:a,end:r,label:n}}async generateReport(e,t,a=new Date){let s=this.getDateRange(e,a),o=n.Prisma.sql`
      created_at >= ${s.start} 
      AND created_at <= ${s.end}
      ${t?n.Prisma.sql`AND organization_id = ${t}`:n.Prisma.sql``}
    `,i=await r._.$queryRaw`
      SELECT 
        COUNT(*) as count,
        AVG((event_data->>'duration')::numeric) as avg_duration
      FROM analytics_events
      WHERE ${o}
    `,d=await r._.$queryRaw`
      SELECT COUNT(DISTINCT user_id) as count
      FROM analytics_events
      WHERE ${o}
    `,l=await r._.$queryRaw`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE ${o}
      AND event_data->>'status' = 'error'
    `,u=Number(i[0]?.count||0),c=Number(l[0]?.count||0),p=await r._.$queryRaw`
      SELECT 
        event_data->>'category' as category,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${o}
      GROUP BY event_data->>'category'
      ORDER BY count DESC
      LIMIT 10
    `,m=await r._.$queryRaw`
      SELECT 
        event_data->>'status' as status,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${o}
      GROUP BY event_data->>'status'
    `,y=await r._.$queryRaw`
      SELECT 
        event_data->>'action' as action,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${o}
      GROUP BY event_data->>'action'
      ORDER BY count DESC
      LIMIT 10
    `,g=await r._.$queryRaw`
      SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event_data->>'duration')::numeric) as p95
      FROM analytics_events
      WHERE ${o}
      AND event_data->>'duration' IS NOT NULL
    `,h=await r._.$queryRaw`
      SELECT 
        event_data->'metadata'->>'endpoint' as endpoint,
        AVG((event_data->>'duration')::numeric) as duration
      FROM analytics_events
      WHERE ${o}
      AND event_data->'metadata'->>'endpoint' IS NOT NULL
      GROUP BY event_data->'metadata'->>'endpoint'
      ORDER BY duration DESC
      LIMIT 5
    `;return{period:s,summary:{totalEvents:u,uniqueUsers:Number(d[0]?.count||0),avgDuration:Math.round(Number(i[0]?.avg_duration||0)),errorRate:u>0?c/u*100:0},breakdown:{byCategory:p.map(e=>({category:e.category||"unknown",count:Number(e.count)})),byStatus:m.map(e=>({status:e.status||"unknown",count:Number(e.count)})),topActions:y.map(e=>({action:e.action||"unknown",count:Number(e.count)}))},performance:{p95Duration:Math.round(Number(g[0]?.p95||0)),slowestEndpoints:h.map(e=>({endpoint:e.endpoint||"unknown",duration:Math.round(Number(e.duration))}))}}}async generateHTMLReport(e){let t=e.summary&&e.breakdown,a=`
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        h2 { color: #444; margin-top: 2rem; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
        .card { background: #f9fafb; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb; }
        .card-value { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
        .card-label { font-size: 0.875rem; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
        .footer { margin-top: 3rem; font-size: 0.875rem; color: #9ca3af; text-align: center; }
      </style>
    `;return t?`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report - ${e.period.label}</title>
        ${a}
      </head>
      <body>
        <h1>Analytics Report</h1>
        <p class="text-gray-500">Period: ${e.period.label} (${e.period.start.toLocaleDateString()} - ${e.period.end.toLocaleDateString()})</p>
        
        <div class="summary-grid">
          <div class="card">
            <div class="card-value">${e.summary.totalEvents.toLocaleString()}</div>
            <div class="card-label">Total Events</div>
          </div>
          <div class="card">
            <div class="card-value">${e.summary.uniqueUsers.toLocaleString()}</div>
            <div class="card-label">Unique Users</div>
          </div>
          <div class="card">
            <div class="card-value">${e.summary.avgDuration}ms</div>
            <div class="card-label">Avg Duration</div>
          </div>
          <div class="card">
            <div class="card-value">${e.summary.errorRate.toFixed(2)}%</div>
            <div class="card-label">Error Rate</div>
          </div>
        </div>

        <h2>Top Categories</h2>
        <table>
          <thead><tr><th>Category</th><th>Count</th></tr></thead>
          <tbody>
            ${e.breakdown.byCategory.map(e=>`<tr><td>${e.category}</td><td>${e.count.toLocaleString()}</td></tr>`).join("")}
          </tbody>
        </table>

        <h2>Top Actions</h2>
        <table>
          <thead><tr><th>Action</th><th>Count</th></tr></thead>
          <tbody>
            ${e.breakdown.topActions.map(e=>`<tr><td>${e.action}</td><td>${e.count.toLocaleString()}</td></tr>`).join("")}
          </tbody>
        </table>

        <h2>Performance Issues</h2>
        <p>P95 Duration: <strong>${e.performance.p95Duration}ms</strong></p>
        <table>
          <thead><tr><th>Endpoint</th><th>Avg Duration</th></tr></thead>
          <tbody>
            ${e.performance.slowestEndpoints.map(e=>`<tr><td>${e.endpoint}</td><td>${e.duration}ms</td></tr>`).join("")}
          </tbody>
        </table>

        <div class="footer">
          Generated by Estudio IA Videos Analytics • ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `:`
        <!DOCTYPE html>
        <html>
        <head><title>Analytics Report</title>${a}</head>
        <body>
          <h1>Analytics Report</h1>
          <p>Generated at: ${new Date().toLocaleString()}</p>
          <pre>${JSON.stringify(e,null,2)}</pre>
        </body>
        </html>
      `}}},95306:(e,t,a)=>{a.d(t,{L:()=>r});let r={providers:[],session:{strategy:"jwt"},callbacks:{}}},55944:(e,t,a)=>{a.d(t,{Uu:()=>r,n5:()=>s,GJ:()=>n}),a(75571),a(95306),a(87070);let r=e=>e.currentOrgId||e.organizationId||void 0,n=e=>!0===e.isAdmin,s=e=>e.id},8261:(e,t,a)=>{a.d(t,{_:()=>n});var r=a(53524);let n=global.prisma||new r.PrismaClient({log:["error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[8948,5972,5571,7977],()=>a(14982));module.exports=r})();