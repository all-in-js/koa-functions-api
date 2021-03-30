import Koa from 'koa';
import { getArgType, log } from '@all-in-js/utils';
import { ContainerClass } from '@all-in-js/injector';

const defaultOptions = {
  path: '/api/functions',
  namespace: 'api',
  functions: []
};

/**
 * types start */
interface IFunctionsApiOptions {
  $vars: [any];
  $fns: [string];
}

interface functionsApiContext {
  vars: [any];
  fns: [string];
}

// 扩展外部context
export type ExtendContext<ExtraContext> = Koa.Context & functionsApiContext & ExtraContext;

type FResolver<ExtraContext> = (cx: ExtendContext<ExtraContext>, vars: any) => any;

interface IOptions<ExtraContext> {
  path?: string;
  namespace?: string;
  functions?: FResolver<ExtraContext>[];
  errorHandler?: (cx: ExtendContext<ExtraContext>, error: any) => any;
}

interface IResult {
  msg: string;
  [key: string]: any;
}

interface FnsObject<ExtraContext> {
  [key: string]: FResolver<ExtraContext>;
}
/** types end */

const container = new ContainerClass();

async function FunctionsApiResolver<ExtraContext>(cx: ExtendContext<ExtraContext>, apiPath: string) {
  let result: [IResult] = [{
    msg: 'success'
  }];

  const { fns, vars } = cx;
  if (fns && fns.length) {
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      const normallizedPath = fn.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
      // TODO: 多层级支持
      const [namespace, ...functionPath] = normallizedPath;
      if (!functionPath.length) {
        result[i] = {
          msg: `the item of '$fns' is invalid. eg: 'namespace/method'`
        };
      } else {
        // resolve stored fns
        let [module] = container.resolve(apiPath);
        if (!module) {
          result[i] = {
            msg: `functions is not exists.`
          };
        } else {
          const fn = module[functionPath[0]];
          if (getArgType(fn).isFunction) {
            const data = await fn.call(cx, cx, vars[i] || {}); // bind context
            result[i] = data;
          } else {
            result[i] = {
              msg: `please check the function '${functionPath}'`
            };
          }
        }
      }
    }
  }
  
  return result;
}

export function functionsApiMiddleware<ExtraContext>(options?: IOptions<ExtraContext>) {
  let opts = options as IOptions<ExtraContext>;
  if (!getArgType(opts).isObject) opts = defaultOptions;
  
  if (!opts.path) {
    opts.path = defaultOptions.path;
  }

  if (!opts.namespace) {
    opts.namespace = defaultOptions.namespace;
  }

  if (!opts.functions) {
    opts.functions = defaultOptions.functions;
  }

  const { path: apiPath, functions } = opts;
  // store fns as an object
  const fns = (functions as FResolver<ExtraContext>[]).reduce((curr: FnsObject<ExtraContext>, item) => {
    if (getArgType(item).isFunction) {
      const { name } = item;
      if (!name) {
        log.warn(`the anonymous function will be skiped:
        ${item.toString()}
        `);
      } else {
        curr[name] = item;
      }
    }
    return curr;
  }, {});

  // store fns
  container.add(apiPath as string, fns);

  return async (cx: ExtendContext<ExtraContext>, next: Koa.Next) => {
    let functionsApiOptions: IFunctionsApiOptions = {
      $vars: [{}],
      $fns: ['']
    };
    // TODO: support others method
    if (cx.method.toLowerCase() === 'get') {
      let query = cx.query || {};
      const fns = query.$fns as string;
      const vars = query.$vars as string;
      try {
        if (/^\[.*?\]$/.test(fns)) {
          query.$fns = JSON.parse(fns);
        } else {
          query.$fns = [fns];
        }
        if (/^\[.*?\]$/.test(vars)) {
          // 组合模式传值
          query.$vars = JSON.parse(vars);
        } else if (/^\{.*\}$/.test(vars)) {
          // 非组合模式传值
          query.$vars = [JSON.parse(vars)];
        } else {
          // 非法格式传值
          query.$vars = [{} as any];
        }
      } catch(e) {
        console.log(e);
        query = {};
      }

      functionsApiOptions = {
        ...functionsApiOptions,
        ...query
      };
    }
    if (cx.method.toLowerCase() === 'post') {
      const body = (cx.request as any).body || {};
      if (!getArgType(body.$fns).isArray) {
        body.$fns = [body.$fns];
      }
      if (!getArgType(body.$vars).isArray) {
          body.$vars = [body.$vars];
      }
      functionsApiOptions = {
        ...functionsApiOptions,
        ...body
      };
    }
  
    const {
      $vars,
      $fns
    } = functionsApiOptions;

    if (!$fns.length) {
      cx.status = 400;
      return cx.body = {
        msg: `the '$fns' expected to be send.`
      };
    }

    // no matter GET or POST, get value from cx.variables
    cx.vars = $vars;
    cx.fns = $fns;

    if (cx.path === apiPath) {
      try {
        // 接收具体函数执行时的error
        const result = await FunctionsApiResolver(cx, apiPath);
        if (result.length === 1) {
          const [res] = result;
          cx.body = res;
        } else {
          cx.body = result;
        }
      } catch (e) {
        const { errorHandler } = options || {};
        if (errorHandler && getArgType(errorHandler).isFunction) {
          errorHandler.call(cx, cx, e);
        }
      }
    } else {
      // extra routes
      await next();
    }
  }
}

// {
//   variables: [{}, {}],
//   functionPath: ['/api/userInfo', '/api/userList']
// }