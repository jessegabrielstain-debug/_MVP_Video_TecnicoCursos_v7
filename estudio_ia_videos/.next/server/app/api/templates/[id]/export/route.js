"use strict";(()=>{var e={};e.id=7506,e.ids=[7506],e.modules={220399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},430517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},441780:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>g,patchFetch:()=>$,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>m,staticGenerationAsyncStorage:()=>l});var o={};a.r(o),a.d(o,{GET:()=>p});var n=a(349303),r=a(88716),s=a(60670),i=a(387070);let d=[];async function p(e,{params:t}){try{let a,o,n;let{id:r}=t,{searchParams:s}=new URL(e.url),p=s.get("format")||"json",u=d.find(e=>e.id===r);if(!u)return i.NextResponse.json({error:"Template n\xe3o encontrado",success:!1},{status:404});switch(u.downloads+=1,u.metadata.usage.downloads+=1,u.metadata.usage.lastUsed=new Date,p){case"json":a=JSON.stringify(u,null,2),o="application/json",n=`${u.name.replace(/[^a-zA-Z0-9]/g,"_")}.json`;break;case"xml":a=`<?xml version="1.0" encoding="UTF-8"?>
<template>
  <id>${u.id}</id>
  <name><![CDATA[${u.name}]]></name>
  <description><![CDATA[${u.description}]]></description>
  <category>${u.category}</category>
  <author><![CDATA[${u.author}]]></author>
  <version>${u.version}</version>
  <createdAt>${u.createdAt}</createdAt>
  <updatedAt>${u.updatedAt}</updatedAt>
  <downloads>${u.downloads}</downloads>
  <rating>${u.rating}</rating>
  <isCustom>${u.isCustom}</isCustom>
  <isFavorite>${u.isFavorite}</isFavorite>
  <tags>
    ${u.tags.map(e=>`<tag><![CDATA[${e}]]></tag>`).join("\n    ")}
  </tags>
  <content>
    <slides>
      ${u.content.slides.map(e=>`
      <slide>
        <id>${e.id}</id>
        <title><![CDATA[${e.title}]]></title>
        <content><![CDATA[${e.content}]]></content>
        <duration>${e.duration}</duration>
        <background>${e.background}</background>
      </slide>`).join("")}
    </slides>
    <settings>
      <resolution>
        <width>${u.content.settings.resolution.width}</width>
        <height>${u.content.settings.resolution.height}</height>
      </resolution>
      <frameRate>${u.content.settings.frameRate}</frameRate>
      <duration>${u.content.settings.duration}</duration>
    </settings>
  </content>
</template>`,o="application/xml",n=`${u.name.replace(/[^a-zA-Z0-9]/g,"_")}.xml`;break;case"zip":a=JSON.stringify({template:u,assets:[],metadata:{exportedAt:new Date().toISOString(),version:"1.0.0",format:"zip"}},null,2),o="application/zip",n=`${u.name.replace(/[^a-zA-Z0-9]/g,"_")}.zip`;break;default:return i.NextResponse.json({error:"Formato n\xe3o suportado",success:!1},{status:400})}return new i.NextResponse(a,{status:200,headers:{"Content-Type":o,"Content-Disposition":`attachment; filename="${n}"`,"Cache-Control":"no-cache"}})}catch(e){return console.error("Erro ao exportar template:",e),i.NextResponse.json({error:"Erro interno do servidor",success:!1},{status:500})}}let u=new n.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/templates/[id]/export/route",pathname:"/api/templates/[id]/export",filename:"route",bundlePath:"app/api/templates/[id]/export/route"},resolvedPagePath:"C:\\xampp\\htdocs\\_MVP_Video_TecnicoCursos_v7\\estudio_ia_videos\\app\\api\\templates\\[id]\\export\\route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:c,staticGenerationAsyncStorage:l,serverHooks:m}=u,g="/api/templates/[id]/export/route";function $(){return(0,s.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:l})}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),o=t.X(0,[8948,5972],()=>a(441780));module.exports=o})();