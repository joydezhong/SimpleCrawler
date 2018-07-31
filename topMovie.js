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
var topMovieSchema = new Schema({
    title: String,
    movieId: Number,
    copyrightInfo: String,
    grade: String,
    remark: String,
    movieImg: String,
    description: String
});
var TopMovie = mongoose.model('topMovie', topMovieSchema, 'topMovieList');

//存放结果和url数组的
let resultArr = [];
let desUrlList = [];

//页码拼接url遍历
for (let i = 1; i <= 10; i++){
    let pageIndex = 25*(i-1);
    desUrlList.push(`https://movie.douban.com/top250?start=${pageIndex}`);
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
        $(".grid_view li").each(function(index,value){

            //提取url链接中的id
            var address = $(value).find(".item .pic a").attr("href");
            var movieId = address.replace(/[^0-9]/ig,"");

            //将获取的数据以对象的形式添加到数组中
            var oneMovie = {
                title: $(value).find(".item .info .hd a>span").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                movieId: movieId,
                copyrightInfo: $(value).find(".item .info .bd p").text(),
                grade: $(value).find(".item .info .bd .star .rating_num").text(),
                remark: $(value).find(".item .info .bd .star span:last-child").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                movieImg: $(value).find(".item .pic a img").attr("src").replace(/^https:/g,""),
                description: $(value).find(".item .info .bd .quote .inq").text()
            };

            resultArr.push(oneMovie);
            //将每个书本信息实例化到newBook模型中
            var topMovie = new TopMovie(oneMovie);

            //保存到mongodb
            topMovie.save(function(err){
                if(err){
                    console.log('保存失败：'+ err);
                    return;
                }
                console.log("OJBK!");
            });

            ep.emit('allMovies',oneMovie);

        });
    })
}

ep.after('allMovies',desUrlList.length,function () {
    console.log(resultArr);
});



