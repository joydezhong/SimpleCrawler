# SimpleCrawler
简易的Crawler程序，获取页面数据。

程序依赖两个npm包：`superagent `、`cheerio`

> superagent 是一个轻量的,渐进式的ajax api,可读性好,学习曲线低,内部依赖nodejs原生的请求api,适用于nodejs环境下
> cheerio是nodejs的抓取页面模块，为服务器特别定制的，快速、灵活、实施的jQuery核心实现。适合各种Web爬虫程序。相当于node.js中的jQuery

主要文件：crawler.js

`npm install` 安装依赖

`node crawler.js` 运行程序，刷新项目目录，打开boss.json即可查看获取的数据
