//导入包
const http = require("http");
const path = require("path");
const url = require("url");
const fs = require("fs");
const mongoose = require("mongoose");

const superagent = require("superagent");
const cheerio = require("cheerio");

//连接本地mongodb数据库Douban
var mongourl = 'mongodb://localhost/Douban';
mongoose.connect(mongourl);
var Schema = mongoose.Schema;
//创建模型
var newBookSchema = new Schema({
    title: String,
    bookId: Number,
    grade: String,
    bookInfo: String,
    bookImg: String,
    description: String
});
var NewBook = mongoose.model('NewBook', newBookSchema);

superagent
    .get("https://book.douban.com/latest?icn=index-latestbook-all")
    .end((error, response)=>{

        //获取页面文档数据
        var content = response.text;

        //cheerio也就是node下的jquery 将整个文档包装成一个集合，定义一个$接收
        var $ = cheerio.load(content);

        //定义一个空数组，用来接收数据
        var result = [];

        //分析文档结构 先获取每个li 再遍历里面的内容（此时每个li里面就存放着我们想要获取的数据）
        $(".cover-col-4 li").each(function(index,value){

            //提取url链接中的id
            var address = $(value).find(".cover").attr("href");
            var bookId = address.replace(/[^0-9]/ig,"");

            //将获取的数据以对象的形式添加到数组中
            var oneBook = {
                title: $(value).find(".detail-frame h2 a").text(),
                bookId: bookId,
                grade: $(value).find(".detail-frame .rating .font-small").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                bookInfo: $(value).find(".detail-frame .color-gray").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                bookImg: $(value).find(".cover img").attr("src").replace(/^https:/g,""),
                description: $(value).find(".detail-frame .detail").text().replace(/\ +/g,"").replace(/[\r\n]/g,"")
            };
            result.push(oneBook);

            //将每个书本信息实例化到newBook模型中
            var newBook = new NewBook(oneBook);

            //保存到mongodb
            newBook.save(function(err){
               if(err){
                   console.log('保存失败：'+ err);
                   return;
               }
               console.log("OJBK!");
            });

        });

        //将数组转成字符串
        result = JSON.stringify(result);

        //将数组输出到json文件里 刷新目录  即可看到当前文件夹多出一个boss.json文件
        fs.writeFile("newBooks.json", result, "utf-8", (error)=>{

            //监听错误，如正常输出，则打印null
            if(error == null){
                console.log("恭喜您，数据爬取成功!请打开json文件");
            }
        })
    })
