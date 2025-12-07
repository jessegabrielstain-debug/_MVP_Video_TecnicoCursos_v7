
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** _MVP_Video_TecnicoCursos_v7
- **Date:** 2025-12-02
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** User Login with Email
- **Test Code:** [TC001_User_Login_with_Email.py](./TC001_User_Login_with_Email.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/8eb5de23-6454-4105-9922-c9359e2ad28e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** User Login with Social Providers
- **Test Code:** [TC002_User_Login_with_Social_Providers.py](./TC002_User_Login_with_Social_Providers.py)
- **Test Error:** Tested successful login with Admin quick login button and verified redirection to dashboard. Unable to test other quick login buttons due to navigation issues. No visible social login buttons found. Reporting issue and stopping further actions.
Browser Console Logs:
[WARNING] 🚨 EMERGENCY: Long loading state detected, breaking animation (at webpack-internal:///(app-pages-browser)/./app/lib/emergency-fixes.ts:138:20)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/c43fba96-7d29-4dcf-b51a-d9683c12b0b3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** RBAC Enforcement on Dashboard Access
- **Test Code:** [TC003_RBAC_Enforcement_on_Dashboard_Access.py](./TC003_RBAC_Enforcement_on_Dashboard_Access.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/1aad5835-f6ca-4c8b-92b9-e67817e12909
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** PPTX Upload and Parsing Valid File
- **Test Code:** [TC004_PPTX_Upload_and_Parsing_Valid_File.py](./TC004_PPTX_Upload_and_Parsing_Valid_File.py)
- **Test Error:** Stopped testing due to inability to create a new project. The 'Create New Project' modal does not close after clicking 'Create Project', blocking further progress. Reported the issue for developer investigation.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://ofhzrdiadxigrvmrhaiz.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Login error: AuthApiError: Invalid login credentials
    at handleError (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:80:11)
    at async _handleRequest (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:123:9)
    at async _request (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:105:18)
    at async SupabaseAuthClient.signInWithPassword (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:394:23)
    at async onSubmit (webpack-internal:///(app-pages-browser)/./app/components/auth/login-form.tsx:118:44)
    at async eval (webpack-internal:///(app-pages-browser)/../node_modules/react-hook-form/dist/index.esm.mjs:2142:17) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[WARNING] 🚨 EMERGENCY: Long loading state detected, breaking animation (at webpack-internal:///(app-pages-browser)/./app/lib/emergency-fixes.ts:138:20)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/2f543b51-0ff5-410c-a176-becff18899a6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** PPTX Upload of Invalid or Corrupted File
- **Test Code:** [TC005_PPTX_Upload_of_Invalid_or_Corrupted_File.py](./TC005_PPTX_Upload_of_Invalid_or_Corrupted_File.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/66d9925b-c8b1-40f9-b068-6948a7765133
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** Video Slide Editing and Persistence
- **Test Code:** [TC006_Video_Slide_Editing_and_Persistence.py](./TC006_Video_Slide_Editing_and_Persistence.py)
- **Test Error:** The task to verify slide editing with drag-and-drop and persistence cannot proceed because the application does not provide access to existing projects with multiple slides. The 'Novo Projeto' button does not open project creation or project list as expected. No alternative navigation options were found. Task stopped due to this critical issue.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/cabaf665-b5a2-44a4-a0d4-75d2a6cda628
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** TTS Voice Selection and Audio Preview
- **Test Code:** [TC007_TTS_Voice_Selection_and_Audio_Preview.py](./TC007_TTS_Voice_Selection_and_Audio_Preview.py)
- **Test Error:** Reported the missing TTS provider selection and audio preview UI elements as a critical issue. Stopping further testing as the core functionality is not accessible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/257e5a58-9a5b-4407-a90f-45fd4454c0c7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** Video Rendering Pipeline Success Flow
- **Test Code:** [TC008_Video_Rendering_Pipeline_Success_Flow.py](./TC008_Video_Rendering_Pipeline_Success_Flow.py)
- **Test Error:** Testing stopped due to persistent ChunkLoadError preventing access to the video editor interface. Unable to verify video rendering job queueing, progress updates, and output files. Issue reported for developer attention.
Browser Console Logs:
[WARNING] 🚨 EMERGENCY: Long loading state detected, breaking animation (at webpack-internal:///(app-pages-browser)/./app/lib/emergency-fixes.ts:138:20)
[WARNING] 🚨 EMERGENCY: Long loading state detected, breaking animation (at webpack-internal:///(app-pages-browser)/./app/lib/emergency-fixes.ts:138:20)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/_next/undefined:0:0)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[ERROR] Application Error: ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Application Error: ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
[WARNING] 🚨 EMERGENCY: Global error caught ChunkLoadError: Loading chunk _app-pages-browser_app_components_canvas-editor-pro_professional-canvas-editor-v3_tsx failed.
(error: http://localhost:3000/_next/undefined)
    at __webpack_require__.f.j (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:852:29)
    at http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:155:40
    at Array.reduce (<anonymous>)
    at __webpack_require__.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:154:67)
    at fn.e (http://localhost:3000/_next/static/chunks/webpack.js?v=1764675152672:391:50)
    at ProfessionalCanvasEditorV3.loadableGenerated.modules [as loader] (webpack-internal:///(app-pages-browser)/./app/editor-canvas/page.tsx:14:117)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40:58)
    at lazyInitializer (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react/cjs/react.development.js:2172:20)
    at mountLazyComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:16750:19)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18464:16)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:26927:14)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25748:12)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25464:5)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:25419:7)
    at performConcurrentWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:24504:74)
    at workLoop (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:256:34)
    at flushWork (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:225:14)
    at MessagePort.performWorkUntilDeadline (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js:534:21) (at webpack-internal:///(app-pages-browser)/./app/components/providers/production-provider.tsx:24:20)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/a0a826b8-797b-4910-8bd0-d27d54a18134
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Video Rendering Job Cancellation
- **Test Code:** [TC009_Video_Rendering_Job_Cancellation.py](./TC009_Video_Rendering_Job_Cancellation.py)
- **Test Error:** Test stopped due to inability to create a new project and start rendering job. The modal remains open after clicking 'Create Project', blocking further testing of rendering job cancellation.
Browser Console Logs:
[WARNING] 🚨 EMERGENCY: Long loading state detected, breaking animation (at webpack-internal:///(app-pages-browser)/./app/lib/emergency-fixes.ts:138:20)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/4cba1583-a5c5-4efd-aecf-6f89bb91576d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** User Project Management Workflow
- **Test Code:** [TC010_User_Project_Management_Workflow.py](./TC010_User_Project_Management_Workflow.py)
- **Test Error:** The workflow for creating, editing, duplicating, sharing, and deleting video projects cannot be fully tested because the critical step of uploading a PPTX file is inaccessible due to a broken navigation link leading to a 404 error page. The issue has been reported. Task stopped.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/register?_rsc=10zhu:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/register:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/d6d9acb2-43c7-497d-980a-3809292cda90
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** Compliance Template Application and Validation
- **Test Code:** [TC011_Compliance_Template_Application_and_Validation.py](./TC011_Compliance_Template_Application_and_Validation.py)
- **Test Error:** Testing stopped due to critical UI bug preventing template selection and workflow initiation for NR compliance templates. Issue reported to development team.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/86c97948-80f5-4e26-86a9-6775e2b6362f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** Analytics and Metrics Data Accuracy
- **Test Code:** [TC012_Analytics_and_Metrics_Data_Accuracy.py](./TC012_Analytics_and_Metrics_Data_Accuracy.py)
- **Test Error:** Reported the project creation failure issue. Stopping all further testing as the critical step of project creation is not functioning, preventing accurate analytics verification.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/d51bd420-c18d-41d8-8b38-bd10de7606f0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** System Availability and Recovery
- **Test Code:** [TC013_System_Availability_and_Recovery.py](./TC013_System_Availability_and_Recovery.py)
- **Test Error:** Reported the issue with the tutorial popup blocking failure simulation controls on the system control dashboard. Stopping further actions as the task cannot proceed without resolving this issue.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/ef4eff96-5c97-4d0b-908a-6a5cd3060b64
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** Security: Input Validation and Rate Limiting
- **Test Code:** [TC014_Security_Input_Validation_and_Rate_Limiting.py](./TC014_Security_Input_Validation_and_Rate_Limiting.py)
- **Test Error:** Testing of user input validation and sanitization on the login form was successful. However, the account creation or registration form is not accessible from the UI, blocking further testing. Rate limiting tests on APIs could not be performed. Please address the missing navigation to enable full testing coverage.
Browser Console Logs:
[WARNING] 🚨 EMERGENCY: Long loading state detected, breaking animation (at webpack-internal:///(app-pages-browser)/./app/lib/emergency-fixes.ts:138:20)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://ofhzrdiadxigrvmrhaiz.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Login error: AuthApiError: Invalid login credentials
    at handleError (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:80:11)
    at async _handleRequest (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:123:9)
    at async _request (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:105:18)
    at async SupabaseAuthClient.signInWithPassword (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:394:23)
    at async onSubmit (webpack-internal:///(app-pages-browser)/./app/components/auth/login-form.tsx:118:44)
    at async eval (webpack-internal:///(app-pages-browser)/../node_modules/react-hook-form/dist/index.esm.mjs:2142:17) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/e963855e-e302-49ed-84e2-34fb0f72745b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** Security: Enforce JWT and RLS Policies
- **Test Code:** [TC015_Security_Enforce_JWT_and_RLS_Policies.py](./TC015_Security_Enforce_JWT_and_RLS_Policies.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/40aa557d-7338-4d49-9457-e98400d819a0
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016
- **Test Name:** Rendering Pipeline Multi-User Concurrent Job Handling
- **Test Code:** [TC016_Rendering_Pipeline_Multi_User_Concurrent_Job_Handling.py](./TC016_Rendering_Pipeline_Multi_User_Concurrent_Job_Handling.py)
- **Test Error:** Stopped testing due to critical issue: unable to create new projects to initiate rendering jobs. The rendering queue concurrency test cannot proceed until this is fixed.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://ofhzrdiadxigrvmrhaiz.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Login error: AuthApiError: Invalid login credentials
    at handleError (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:80:11)
    at async _handleRequest (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:123:9)
    at async _request (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/lib/fetch.js:105:18)
    at async SupabaseAuthClient.signInWithPassword (webpack-internal:///(app-pages-browser)/./node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:394:23)
    at async onSubmit (webpack-internal:///(app-pages-browser)/./app/components/auth/login-form.tsx:118:44)
    at async eval (webpack-internal:///(app-pages-browser)/../node_modules/react-hook-form/dist/index.esm.mjs:2142:17) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/43b97183-ab8b-49fb-b296-85c2902199a4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017
- **Test Name:** UI Responsiveness and Accessibility
- **Test Code:** [TC017_UI_Responsiveness_and_Accessibility.py](./TC017_UI_Responsiveness_and_Accessibility.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/84b45a63-7a7c-4bbc-acf7-e895f692c85d/5a15fc09-080d-474a-b9b1-553f65e0f740
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **29.41** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---