"use strict";(()=>{var e={};e.id=5883,e.ids=[5883],e.modules={220399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},430517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},592048:e=>{e.exports=require("fs")},520629:e=>{e.exports=require("fs/promises")},346717:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>R,patchFetch:()=>h,requestAsyncStorage:()=>j,routeModule:()=>f,serverHooks:()=>w,staticGenerationAsyncStorage:()=>g});var o={};r.r(o),r.d(o,{DELETE:()=>m,GET:()=>_,PUT:()=>x});var a=r(349303),s=r(88716),i=r(60670),n=r(387070),p=r(691585),d=r(326033),l=r(520629),u=r(592048);let c=p.Ry({status:p.Km(["uploaded","processing","completed","failed"]).optional(),processing_progress:p.Rx().min(0).max(100).optional(),error_message:p.Z_().optional(),slides_data:p.IX(p.Ry({slide_number:p.Rx(),title:p.Z_(),content:p.Z_(),duration:p.Rx().positive(),transition_type:p.Z_().optional()})).optional()});async function _(e,{params:t}){try{let e=createClient(),{data:{user:r},error:o}=await e.auth.getUser();if(o||!r)return n.NextResponse.json({error:"N\xe3o autorizado"},{status:401});let a=t.id,{data:s,error:i}=await e.from("pptx_uploads").select(`
        *,
        projects:project_id (
          id,
          name,
          owner_id,
          collaborators,
          is_public
        ),
        pptx_slides:pptx_slides (
          id,
          slide_number,
          title,
          content,
          duration,
          transition_type,
          thumbnail_url,
          created_at
        )
      `).eq("id",a).single();if(i||!s)return n.NextResponse.json({error:"Upload n\xe3o encontrado"},{status:404});let p=s.projects;if(!(p.owner_id===r.id||p.collaborators?.includes(r.id)||p.is_public))return n.NextResponse.json({error:"Sem permiss\xe3o para acessar este upload"},{status:403});return await e.from("pptx_uploads").update({last_accessed_at:new Date().toISOString()}).eq("id",a),n.NextResponse.json({upload:s})}catch(e){return console.error("Erro ao buscar upload:",e),n.NextResponse.json({error:"Erro interno do servidor"},{status:500})}}async function x(e,{params:t}){try{let r=createClient(),{data:{user:o},error:a}=await r.auth.getUser();if(a||!o)return n.NextResponse.json({error:"N\xe3o autorizado"},{status:401});let s=t.id,i=await e.json(),p=c.parse(i),{data:d}=await r.from("pptx_uploads").select(`
        *,
        projects:project_id (
          owner_id,
          collaborators
        )
      `).eq("id",s).single();if(!d)return n.NextResponse.json({error:"Upload n\xe3o encontrado"},{status:404});let l=d.projects;if(!(l.owner_id===o.id||l.collaborators?.includes(o.id)))return n.NextResponse.json({error:"Sem permiss\xe3o para atualizar este upload"},{status:403});let u={...p,updated_at:new Date().toISOString()};"completed"===p.status&&"completed"!==d.status&&(u.processed_at=new Date().toISOString(),p.slides_data&&(u.slide_count=p.slides_data.length));let{data:_,error:x}=await r.from("pptx_uploads").update(u).eq("id",s).select().single();if(x)return console.error("Erro ao atualizar upload:",x),n.NextResponse.json({error:"Erro ao atualizar upload"},{status:500});return await r.from("project_history").insert({project_id:d.project_id,user_id:o.id,action:"update",entity_type:"pptx_upload",entity_id:s,description:`Status do upload PPTX atualizado para "${p.status||d.status}"`,changes:p}),n.NextResponse.json({upload:_})}catch(e){if(e instanceof d.jm)return n.NextResponse.json({error:"Dados inv\xe1lidos",details:e.errors},{status:400});return console.error("Erro ao atualizar upload:",e),n.NextResponse.json({error:"Erro interno do servidor"},{status:500})}}async function m(e,{params:t}){try{let e=createClient(),{data:{user:r},error:o}=await e.auth.getUser();if(o||!r)return n.NextResponse.json({error:"N\xe3o autorizado"},{status:401});let a=t.id,{data:s}=await e.from("pptx_uploads").select(`
        *,
        projects:project_id (
          owner_id,
          collaborators
        )
      `).eq("id",a).single();if(!s)return n.NextResponse.json({error:"Upload n\xe3o encontrado"},{status:404});let i=s.projects;if(!(i.owner_id===r.id||i.collaborators?.includes(r.id)))return n.NextResponse.json({error:"Sem permiss\xe3o para excluir este upload"},{status:403});await e.from("pptx_slides").delete().eq("upload_id",a);let{error:p}=await e.from("pptx_uploads").delete().eq("id",a);if(p)return console.error("Erro ao excluir upload:",p),n.NextResponse.json({error:"Erro ao excluir upload"},{status:500});try{s.file_path&&(0,u.existsSync)(s.file_path)&&await (0,l.unlink)(s.file_path)}catch(e){console.warn("Erro ao excluir arquivo f\xedsico:",e)}return await e.from("project_history").insert({project_id:s.project_id,user_id:r.id,action:"delete",entity_type:"pptx_upload",entity_id:a,description:`Upload PPTX "${s.original_filename}" exclu\xeddo`,changes:{deleted_upload:{filename:s.original_filename,size:s.file_size}}}),n.NextResponse.json({message:"Upload exclu\xeddo com sucesso"})}catch(e){return console.error("Erro ao excluir upload:",e),n.NextResponse.json({error:"Erro interno do servidor"},{status:500})}}let f=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/pptx/[id]/route",pathname:"/api/pptx/[id]",filename:"route",bundlePath:"app/api/pptx/[id]/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\pptx\\[id]\\route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:j,staticGenerationAsyncStorage:g,serverHooks:w}=f,R="/api/pptx/[id]/route";function h(){return(0,i.patchFetch)({serverHooks:w,staticGenerationAsyncStorage:g})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972,1585],()=>r(346717));module.exports=o})();