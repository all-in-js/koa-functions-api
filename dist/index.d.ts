import Koa from 'koa';
declare type FResolver = (cx: Koa.ParameterizedContext) => any;
interface IOptions {
    path?: string;
    namespace?: string;
    functions?: FResolver[];
}
export declare function functionsApiMiddleware(options?: IOptions): (cx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext>, next: Koa.Next) => Promise<"the 'functionPath' expected to be send." | undefined>;
export {};
