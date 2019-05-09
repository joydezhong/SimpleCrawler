//导入包
const mongoose = require("mongoose");

const express = require('express');

const eventproxy = require('eventproxy');
const superagent = require("superagent");
const cheerio = require("cheerio");

const app = express();
const ep = eventproxy();

//连接本地mongodb数据库Douban
var mongourl = 'mongodb://localhost:27017/DoubanHandle';
mongoose.connect(mongourl).then(
        () => { 
            console.log('连接成功！')
        },
        err => {
            console.log('哦，泄特！', err);
        }
    );

var Schema = mongoose.Schema;
//创建详情模型
var newBookSchema = new Schema({
    title: String,
    bookId: Number,
    bookInfo: String,
    bookInfoHtml: String,
    grade: Number,
    bookImg: String,
    contentInfo: String,
    contentInfoHtml: String,
    authorInfo: String,
    authorInfoHtml: String,
    catalogInfo: String,
    catalogInfoHtml: String
});

var NewBook = mongoose.model('NewBook', newBookSchema, 'bookDetails');

//数据库的id数组
var idArray = [30190511, 27910523, 30181091, 30261641, 27199016, 30190510, 27204781, 27197830, 30226251, 30261633, 30172063, 27097409, 27197827, 30175383, 30271488, 27197821, 30246163, 27176955, 30159797, 27156017, 30199056, 30265858, 30238504, 27191009, 30257895, 30259720, 30161870, 30222403, 30121259, 30192896, 30223575, 30181646, 30176576];

//存放结果和url数组的
let resultArr = [];
let desUrlList = [];

//页码拼接url遍历
for (let i = 0; i < idArray.length; i++){
    desUrlList.push(`https://book.douban.com/subject/${idArray[i]}`);
}


for (let desUrl of desUrlList){

    console.log(desUrl);

    superagent.get(desUrl).end((error, response)=>{

        if(error) console.log(error);

        //获取页面文档数据
        var content = response.text;

        //cheerio也就是node下的jquery 将整个文档包装成一个集合，定义一个$接收
        var $ = cheerio.load(content);

        //分析文档结构 先获取每个li 再遍历里面的内容（此时每个li里面就存放着我们想要获取的数据）
        $(".article").each(function(index,value){

            //提取url链接中的id
            var bookId = desUrl.replace(/[^0-9]/ig,"");
            
            //将获取的数据以对象的形式添加到数组中
            var oneBookDetail = {
                title: $(value).find(".indent .subjectwrap .subject .nbg").attr("title"),
                bookId: bookId,
                bookInfo: $(value).find(".indent .subjectwrap .subject #info").text(),
                bookInfoHtml: $(value).find(".indent .subjectwrap .subject #info").html(),
                grade: $(value).find(".indent .subjectwrap #interest_sectl .rating_num").text(),
                bookImg: $(value).find(".indent .subjectwrap .subject .nbg").attr("href").replace(/^https:/g,""),
                contentInfo: $(value).find(".related_info #link-report .all div .intro").text() || $(value).find(".related_info #link-report div .intro").text(),
                contentInfoHtml: $(value).find(".related_info #link-report .all div .intro").html() || $(value).find(".related_info #link-report div .intro").html(),
                authorInfo: $(value).find(".related_info .indent").eq(1).find(".all div .intro").text() || $(value).find(".related_info .indent").eq(1).find("div .intro").text(),
                authorInfoHtml: $(value).find(".related_info .indent").eq(1).find(".all div .intro").html() || $(value).find(".related_info .indent").eq(1).find("div .intro").html(),
                catalogInfo: $(value).find(`.related_info #dir_${bookId}_full`).text() || $(value).find(`.related_info #dir_${bookId}_short`).text(),
                catalogInfoHtml: $(value).find(`.related_info #dir_${bookId}_full`).html() || $(value).find(`.related_info #dir_${bookId}_short`).html()
            };

            resultArr.push(oneBookDetail);
            //将每个书本信息实例化到newBook模型中
            var bookDetail = new NewBook(oneBookDetail);
            console.log(bookId, 'bookId');
            //保存到mongodb
            bookDetail.save(function(err){
                if(err){
                    console.log('保存失败：'+ err);
                    return;
                }
                console.log("OJBK!");
            });

            ep.emit('allBooks',oneBookDetail);

        });
    })
}

// ep.after('allBooks',desUrlList.length,function () {
//     console.log(resultArr);
// });
