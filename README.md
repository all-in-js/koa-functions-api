
# koa-functions-api

基于 koa2 的函数式单路由接口开发方式

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