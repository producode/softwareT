var express = require("express"),
    app = express(),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override"),
    mongoDB = require('mongodb').MongoClient,
    archiver = require('archiver'),
    session = require("express-session"),
    path = require("path");

const DataBase = 'mongodb://127.0.0.1:27017/baseT';
const PuertoNodeJS = "50200";
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
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
  if(req.session.loggedin && (req.session.acceso == "administracion" || req.session.acceso == "normal")){
    res.render(__dirname + "/paginas/modificar.ejs",{id: 0});
  }
  else{
    mongoDB.connect(DataBase, function(err, db) {
      if (err) throw err;
      var dbo = db.db("baseT");
      dbo.collection("almacen").find({}).toArray(function(err, result) {
        if (err) throw err;
        res.render(__dirname + "/index.ejs",{documento: result});
      });
    });
  }
});
app.post('/modificacionLink',function(Request,Response){
  if(Request.session.loggedin && (Request.session.acceso == "administracion" || Request.session.acceso == "normal")){
    Response.render(__dirname + "/paginas/modificar.ejs",{id: Request.body.id});
  }
  else{
    mongoDB.connect(DataBase, function(err, db) {
      if (err) throw err;
      var dbo = db.db("baseT");
      dbo.collection("almacen").find({}).toArray(function(err, result) {
        if (err) throw err;
        Response.render(__dirname + "/index.ejs",{documento: result});
      });
    });
  }
});
app.get('/ingresar',function(req,res){
  if(req.session.loggedin && req.session.acceso == "administracion"){
    res.render(__dirname + "/paginas/ingresar.ejs",{alerta: "none"});
  }
  else{
    mongoDB.connect(DataBase, function(err, db) {
      if (err) throw err;
      var dbo = db.db("baseT");
      dbo.collection("almacen").find({}).toArray(function(err, result) {
        if (err) throw err;
        res.render(__dirname + "/index.ejs",{documento: result});
      });
    });
  }
});
app.get('/login',function(req,res){
  res.render(__dirname + "/paginas/login.ejs",{alerta:"none"});
});
app.get('/logout',function(req,res){
  mongoDB.connect(DataBase, function(err, db) {
    if (err) throw err;
    req.session.loggedin = false;
    req.session.usuario = "anonimo";
    req.session.acceso = "anonimo";
    var dbo = db.db("baseT");
    dbo.collection("almacen").find({}).toArray(function(err, result) {
      if (err) throw err;
      res.render(__dirname + "/index.ejs",{documento: result});
    });
  });
});
app.post('/loguearse',function(Request,Response){
  mongoDB.connect(DataBase,function(err,db){
    if (err) throw err;
    var dbo = db.db("baseT");
    var myquery = {usuario: Request.body.Usuario, contrasena: Request.body.Contrasena};
    console.log(myquery.usuario)
    console.log(myquery.contrasena)
    if(myquery.usuario && myquery.contrasena){
      dbo.collection("cuentas").find(myquery).toArray(function(err,result){
        if(result.length > 0){
          Request.session.loggedin = true;
          Request.session.usuario = result[0].usuario;
          Request.session.acceso = result[0].acceso;
          Response.render(__dirname + "/paginas/login.ejs",{alerta: "none"});
        }
        else{
          Response.render(__dirname + "/paginas/login.ejs",{alerta: "incorrecta"});
          db.close();
        }
      });
    }
    else{
      Response.render(__dirname + "/paginas/login.ejs",{alerta: "vacio"});
      db.close();
    }
  });
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
          var tipoModificion = Request.body.Modificacion;
          if(Request.body.Modificacion == "agregar"){
            cambiar = parseInt(element.cantidad) + parseInt(Request.body.Cantidad);
          }
          else if(Request.body.Modificacion == "sacar"){
            cambiar = parseInt(element.cantidad) - parseInt(Request.body.Cantidad);
          }
          console.log(cambiar);
          var newvalues = { $set: { cantidad: cambiar,fechaModificacion: formatoFecha((new Date(Date.now()))),modificacion: tipoModificion, editor: Request.session.usuario } };
          dbo.collection("almacen").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            dbo.collection("almacen").find({}).toArray(function(err, result) {
              if (err) throw err;
              Response.render(__dirname + "/index.ejs",{documento: result});
              db.close();
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
          var newvalues = { $set: { sector: Request.body.Sector,fechaModificacion: formatoFecha(new Date(Date.now())),modificacion: "transferencia", editor: Request.session.usuario } };
          dbo.collection("almacen").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            dbo.collection("almacen").find({}).toArray(function(err, result) {
              if (err) throw err;
              Response.render(__dirname + "/index.ejs",{documento: result});
              db.close();
            });
          });
        }
      });
    });
  });
});
app.post('/ingresarObjeto',function(Request,Response){
  mongoDB.connect(DataBase, function(err, db) {
    if (err) throw err;
    var dbo = db.db("baseT");
    dbo.collection("almacen").find({}).toArray(function(err, result) {
      if (err) throw err;
      var idNuevo = 0;
      result.forEach(element => {
        if(element.id > idNuevo){
          idNuevo = element.id;
        }
      });
      idNuevo = idNuevo + 1;
      var myobj = { id: idNuevo, nombre: Request.body.Nombre, sector:Request.body.Sector, fechaModificacion: formatoFecha(new Date(Date.now())), editor: Request.session.usuario , modificacion: "ingreso", cantidad: Request.body.Cantidad , cantidadMinima: Request.body.CantidadMinima , unidad: Request.body.Unidad };
      dbo.collection("almacen").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        dbo.collection("almacen").find({}).toArray(function(err, result) {
          if (err) throw err;
          Response.render(__dirname + "/index.ejs",{documento: result});
          db.close();
        });
      });
    });
  });
});
app.post('/eliminarObjeto',function(Request,Response){
    mongoDB.connect(DataBase, function(err, db) {
      if (err) throw err;
      var dbo = db.db("baseT");
      var myquery = { id: parseInt(Request.body.Identificador) };
      console.log(myquery);
      dbo.collection("almacen").deleteOne(myquery, function(err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        dbo.collection("almacen").find({}).toArray(function(err, result) {
          if (err) throw err;
          Response.render(__dirname + "/index.ejs",{documento: result});
          db.close();
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