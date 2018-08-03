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
var hotActiveSchema = new Schema({
    title: String,
    eventId: Number,
    eventImg: String
});
var HotActive = mongoose.model('HotActive', hotActiveSchema, 'hotActivces');

superagent
    .get("https://guangzhou.douban.com")
    .end((error, response)=>{

        //获取页面文档数据
        var content = response.text;

        //cheerio也就是node下的jquery 将整个文档包装成一个集合，定义一个$接收
        var $ = cheerio.load(content);

        //定义一个空数组，用来接收数据
        var result = [];

        //分析文档结构 先获取每个li 再遍历里面的内容（此时每个li里面就存放着我们想要获取的数据）
        $(".ui-slide-screen ul li").each(function(index,value){

            //提取url链接中的id
            var address = $(value).find(".pic a").attr("href");
            var eventId = address.replace(/[^0-9]/ig,"");

            var imgHref = $(value).find(".pic a img").attr("src");

            //将获取的数据以对象的形式添加到数组中
            var oneActive = {
                title: $(value).find(".title a").attr('title'),
                eventId: eventId,
                order: $(value).find(".green-num-box").text(),
                eventImg: imgHref ? imgHref.replace(/^https:/g,"") : ""
            };
            result.push(oneActive);

            //将每个书本信息实例化到newBook模型中
            var hotActive = new HotActive(oneActive);

            //保存到mongodb
            hotActive.save(function(err){
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
        fs.writeFile("hotActive.json", result, "utf-8", (error)=>{

            //监听错误，如正常输出，则打印null
            if(error == null){
                console.log("恭喜您，数据爬取成功!请打开json文件");
            }
        })
    })
