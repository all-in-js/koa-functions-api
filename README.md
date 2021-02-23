
# koa-functions-api

基于 koa2 的函数式单路由接口开发方式

* inspired by graphyql, 暂未实现 schema
* 函数即接口服务，一个函数类似于 RESTFUL 中的一个资源，每个函数可组合、可复用
* 提供一个接口和多个函数服务，前端通过一个接口请求各种函数服务
* 支持前端合并请求，大大降低请求时间，防止接口依赖导致的响应时间过长的问题
* 统一的异常监听和性能监控

### 服务端

* **安装**

```bash
yarn add koa-functions-api
```

* **使用中间件**

```js
import { functionsApiMiddleware } from 'koa-functions-api';

app.use(functionsApiMiddleware({
  // path: '/api/functions',
  // namespace: 'api',
  functions: [
    function helloWorld(cx, vars) {
      return 'hello, world.';
    }
  ],
  errorHandler(cx, err) {
    console.log(err);
    cx.body = err.message;
  }
}));
```

* **参数配置**

| 参数名 | 类型 | 说明 | 默认值 | 
| ----- | ----- | ----- | ----- |
| path | string | 前端请求的接口 | /api/functions |
| namespace | string | 函数的命名空间，前端请求函数时以此为前缀 | api |
| functions | [(cx, vars?) => void] | 所有的函数服务 | [] |
| errorHandler | (cx, err) => void | 异常处理函数 | - |

### 前端使用

* **fetch**
```js
fetch('/api/functions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    $vars: {},
    $fns: 'api/helloWorld'
  })
});
```

> 直接使用 fetch 稍显麻烦？使用 [fetch-functions-api](https://github.com/famanoder/fetch-functions-api) 快速上手！

// TODO:
函数执行的信息统计；