"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@iuv-tools/utils");
const injector_1 = require("@eryue/injector");
const defaultOptions = {
    path: '/api/functions',
    namespace: 'api',
    functions: []
};
/** types end */
const container = new injector_1.ContainerClass();
async function FunctionsApiResolver(cx) {
    let result = [{
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
            }
            else {
                // resolve stored fns
                let [module] = container.resolve(namespace);
                if (!module) {
                    result[i] = {
                        msg: `functions is not exists.`
                    };
                }
                else {
                    const fn = module[functionPath[0]];
                    if (utils_1.getArgType(fn).isFunction) {
                        const data = await fn.call(cx, cx, vars[i] || {}); // bind context
                        result[i] = data;
                    }
                    else {
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
function functionsApiMiddleware(options) {
    if (!utils_1.getArgType(options).isObject)
        options = defaultOptions;
    options = Object.assign(defaultOptions, options);
    const { path: apiPath, namespace, functions } = options;
    // store fns as an object
    const fns = functions.reduce((curr, item) => {
        if (utils_1.getArgType(item).isFunction) {
            const { name } = item;
            if (!name) {
                utils_1.log.warn(`the anonymous function will be skiped:
        ${item.toString()}
        `);
            }
            else {
                curr[name] = item;
            }
        }
        return curr;
    }, {});
    // store fns
    container.add(namespace, fns);
    return async (cx, next) => {
        let functionsApiOptions = {
            $vars: [{}],
            $fns: ['']
        };
        // TODO: support others method
        if (cx.method.toLowerCase() === 'get') {
            let query = cx.query || {};
            try {
                if (/^\[.*?\]$/.test(query.$fns)) {
                    query.$fns = JSON.parse(query.$fns);
                }
                else {
                    query.$fns = [query.$fns];
                }
                if (/^\[.*?\]$/.test(query.$vars)) {
                    // 组合模式传值
                    query.$vars = JSON.parse(query.$vars);
                }
                else if (/^\{.*\}$/.test(query.$vars)) {
                    // 非组合模式传值
                    query.$vars = [JSON.parse(query.$vars)];
                }
                else {
                    // 非法格式传值
                    query.$vars = [{}];
                }
            }
            catch (e) {
                console.log(e);
                query = {};
            }
            functionsApiOptions = {
                ...functionsApiOptions,
                ...query
            };
        }
        if (cx.method.toLowerCase() === 'post') {
            const body = cx.request.body || {};
            if (!utils_1.getArgType(body.$fns).isArray) {
                body.$fns = [body.$fns];
            }
            if (!utils_1.getArgType(body.$vars).isArray) {
                body.$vars = [body.$vars];
            }
            functionsApiOptions = {
                ...functionsApiOptions,
                ...body
            };
        }
        const { $vars, $fns } = functionsApiOptions;
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
            const result = await FunctionsApiResolver(cx);
            if (result.length === 1) {
                const [res] = result;
                cx.body = res;
            }
            else {
                cx.body = result;
            }
        }
        else {
            // extra routes
            await next();
        }
    };
}
exports.functionsApiMiddleware = functionsApiMiddleware;
// {
//   variables: [{}, {}],
//   functionPath: ['/api/userInfo', '/api/userList']
// }
