'use strict';

const http = require('http'),  //对文件进行操作
    fs = require('fs'),  //对路径进行操作
    path = require('path'),  //用于对页面进行类似于jquery的操作，需要npm安装
    cheerio = require('cheerio'),  //用来对外发送请求，需要npm安装
    request = require('request');

//用来存储全部爬取的结果
let result = [];
//需要爬取的网站
let mainUrl = 'https://movie.douban.com/top250';

//这里由于我希望学习一下events模块，所以就把两个函数，一个是读取页面信息的函数，另一个是写入文件的函数都绑定了事件，需要npm安装
//一下引入events模块的方式是完全参照官方网站的写法
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {
}
const myEmitter = new MyEmitter();

//写入文件的函数
myEmitter.on('writefile', (result) => {
    fs.writeFile('pagebook.json', JSON.stringify(result, null, 2), 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
    });

});

//这时获取一张页面中信息的函数，mainUrl为次网页的地址
myEmitter.on('getData', (mainUrl) => {
    //用于存储获取的html页面
    let html = '';
    //发送请求，获取html页面
    request(mainUrl, 'GET', function (error, res, body) {
        if (!error && res.statusCode === 200) {
            //将获取的html页面变为字符串的形式，否则看到的将是一大堆数字
            html = body.toString();
        }
        //使用cheerio模块，将获取的html页面代码存入cheerio的一个实例里，准备进行jquery操作
        let $ = cheerio.load(html);
        //用来临时存放获取的信息
        var tmp = {};

        //根据分析所知的需要获取信息所在的html元素或者是它们的类进行定位和信息获取, [见最下图1]
        $('.item').each(function (i, el) {
            let title = $(this).find('.info').find('a').children().first().text(),
                stars = $(this).find('.bd').find('.star').find('.rating_num').text();
            //将获取的信息存入一个对象中
            tmp = {
                'title': title,
                '评分': stars
            };
            //将这个对象推入数组中
            result.push(tmp);
        });
    });
})
//接下来的三个函数为关键部分，如果不明白可以去看上面我推荐的那篇文章
function async(arg, callback) {
    setTimeout(function () {
        console.log('Dealing with one page now');
        callback(arg);
    }, 1000);
}

//遍历结束时写入文件
function Final() {
    myEmitter.emit('writefile', result);
    console.log("Done");
}

function series($, item, pat, flag) {
    if ($(item).length !== 0) {
        async(item, function (arg) {
            let tmp = $(arg).first();
            //由于第一页并不是a标签[见最下图2]，而是span，所以这里需要在最先处理一下
            if (flag === 1) {
                myEmitter.emit('getData', mainUrl);
                flag = 0;
            } else {
                //获取所有a标签中的href内容，并传入读取页面数据的函数中
                //由于当前数组，也就是tmp中包含的不只是元素，即使是a元素其链接也可能不符合要求，所以就需要进行判断，首先，元素中包含的内容必须是纯数字，其次元素必须包含‘href‘，也就是必须是a标签
                if (pat.exec($(tmp).text()) && typeof ($(tmp).attr("href")) !== 'undefined') {
                    myEmitter.emit('getData', mainUrl + $(tmp).attr('href'));
                }
            }
            //进行递归
            return series($, $(arg).nextAll(), pat, flag);
        });
        //如果遍历结束，则写入文件
    } else {
        return Final();
    }
}

//此为主函数
function getAllPage() {
    request('https://movie.douban.com/top250', 'GET', function (error, res, body) {
        let mainUrl = 'https://movie.douban.com/top250',
            html = '',
            pageInfo = {};
        if (!error && res.statusCode === 200) {
            html = body.toString();
        }
        let $ = cheerio.load(html);
        let thispage = $('.paginator').children();
        let pat = /\b\d{1,2}\b/;
        let flag = 1;

        series($, thispage, pat, flag);
    });

}

getAllPage();