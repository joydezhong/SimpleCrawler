//导入包
const http = require("http");
const path = require("path");
const url = require("url");
const fs = require("fs");

const superagent = require("superagent");
const cheerio = require("cheerio");

superagent
    .get("https://www.zhipin.com/job_detail/?city=100010000&source=10&query=%E5%89%8D%E7%AB%AF")
    .end((error, response)=>{
        //获取页面文档数据
        var content = response.text;
        //cheerio也就是node下的jquery 将整个文档包装成一个集合，定义一个$接收
        var $ = cheerio.load(content);
        //定义一个空数组，用来接收数据
        var result = [];
        //分析文档结构 先获取每个li 再遍历里面的内容（此时每个li里面就存放着我们想要获取的数据）
        $(".job-list li .job-primary").each(function(index,value){
            //地址和类型为一行显示，要用到字符串截取
            //地址
            let address = $(value).find(".info-primary").children().eq(1).html();
            //类型
            let type = $(value).find(".info-company p").html();
            //解码
            address  = unescape(address.replace(/&#x/g, '%u').replace(/;/g, ''));
            type = unescape(type.replace(/&#x/g, '%u').replace(/;/g, ''));
            //字符串截取
            let addressArr = address.split('<em class="vline"></em>');
            let typeArr = type.split('<em class="vline"></em>');
            //将获取的数据以对象的形式添加到数组中
            result.push({
                title: $(value).find(".name .job-title").text(),
                money: $(value).find(".name .red").text(),
                address: addressArr,
                company: $(value).find(".info-company a").text(),
                type: typeArr,
                position: $(value).find(".info-publis .name").text(),
                txImg: $(value).find(".info-publis img").attr("src"),
                time: $(value).find(".info-publis p").text()
            });
        });
        //将数组转成字符串
        result = JSON.stringify(result);
        //将数组输出到json文件里 刷新目录  即可看到当前文件夹多出一个boss.json文件
        fs.writeFile("boss.json", result, "utf-8", (error)=>{
            //监听错误，如正常输出，则打印null
            if(error == null){
                console.log("恭喜您，数据爬取成功!请打开json文件");
            }
        })
    })
