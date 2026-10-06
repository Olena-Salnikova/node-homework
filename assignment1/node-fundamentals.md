# Node.js Fundamentals

## What is Node.js?

Node.js is a runtime environment that allows us to run JavaScript outside the browser. It uses the V8 engine to execute JavaScript code. Node.js allows developers to build web servers, APIs, command-line tools, and other applications using JavaScript.

## How does Node.js differ from running JavaScript in the browser?

JavaScript in the browser is mainly used to interact with web pages, change HTML and CSS, and respond to user actions. It has access to browser objects like `window` and `document`.

Node.js runs JavaScript outside the browser. It does not have access to the DOM, but it can work with files, access the operating system, read environment variables, and create web servers. Both environments run JavaScript, but they provide different tools.

## What is the V8 engine, and how does Node use it?

V8 is a JavaScript engine developed by Google. It reads JavaScript code and compiles it into machine code so the computer can execute it.

Node.js uses the V8 engine to run JavaScript outside the browser. It also provides additional tools, such as file system and networking modules, that allow JavaScript to work on a computer or server.

## What are some key use cases for Node.js?

Node.js is commonly used for:

- Building web servers and APIs.
- Creating command-line tools to automate tasks.
- Developing real-time applications, such as chat apps.
- Working with databases and external APIs.
- Creating scripts and development tools.

Node.js is especially useful for applications that handle many requests and spend time waiting for files, databases, or network operations.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**

CommonJS uses `require()` to import code and `module.exports` to share code between files.

```js
// math.js
function add(a, b) {
  return a + b;
}

module.exports = { add };

// app.js
const { add } = require("./math");

console.log(add(2, 3));
```

**ES Modules (supported in modern Node.js):**

ES Modules use `import` to bring in code and `export` to make code available to other files.

```js
// math.js
export function add(a, b) {
  return a + b;
}

// app.js
import { add } from "./math.js";

console.log(add(2, 3));
``` 

The main difference is the syntax: CommonJS uses `require()` and `module.exports`, while ES Modules use `import` and `export`. Both allow us to organize code into separate files and reuse functions. Node.js supports both module systems, but this course uses CommonJS.
