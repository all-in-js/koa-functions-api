import Koa from 'koa';
interface functionsApiContext {
    variables: {
        [key: string]: any;
    };
    var: any;
    functionPath: string;
}
declare type ExtendContext = Koa.Context & functionsApiContext;
declare type FResolver = (cx: ExtendContext) => any;
interface IOptions {
    path?: string;
    namespace?: string;
    functions?: FResolver[];
}
export declare function functionsApiMiddleware(options?: IOptions): (cx: ExtendContext, next: Koa.Next) => Promise<"the 'functionPath' expected to be send." | undefined>;
export {};
