import Koa from 'koa';
/**
 * types start */
declare type ParamItem = {
    [key: string]: any;
};
interface functionsApiContext {
    vars: [ParamItem];
    fns: [string];
}
declare type ExtendContext = Koa.Context & functionsApiContext;
declare type FResolver = (cx: ExtendContext, vars?: ParamItem) => any;
interface IOptions {
    path?: string;
    namespace?: string;
    functions?: FResolver[];
}
export declare function functionsApiMiddleware(options?: IOptions): (cx: ExtendContext, next: Koa.Next) => Promise<"the '$fns' expected to be send." | undefined>;
export {};
