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
  mongoDB.connect(DataBase, function(err, db) {
    if (err) throw err;
    var dbo = db.db("baseT");
    dbo.collection("almacen").find({}).toArray(function(err, result) {
      if (err) throw err;
      res.render(__dirname + "/index.ejs",{documento: result});
    });
  });
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
      result.forEach(element => {
        if(element.id == Request.body.Identificador){
          console.log(element);
          var myquery = { id: parseInt(Request.body.Identificador) };
          var cambiar = 0;
          if(Request.body.Modificacion == "agregar"){
            cambiar = parseInt(element.cantidad) + parseInt(Request.body.Cantidad);
          }
          else if(Request.body.Modificacion == "sacar"){
            cambiar = parseInt(element.cantidad) - parseInt(Request.body.Cantidad);
          }
          console.log(cambiar);
          var newvalues = { $set: { cantidad: cambiar,fechaModificacion: formatoFecha((new Date(Date.now()))) } };
          dbo.collection("almacen").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            dbo.collection("almacen").find({}).toArray(function(err, result) {
              if (err) throw err;
              Response.render(__dirname + "/index.ejs",{documento: result});
            });
          });
        }
      });
    });
  });
});
app.post('/transferir',function(Request,Response){

  mongoDB.connect(DataBase, function(err, db) {
    if (err) throw err;
    var dbo = db.db("baseT");
    dbo.collection("almacen").find({}).toArray(function(err, result) {
      if (err) throw err;
      result.forEach(element => {
        if(element.id == Request.body.Identificador){
          console.log(element);
          var myquery = { id: parseInt(Request.body.Identificador) };
          var newvalues = { $set: { sector: Request.body.Sector,fechaModificacion: formatoFecha(new Date(Date.now())) } };
          dbo.collection("almacen").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            dbo.collection("almacen").find({}).toArray(function(err, result) {
              if (err) throw err;
              Response.render(__dirname + "/index.ejs",{documento: result});
            });
          });
        }
      });
    });
  });
});
function formatoFecha(fechaActual){
  var minutos = fechaActual.getMinutes();
  if(minutos < 10){
    minutos = "0" + toString(minutos);
  }
  return (fechaActual.getDate() + '/' + fechaActual.getMonth() + '/' + fechaActual.getFullYear() + " " + fechaActual.getHours() + ":" + fechaActual.getMinutes());
}
app.listen(PuertoNodeJS, function() {
  console.log("Node server running on " + PuertoNodeJS);
});