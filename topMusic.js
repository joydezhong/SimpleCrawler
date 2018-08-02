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
var topMusicSchema = new Schema({
    title: String,
    musicId: Number,
    typeInfo: String,
    grade: String,
    remark: String,
    musicImg: String
});
var TopMusic = mongoose.model('topMusic', topMusicSchema, 'topMusicList');

//存放结果和url数组的
let resultArr = [];
let desUrlList = [];

//页码拼接url遍历
for (let i = 1; i <= 10; i++){
    let pageIndex = 25*(i-1);
    desUrlList.push(`https://music.douban.com/top250?start=${pageIndex}`);
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
            var address = $(value).find(".item td .nbg").attr("href");
            var musicId = address.replace(/[^0-9]/ig,"");

            //将获取的数据以对象的形式添加到数组中
            var oneMusic = {
                title: $(value).find(".item .pl2 a").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                musicId: musicId,
                typeInfo: $(value).find(".item .pl2>.pl").text(),
                grade: $(value).find(".item .pl2 .star .rating_nums").text(),
                remark: $(value).find(".item .pl2 .star .pl").text().replace(/\ +/g,"").replace(/[\r\n]/g,""),
                musicImg: $(value).find(".item td .nbg img").attr("src").replace(/^https:/g,"")
            };

            resultArr.push(oneMusic);
            //将每个书本信息实例化到newBook模型中
            var topMusic = new TopMusic(oneMusic);

            //保存到mongodb
            topMusic.save(function(err){
                if(err){
                    console.log('保存失败：'+ err);
                    return;
                }
                console.log("OJBK!");
            });

            ep.emit('allMusics',oneMusic);

        });
    })
}

ep.after('allMusics',desUrlList.length,function () {
    console.log(resultArr);
});



