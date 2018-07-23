//导入包
const express = require('express');
const mongoose = require("mongoose");

const eventproxy = require('eventproxy');
const superagent = require("superagent");
const cheerio = require("cheerio");

const app = express();
const ep = eventproxy();

//连接本地mongodb数据库Douban
var mongourl = 'mongodb://localhost/Douban';
mongoose.connect(mongourl);
var Schema = mongoose.Schema;
//创建模型
var topBookSchema = new Schema({
    title: String,
    enTitle: String,
    bookId: Number,
    copyrightInfo: String,
    grade: String,
    remark: String,
    bookImg: String
});
var TopBook = mongoose.model('topBook', topBookSchema, 'topbooklist');

//存放结果和url数组的
let resultArr = [];
let desUrlList = [];

//页码拼接url遍历
for (let i = 1; i <= 10; i++){
    let pageIndex = 25*(i-1);
    desUrlList.push(`https://book.douban.com/top250?start=${pageIndex}`);
}

console.log(desUrlList);

for (let desUrl of desUrlList){

    superagent.get(desUrl).end((error, response)=>{

        if(error) console.log(error);

        //获取页面文档数据
        var content = response.text;

        //cheerio也就是node下的jquery 将整个文档包装成一个集合，定义一个$接收
        var $ = cheerio.load(content);

        //分析文档结构 先获取每个li 再遍历里面的内容（此时每个li里面就存放着我们想要获取的数据）
        $(".indent table").each(function(index,value){

            //提取url链接中的id
            var address = $(value).find(".item td a").attr("href");
            var bookId = address.replace(/[^0-9]/ig,"");

            //将获取的数据以对象的形式添加到数组中
            var oneBook = {
                title: $(value).find(".item td .pl2 a").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                enTitle: $(value).find(".item td .pl2 span").text(),
                bookId: bookId,
                copyrightInfo: $(value).find(".item td p.pl").text(),
                grade: $(value).find(".item td .star .rating_nums").text(),
                remark: $(value).find(".item td .star .pl").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                bookImg: $(value).find(".item td .nbg img").attr("src").replace(/^https:/g,"")
            };

            resultArr.push(oneBook);
            //将每个书本信息实例化到newBook模型中
            var topBook = new TopBook(oneBook);

            //保存到mongodb
            topBook.save(function(err){
                if(err){
                    console.log('保存失败：'+ err);
                    return;
                }
                console.log("OJBK!");
            });

            ep.emit('allBooks',oneBook);

        });
    })
}

ep.after('allBooks',desUrlList.length,function () {
    console.log(resultArr);
});



