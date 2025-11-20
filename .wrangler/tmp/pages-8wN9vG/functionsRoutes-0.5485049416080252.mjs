import { onRequestPost as __api_notify__code__enhanced_js_onRequestPost } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\notify\\[code]\\enhanced.js"
import { onRequestGet as __api_callback__code__js_onRequestGet } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\callback\\[code].js"
import { onRequestPost as __api_callback__code__js_onRequestPost } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\callback\\[code].js"
import { onRequestGet as __api_configuration__code__js_onRequestGet } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\configuration\\[code].js"
import { onRequestPut as __api_configuration__code__js_onRequestPut } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\configuration\\[code].js"
import { onRequestGet as __api_messages__code__js_onRequestGet } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\messages\\[code].js"
import { onRequestPost as __api_notify__code__js_onRequestPost } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\notify\\[code].js"
import { onRequestPost as __api_configure_js_onRequestPost } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\configure.js"
import { onRequestPost as __api_validate_js_onRequestPost } from "D:\\15268\\Desktop\\qywx-push\\functions\\api\\validate.js"
import { onRequest as ___middleware_js_onRequest } from "D:\\15268\\Desktop\\qywx-push\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/notify/:code/enhanced",
      mountPath: "/api/notify/:code",
      method: "POST",
      middlewares: [],
      modules: [__api_notify__code__enhanced_js_onRequestPost],
    },
  {
      routePath: "/api/callback/:code",
      mountPath: "/api/callback",
      method: "GET",
      middlewares: [],
      modules: [__api_callback__code__js_onRequestGet],
    },
  {
      routePath: "/api/callback/:code",
      mountPath: "/api/callback",
      method: "POST",
      middlewares: [],
      modules: [__api_callback__code__js_onRequestPost],
    },
  {
      routePath: "/api/configuration/:code",
      mountPath: "/api/configuration",
      method: "GET",
      middlewares: [],
      modules: [__api_configuration__code__js_onRequestGet],
    },
  {
      routePath: "/api/configuration/:code",
      mountPath: "/api/configuration",
      method: "PUT",
      middlewares: [],
      modules: [__api_configuration__code__js_onRequestPut],
    },
  {
      routePath: "/api/messages/:code",
      mountPath: "/api/messages",
      method: "GET",
      middlewares: [],
      modules: [__api_messages__code__js_onRequestGet],
    },
  {
      routePath: "/api/notify/:code",
      mountPath: "/api/notify",
      method: "POST",
      middlewares: [],
      modules: [__api_notify__code__js_onRequestPost],
    },
  {
      routePath: "/api/configure",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_configure_js_onRequestPost],
    },
  {
      routePath: "/api/validate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_validate_js_onRequestPost],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]