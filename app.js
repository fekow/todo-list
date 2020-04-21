const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
const app = express();

mongoose.connect('mongodb+srv://admin-feko:12345678as@cluster0-dxzls.gcp.mongodb.net/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemsSchema = {
  name: {
    type: String,
    required: true
  }
}

const Item = mongoose.model("Item", itemsSchema)

const wake = new Item({
  name: "Welcome to your todolist!"
})
const eat = new Item({
  name: "Hit the + button to add a new item."
})
const study = new Item({
  name: "<-- hit this to delete an item."
})

const defaultItems = [wake, eat, study]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = new mongoose.model("List", listSchema)

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {

  Item.find({},(err, foundItems)=>{
      if (foundItems.length === 0){
        Item.insertMany(defaultItems, (err)=>{
          if (err){
            console.log(err);
          } else {
            console.log("Default items added succesfully to the database!");
          }
        })
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    })
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({name: customListName},(err, foundList)=>{
    if (!err){
      if (!foundList){
       //Create new list! 
        const list = new List({
        name: customListName,
        items: defaultItems
      })
        list.save()
        res.redirect("/"+customListName);
      } else {
      // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items });
    }
   } 
  })


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    item.save()
    res.redirect("/");
  } else {
    List.findOne({name: listName},(err, foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});


app.post("/delete", (req,res)=>{

const checkedItemId = req.body.checkbox;
const listName = req.body.listName
if (listName === "Today") {
  Item.findByIdAndRemove(checkedItemId, (err)=>{
    if(!err) {
      console.log("Succesflly deleted item!");
      res.redirect("/");
    }
  })
} else {
  List.findOneAndUpdate({name: listName},{$pull: {items:{_id: checkedItemId}}}, (err, foundList)=>{
    if(!err) {
      console.log("Succesflly deleted item!");
      res.redirect("/"+listName);
    }    
  })

}


})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
