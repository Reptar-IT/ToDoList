// jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
const view = __dirname + "/app/views/";
app.use(express.static(__dirname + "/public/"));

mongoose.connect("mongodb+srv://king-mancer:SRqqv4o1iim4TyZK@cluster0-dvn5y.mongodb.net/" + "todolistDB" + "?retryWrites=true/" , { useNewUrlParser: true });
// Create timestamps
const timestamps = {timestamps: { createdAt: "created_at", updatedAt: "updated_at" }};
// Create schemas
const itemSchema = new mongoose.Schema({name: {type: String, required:[1, "please insert a valid list name"]}, description: {type: String, max: 100}, status: Number
}, timestamps);

const listSchema = new mongoose.Schema({name: {type: String, required:[1, "please insert a valid list name"]}, description: {type: String, max: 100}, status: Number, items: [itemSchema]
}, timestamps);

// Create models
const List = new mongoose.model("List", listSchema);

let date = new Date();
let options = {day: "numeric", month: "numeric", year: "numeric"};

let day = date.toLocaleDateString("en-US", options);

app.get("/", function(req, res) {
  List.find({}, function (err, list) {
    if (err) {
      console.log(err);
    } else {
      res.render(view + "pages/index", { lists: list, date: day });
    }
  });
});

app.get("/:id/:listname", function(req, res) {
  List.findById(req.params.id, function (err, list) {
    if (err) {
      console.log(err);
    } else {
      if(_.lowerCase(list._id) === _.lowerCase(req.params.id)){
        res.render(view + "pages/show", {id: list._id, title: list.name, description: list.description, items: list.items, date: list.updated_at});
      }
    }
  });
});

app.post("/", function(req, res) {
  const list = new List({ name: _.capitalize(req.body.list), description: _.capitalize(req.body.desc) });
  list.save();
  res.redirect("/");
});

app.post("/update-list", function(req, res) {
  // find and update the doc in parent with the given id
  List.findOneAndUpdate({_id: req.body.listId}, {
    $set: { status: req.body.checkbox }
  }, {new: true}, function(err, list){
    if(err){
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.post("/delete-list", function(req, res) {
  // find model document and delete where id equal provided id
  List.deleteOne({_id: req.body.deleteList}, function(err){
    if(err) return handleError(err);
  });
  res.redirect("/");
});

app.post("/:itemTitle", function(req, res) {
  // Update by ID
  List.findOneAndUpdate({_id: req.body.listId}, {
      $push: { items: {name: _.capitalize(req.body.title), description: _.capitalize(req.body.desc)} }
    }, function(err, list){
    if(err){
      console.log(err);
    } else {
      res.redirect("/" + req.body.listId + "/" + req.params.itemTitle);
    }
  });
});

app.post("/update-item/:id", function(req, res) {
  // find the doc in an array somewhere within the list with the given id
  List.findOneAndUpdate({"items._id": req.body.itemId}, {
    $set: { "items.$.status": req.body.checkbox }
  }, {new: true}, function(err, list){
    if(err){
      console.log(err);
    } else {
      res.redirect("/" + req.body.listId + "/" + req.params.title);
    }
  });
});

app.post("/delete-item/:title", function(req, res) {
  // find the doc in an array somewhere within the list with the given id
  List.findOneAndUpdate({"items._id": req.body.itemId}, {
    $pull: { items: { _id: req.body.itemId } }
  }, {new: true}, function(err, list){
    if(err){
      console.log(err);
    } else {
      res.redirect("/" + req.body.listId + "/" + req.params.title);
    }
  });
});

app.listen(process.env.PORT || 3001, function() {
  console.log("Server running on port 3001");
});
