//导入包
const fs = require("fs");

// //连接本地mongodb数据库Douban
var mongourl = 'mongodb://localhost/Douban';


var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(mongourl, function(err, db){
    if(err) throw err;
    console.log("数据库已经创建");
    var dbase = db.db("Douban");
    //判断集合存在
    dbase.listCollections({name: 'usaMovies'}).next(function(err, collinfo){
        if(collinfo){
            console.log("集合存在");
        }else{
            console.log("集合不存在");
        }
    });

    dbase.createCollection('usaMovies', function(err, res){
        if(err) throw err;
        console.log("创建集合成功");

        //插入数据
        var filename = "D:\\myMEAN\\myPaCong\\SimpleCrawler\\us_box.json";  //json文件的绝对路径
        console.log("读取...");
        var fileContent = fs.readFileSync(filename);
        if(fileContent){
            console.log("文件长度"+fileContent.length);
            //写入数据库
            var tbfile = JSON.parse(fileContent);
            dbase.collection('usaMovies').insert(tbfile, function(err, res){
                if(err)throw err;
                console.log("tbfile文件写入数据库成功");
                db.close();
            })
        }
    });
});