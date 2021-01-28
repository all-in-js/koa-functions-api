import Koa from 'koa';
interface functionsApiContext {
    vars: [any];
    fns: [string];
}
export declare type ExtendContext<ExtraContext> = Koa.Context & functionsApiContext & ExtraContext;
declare type FResolver<ExtraContext> = (cx: ExtendContext<ExtraContext>, vars: any) => any;
interface IOptions<ExtraContext> {
    path?: string;
    namespace?: string;
    functions?: FResolver<ExtraContext>[];
    errorHandler?: (cx: ExtendContext<ExtraContext>, error: any) => any;
}
export declare function functionsApiMiddleware<ExtraContext>(options?: IOptions<ExtraContext>): (cx: ExtendContext<ExtraContext>, next: Koa.Next) => Promise<{
    msg: string;
} | undefined>;
export {};
