var express = require("express"),
    app = express(),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override");
    mongoDB = require('mongodb').MongoClient;
    archiver = require('archiver');


const DataBase = 'mongodb://127.0.0.1:27017/baseT';
const PuertoNodeJS = "55778";
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
app.get('/',function(req,res){
  res.sendFile(__dirname + "/");
});
app.get('/modificacionLibre',function(req,res){
  res.render(__dirname + "/paginas/modificar.ejs",{id: 0});
});
app.post('/modificacionLink',function(Request,Response){
  Response.render(__dirname + "/paginas/modificar.ejs",{id: Request.body.id});
});
app.post('/modificar',function(Request,Response){

  mongoDB.connect(DataBase, function(err, db) {
    if (err) throw err;
    var dbo = db.db("baseT");
    dbo.collection("almacen").find({}).toArray(function(err, result) {
      if (err) throw err;
      result.result.forEach(element => {
        if(element.id == Request.body.Identificador){
          var myquery = { id: Request.body.Identificador };
          if(Request.body.Modificacion[Request.body.Modificacion.selected])
          var newvalues = { $set: {name: "Mickey", address: "Canyon 123" } };
          dbo.collection("customers").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
          });
        }
      });
      db.close();
    });
  });
});
app.listen(PuertoNodeJS, function() {
  console.log("Node server running on " + PuertoNodeJS);
});