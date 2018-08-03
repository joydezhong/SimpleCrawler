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
var newMusicSchema = new Schema({
    title: String,
    musicId: Number,
    order: Number,
    days: String,
    movieImg: String,
    upRate: Number,
    info: String,
    trend: Number
});
var NewMusic = mongoose.model('NewMusic', newMusicSchema, 'newMusics');

superagent
    .get("https://music.douban.com/chart")
    .end((error, response)=>{

        //获取页面文档数据
        var content = response.text;

        //cheerio也就是node下的jquery 将整个文档包装成一个集合，定义一个$接收
        var $ = cheerio.load(content);

        //定义一个空数组，用来接收数据
        var result = [];

        //分析文档结构 先获取每个li 再遍历里面的内容（此时每个li里面就存放着我们想要获取的数据）
        $(".col5 li").each(function(index,value){

            //提取url链接中的id
            var imgHref = $(value).find(".face img").attr("src");
            //判断趋势
            if($(value).find(".trend").hasClass('arrow-up')){
                var trend = 1;
            }else if($(value).find(".trend").hasClass('arrow-down')){
                var trend = -1;
            }else if($(value).find(".trend").hasClass('arrow-stay')){
                var trend = 0;
            }
            //将获取的数据以对象的形式添加到数组中
            var oneMusic = {
                title: $(value).find(".intro h3 a").text(),
                musicId: $(value).find(".intro h3").attr("data-sid"),
                order: $(value).find(".green-num-box").text(),
                days: $(value).find(".days").text(),
                movieImg: imgHref ? imgHref.replace(/^https:/g,"") : "",
                upRate: $(value).find(".trend").text(),
                info: $(value).find(".intro p").text(),
                trend: trend
            };
            result.push(oneMusic);

            //将每个书本信息实例化到newBook模型中
            var newMusic = new NewMusic(oneMusic);

            //保存到mongodb
            newMusic.save(function(err){
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
        fs.writeFile("newMusic.json", result, "utf-8", (error)=>{

            //监听错误，如正常输出，则打印null
            if(error == null){
                console.log("恭喜您，数据爬取成功!请打开json文件");
            }
        })
    })
