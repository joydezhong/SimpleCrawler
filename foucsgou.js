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
var focusBookGouSchema = new Schema({
    title: String,
    bookId: Number,
    copyrightInfo: String,
    grade: String,
    remark: String,
    bookImg: String,
    price: Number,
    buyHref: String,
    eBookHref: String
});
var FocusBookGou = mongoose.model('NewBook', focusBookGouSchema, 'focusbookxugou');

superagent
    .get("https://book.douban.com/chart?subcat=F&icn=index-topchart-fiction")
    .end((error, response)=>{

        //获取页面文档数据
        var content = response.text;

        //cheerio也就是node下的jquery 将整个文档包装成一个集合，定义一个$接收
        var $ = cheerio.load(content);

        //定义一个空数组，用来接收数据
        var result = [];

        //分析文档结构 先获取每个li 再遍历里面的内容（此时每个li里面就存放着我们想要获取的数据）
        $(".chart-dashed-list li").each(function(index,value){

            //提取url链接中的id
            var address = $(value).find(".media__img a").attr("href");
            var bookId = address.replace(/[^0-9]/ig,"");

            //将获取的数据以对象的形式添加到数组中
            var oneBook = {
                title: $(value).find(".media__body h2 a").text(),
                bookId: bookId,
                copyrightInfo: $(value).find(".media__body .subject-abstract").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                grade: $(value).find(".media__body .w250 .font-small").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                remark: $(value).find(".media__body .w250 .ml8").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                bookImg: $(value).find(".media__img a img").attr("src").replace(/^https:/g,""),
                price: $(value).find(".media__body .w250 .buy-info a").text().replace(/[^0-9]/ig,""),
                buyHref: $(value).find(".media__body .w250 .cart-info a").attr('href'),
                eBookHref: $(value).find(".media__body .ll .ebook-link a").attr('href')
            };
            result.push(oneBook);

            //将每个书本信息实例化到newBook模型中
            var focusBookXugou = new FocusBookGou(oneBook);

            //保存到mongodb
            focusBookXugou.save(function(err){
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
        fs.writeFile("focusBookXugou.json", result, "utf-8", (error)=>{

            //监听错误，如正常输出，则打印null
            if(error == null){
                console.log("恭喜您，数据爬取成功!请打开json文件");
            }
        })
    })
