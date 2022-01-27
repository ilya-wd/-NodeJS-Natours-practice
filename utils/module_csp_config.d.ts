// just in case i'll need it some time

declare module "xss-clean" {
 
 
  const xss: Function

  export default xss
}

declare module "express-csp" {
  namespace csp {

      type DirectiveProperties =
          "default-src"
          | "font-src"
          | "script-src"
          | "content-src"
          | "worker-src"
          | "frame-src"
          | "img-src"
          | "connect-src"
          | "form-action"
          | "frame-ancestors"
          | "media-src"
          | "object-src"
          | "plugin-types"
          | "report-uri"
          | "reflected-xss"
          | "require-sri-for"
          | "upgrade-insecure-requests"
          | "worker-src"
          | "manifest-src"
          | "base-uri"
          | "block-all-mixed-content"
          | "child-src"
          | "style-src"
      interface Policy {
          useScriptNonce?: boolean
          useStyleNonce?: boolean
          directives: Directives
      }

      type DirectiveValues =
          Array<'self' | 'unsafe-inline' | 'data:' | 'blob:'> |
          Array<string>

      type Directives = Partial<Record<DirectiveProperties, DirectiveValues>>

      interface CSPConfig {
          policy?: Policy
          reportPolicy?: Policy
      }

      interface SignMethods {
          signScript(script: string): void
          signStyle(style: string): void
          setPolicy(config: CSPConfig): void
          response: Omit<SignMethods, "response">
      }
      /**  

      @param app { Express } - The express app you are using
      
      @param config: { CSPConfig }

      @returns  app 

      */
      export function extend<T>(app: T, config: CSPConfig): T & SignMethods


  }

  export default csp

}