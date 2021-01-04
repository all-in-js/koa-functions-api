import Koa from 'koa';
import { getArgType, log } from '@iuv-tools/utils';
import { ContainerClass } from '@eryue/injector';

const defaultOptions = {
  path: '/api/functions',
  namespace: 'api',
  functions: []
};

/**
 * types start */
interface IFunctionsApiOptions {
  variables?: { [key: string]: any };
  functionPath: string;
}

type FResolver = (cx: Koa.ParameterizedContext) => any;

interface IOptions {
  path?: string;
  namespace?: string;
  functions?: FResolver[];
}

interface IResult {
  code: number;
  success: boolean;
  msg: string;
  data: any;
}

interface FnsObject {
  [key: string]: FResolver;
}
/** types end */

const container = new ContainerClass();

// TODO: combine functionPath
async function FunctionsApiResolver(cx: Koa.ParameterizedContext) {
  let result: IResult = {
    code: 200,
    success: true,
    msg: 'success',
    data: []
  };
  const normallizedPath = cx.functionPath.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
  const [namespace, ...functionPath] = normallizedPath;
  if (!functionPath.length) {
    result = {
      code: 400,
      success: false,
      msg: `the 'functionPath' is invalid. eg: 'namespace/method'`,
      data: []
    };
  } else {
    // resolve stored fns
    let [module] = container.resolve(namespace);
    if (!module) {
      result = {
        code: 500,
        success: false,
        msg: `functions is not exists.`,
        data: []
      };
      return result;
    }

    const fn = module[functionPath];
    if (getArgType(fn).isFunction) {
      const data = await fn.call(cx, cx); // bind context
      result = {
        code: 200,
        success: true,
        msg: 'ok',
        data
      };
    } else {
      result = {
        code: 500,
        success: false,
        msg: `please check the function '${functionPath}'`,
        data: []
      };
    }
  }

  return result;
}

export function functionsApiMiddleware(options?: IOptions) {
  if (!getArgType(options).isObject) options = defaultOptions;
  options = Object.assign(defaultOptions, options);

  const { path: apiPath, namespace, functions } = options;
  // store fns as an object
  const fns = (functions as FResolver[]).reduce((curr: FnsObject, item) => {
    if (getArgType(item).isFunction) {
      const { name } = item;
      if (!name) {
        log.warn(`the function has no name, will be skiped:
          ${item.toString()}
        `);
      } else {
        curr[name] = item;
      }
    }
    return curr;
  }, {});

  // store fns
  container.add(namespace as string, fns);

  return async (cx: Koa.ParameterizedContext, next: Koa.Next) => {
    let functionsApiOptions: IFunctionsApiOptions = {
      functionPath: ''
    };
    // TODO: support others method
    if (cx.method.toLowerCase() === 'get') {
      const query = cx.query || {};
      functionsApiOptions = {
        ...functionsApiOptions,
        ...query
      };
    }
    if (cx.method.toLowerCase() === 'post') {
      const body = (cx.request as any).body || {};
      functionsApiOptions = {
        ...functionsApiOptions,
        ...body
      };
    }
  
    const {
      variables,
      functionPath
    } = functionsApiOptions;

    if (!functionPath) {
      cx.status = 400;
      return cx.body = `the 'functionPath' expected to be send.`;
    }

    // no matter GET or POST, get value from cx.variables
    cx.variables = variables;
    cx.var = variables; // alias
    cx.functionPath = functionPath;

    if (cx.path === apiPath) {
      const { code, ...result } = await FunctionsApiResolver(cx);
      cx.status = code;
      cx.body = result;
    } else {
      // extra routes
      await next();
    }
  }
}

