"use strict";(()=>{var e={};e.id=8234,e.ids=[8234,3474],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},23195:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>E,patchFetch:()=>f,requestAsyncStorage:()=>b,routeModule:()=>w,serverHooks:()=>D,staticGenerationAsyncStorage:()=>x});var r={};a.r(r),a.d(r,{GET:()=>v,POST:()=>R});var n=a(49303),s=a(88716),o=a(60670),i=a(87070),d=a(75571),u=a(95306),l=a(55944),c=a(3474),p=a(46781);class g{async getScheduledReports(e){return(await c.prisma.analyticsEvent.findMany({where:{eventType:"report_schedule",...e&&{eventData:{path:["organizationId"],equals:e}}},orderBy:{createdAt:"desc"}})).map(e=>{let t=e.eventData;return{id:e.id,type:t.type||"performance",schedule:t.schedule||"daily",recipients:t.recipients||[],isActive:t.isActive??!0,lastRun:t.lastRun?new Date(t.lastRun):void 0,nextRun:t.nextRun?new Date(t.nextRun):void 0,organizationId:t.organizationId||void 0,createdAt:e.createdAt}})}async getSchedulerStats(){let e=await this.getScheduledReports(),t=await c.prisma.analyticsEvent.findMany({where:{eventType:"report_execution",createdAt:{gte:new Date(Date.now()-864e5)}},orderBy:{createdAt:"desc"},take:1}),a=await c.prisma.analyticsEvent.count({where:{eventType:"report_execution",eventData:{path:["status"],equals:"error"},createdAt:{gte:new Date(Date.now()-864e5)}}});return{totalScheduled:e.length,activeReports:e.filter(e=>e.isActive).length,lastExecution:t[0]?.createdAt,failedExecutions:a}}async runScheduledReports(){let e=(await this.getScheduledReports()).filter(e=>e.isActive),t=new p.y,a=0,r=0;for(let n of e)try{this.shouldRun(n)&&(await t.generateReport(n.type,n.organizationId),await this.updateReportData(n.id,{lastRun:new Date().toISOString(),nextRun:this.calculateNextRun(n.schedule).toISOString()}),await c.prisma.analyticsEvent.create({data:{eventType:"report_execution",eventData:{action:n.type,status:"success",label:`Executed ${n.type} report`,organizationId:n.organizationId,reportId:n.id}}}),a++)}catch(e){console.error(`Failed to run report ${n.id}:`,e),r++,await c.prisma.analyticsEvent.create({data:{eventType:"report_execution",eventData:{action:n.type,status:"error",label:"Failed execution",organizationId:n.organizationId,reportId:n.id,error:e instanceof Error?e.message:String(e)}}})}return{processed:a,errors:r}}async toggleReportStatus(e,t){await this.updateReportData(e,{isActive:t})}async deleteScheduledReport(e){await c.prisma.analyticsEvent.delete({where:{id:e}})}async updateReportData(e,t){let a=await c.prisma.analyticsEvent.findUnique({where:{id:e}});if(!a)return;let r=a.eventData||{};await c.prisma.analyticsEvent.update({where:{id:e},data:{eventData:{...r,...t}}})}shouldRun(e){return!e.nextRun||new Date>=e.nextRun}calculateNextRun(e){let t=new Date(new Date);switch(e){case"daily":t.setDate(t.getDate()+1),t.setHours(8,0,0,0);break;case"weekly":t.setDate(t.getDate()+7),t.setHours(8,0,0,0);break;case"monthly":t.setMonth(t.getMonth()+1),t.setDate(1),t.setHours(8,0,0,0);break;default:t.setDate(t.getDate()+1)}return t}}var m=a(20276);async function h(e){try{let t=await (0,d.getServerSession)(u.L);if(!t?.user?.id)return i.NextResponse.json({error:"Authentication required"},{status:401});let{searchParams:a}=new URL(e.url),r=a.get("action")||"list",n=(0,l.Uu)(t.user),s=new g;switch(r){case"list":let o=await s.getScheduledReports(n);return i.NextResponse.json({reports:o,total:o.length,active:o.filter(e=>e.isActive).length});case"stats":let c=await s.getSchedulerStats();return i.NextResponse.json(c);case"run":if(!(0,l.GJ)(t.user))return i.NextResponse.json({error:"Admin privileges required to run scheduler manually"},{status:403});let p=await s.runScheduledReports();return i.NextResponse.json({message:"Scheduler executed successfully",...p,executedAt:new Date});default:return i.NextResponse.json({error:"Invalid action. Must be list, stats, or run"},{status:400})}}catch(e){return console.error("[Analytics Reports Scheduler] Error:",e),i.NextResponse.json({error:"Failed to process scheduler request",message:e instanceof Error?e.message:String(e)},{status:500})}}async function y(e){try{let t=await (0,d.getServerSession)(u.L);if(!t?.user?.id)return i.NextResponse.json({error:"Authentication required"},{status:401});let{action:a,reportId:r,isActive:n}=await e.json();if(!a||!r)return i.NextResponse.json({error:"action and reportId are required"},{status:400});let s=new g;switch(a){case"toggle":if("boolean"!=typeof n)return i.NextResponse.json({error:"isActive must be a boolean"},{status:400});return await s.toggleReportStatus(r,n),i.NextResponse.json({success:!0,message:`Report ${n?"activated":"deactivated"} successfully`});case"delete":return await s.deleteScheduledReport(r),i.NextResponse.json({success:!0,message:"Scheduled report deleted successfully"});default:return i.NextResponse.json({error:"Invalid action. Must be toggle or delete"},{status:400})}}catch(e){return console.error("[Analytics Reports Scheduler POST] Error:",e),i.NextResponse.json({error:"Failed to manage scheduled report",message:e instanceof Error?e.message:String(e)},{status:500})}}let v=(0,m.wi)(h),R=(0,m.wi)(y),w=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/analytics/reports/scheduler/route",pathname:"/api/analytics/reports/scheduler",filename:"route",bundlePath:"app/api/analytics/reports/scheduler/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\analytics\\reports\\scheduler\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:b,staticGenerationAsyncStorage:x,serverHooks:D}=w,E="/api/analytics/reports/scheduler/route";function f(){return(0,o.patchFetch)({serverHooks:D,staticGenerationAsyncStorage:x})}},20276:(e,t,a)=>{a.d(t,{wi:()=>n});let r=[],n=function(e){return async t=>{let a=Date.now(),n=await e(t),s=Date.now()-a;return r.push({path:t.nextUrl.pathname,method:t.method,duration:s,statusCode:n.status,timestamp:new Date}),r.length>1e3&&r.shift(),n}}},46781:(e,t,a)=>{a.d(t,{y:()=>c});var r=a(8261),n=a(53524),s=a(64080),o=a(67965),i=a(45195),d=a(45883),u=a(96944),l=a(1377);class c{getDateRange(e,t=new Date){let a,r,n;switch(e){case"daily":a=(0,s.b)(t),r=(0,o.i)(t),n=t.toISOString().split("T")[0];break;case"weekly":a=(0,i.z)(t),r=(0,d.v)(t),n=`Week ${function(e){(e=new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate()))).setUTCDate(e.getUTCDate()+4-(e.getUTCDay()||7));let t=new Date(Date.UTC(e.getUTCFullYear(),0,1));return Math.ceil(((e.getTime()-t.getTime())/864e5+1)/7)}(t)} ${t.getFullYear()}`;break;case"monthly":a=(0,u.N)(t),r=(0,l.V)(t),n=`${t.toLocaleString("default",{month:"long"})} ${t.getFullYear()}`;break;default:a=(0,s.b)(t),r=(0,o.i)(t),n="Custom"}return{start:a,end:r,label:n}}async generateReport(e,t,a=new Date){let s=this.getDateRange(e,a),o=n.Prisma.sql`
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
    `,u=await r._.$queryRaw`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE ${o}
      AND event_data->>'status' = 'error'
    `,l=Number(i[0]?.count||0),c=Number(u[0]?.count||0),p=await r._.$queryRaw`
      SELECT 
        event_data->>'category' as category,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${o}
      GROUP BY event_data->>'category'
      ORDER BY count DESC
      LIMIT 10
    `,g=await r._.$queryRaw`
      SELECT 
        event_data->>'status' as status,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${o}
      GROUP BY event_data->>'status'
    `,m=await r._.$queryRaw`
      SELECT 
        event_data->>'action' as action,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${o}
      GROUP BY event_data->>'action'
      ORDER BY count DESC
      LIMIT 10
    `,h=await r._.$queryRaw`
      SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event_data->>'duration')::numeric) as p95
      FROM analytics_events
      WHERE ${o}
      AND event_data->>'duration' IS NOT NULL
    `,y=await r._.$queryRaw`
      SELECT 
        event_data->'metadata'->>'endpoint' as endpoint,
        AVG((event_data->>'duration')::numeric) as duration
      FROM analytics_events
      WHERE ${o}
      AND event_data->'metadata'->>'endpoint' IS NOT NULL
      GROUP BY event_data->'metadata'->>'endpoint'
      ORDER BY duration DESC
      LIMIT 5
    `;return{period:s,summary:{totalEvents:l,uniqueUsers:Number(d[0]?.count||0),avgDuration:Math.round(Number(i[0]?.avg_duration||0)),errorRate:l>0?c/l*100:0},breakdown:{byCategory:p.map(e=>({category:e.category||"unknown",count:Number(e.count)})),byStatus:g.map(e=>({status:e.status||"unknown",count:Number(e.count)})),topActions:m.map(e=>({action:e.action||"unknown",count:Number(e.count)}))},performance:{p95Duration:Math.round(Number(h[0]?.p95||0)),slowestEndpoints:y.map(e=>({endpoint:e.endpoint||"unknown",duration:Math.round(Number(e.duration))}))}}}async generateHTMLReport(e){let t=e.summary&&e.breakdown,a=`
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
      `}}},95306:(e,t,a)=>{a.d(t,{L:()=>r});let r={providers:[],session:{strategy:"jwt"},callbacks:{}}},55944:(e,t,a)=>{a.d(t,{Uu:()=>r,n5:()=>s,GJ:()=>n}),a(75571),a(95306),a(87070);let r=e=>e.currentOrgId||e.organizationId||void 0,n=e=>!0===e.isAdmin,s=e=>e.id},3474:(e,t,a)=>{a.d(t,{prisma:()=>n});var r=a(53524);let n=global.prisma||new r.PrismaClient({log:["query"]})},8261:(e,t,a)=>{a.d(t,{_:()=>n});var r=a(53524);let n=global.prisma||new r.PrismaClient({log:["error"]})}};var t=require("../../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[8948,5972,5571,7977],()=>a(23195));module.exports=r})();