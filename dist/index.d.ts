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
export declare type ExtendContext<ExtraContext> = Koa.Context & functionsApiContext & ExtraContext;
declare type FResolver<ExtraContext> = (cx: ExtendContext<ExtraContext>, vars?: ParamItem) => any;
interface IOptions<ExtraContext> {
    path?: string;
    namespace?: string;
    functions?: FResolver<ExtraContext>[];
}
export declare function functionsApiMiddleware<ExtraContext>(options?: IOptions<ExtraContext>): (cx: ExtendContext<ExtraContext>, next: Koa.Next) => Promise<"the '$fns' expected to be send." | undefined>;
export {};
