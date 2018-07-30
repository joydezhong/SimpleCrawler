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
var newMovieSchema = new Schema({
    title: String,
    movieId: Number,
    grade: String,
    release: String,
    type: String,
    region: String,
    movieImg: String,
    videoHref: String
});
var NewMovie = mongoose.model('NewMovie', newMovieSchema, 'willMovies');

superagent
    .get("https://movie.douban.com/cinema/later/guangzhou/")
    .end((error, response)=>{

        //获取页面文档数据
        var content = response.text;

        //cheerio也就是node下的jquery 将整个文档包装成一个集合，定义一个$接收
        var $ = cheerio.load(content);

        //定义一个空数组，用来接收数据
        var result = [];

        //分析文档结构 先获取每个li 再遍历里面的内容（此时每个li里面就存放着我们想要获取的数据）
        $(".bd>#showing-soon .mod").each(function(index,value){

            //提取url链接中的id
            var address = $(value).find(".thumb").attr("href");
            var movieId = address.replace(/[^0-9]/ig,"");

            var video = $(value).find(".intro ul a").attr("href");
            //将获取的数据以对象的形式添加到数组中
            var oneMovie = {
                title: $(value).find(".intro h3 a").text(),
                movieId: movieId,
                grade: $(value).find(".intro ul li.last").text(),
                release: $(value).find(".intro ul li").eq(0).text(),
                type: $(value).find(".intro ul li").eq(1).text(),
                region: $(value).find(".intro ul li").eq(2).text(),
                movieImg: $(value).find(".thumb img").attr("src").replace(/^https:/g,""),
                videoHref: video ? video : ""
            };
            result.push(oneMovie);

            //将每个书本信息实例化到newBook模型中
            var newMovie = new NewMovie(oneMovie);

            //保存到mongodb
            newMovie.save(function(err){
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
        fs.writeFile("laterMovies.json", result, "utf-8", (error)=>{

            //监听错误，如正常输出，则打印null
            if(error == null){
                console.log("恭喜您，数据爬取成功!请打开json文件");
            }
        })
    })
