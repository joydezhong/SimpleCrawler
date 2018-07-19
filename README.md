# SimpleCrawler
简易的Crawler程序，获取页面数据，写入json文件，并保存到MongoDB。

程序依赖三个npm包：`superagent `、`cheerio`、`mongoose`，和nodejs的`fs`模块

确保本地安装mongoDB数据库，默认连接地址：localhost:27017，可安装可视化工具Robo 3T更加直观的查看数据。

> superagent---是一个轻量的,渐进式的ajax api,可读性好,学习曲线低,内部依赖nodejs原生的请求api,适用于nodejs环境下
>
> cheerio---是nodejs的抓取页面模块，为服务器特别定制的，快速、灵活、实施的jQuery核心实现。适合各种Web爬虫程序。相当于node.js中的jQuery

主要文件：crawler.js

`npm install` 安装依赖

`node crawler.js` 运行程序，刷新项目目录，打开newBooks.json即可查看获取的数据；或者打开可视化工具，刷新数据库集合，也可以查看；或者到MongoDB安装的bin目录下执行`mongo`连接数据库查看。
