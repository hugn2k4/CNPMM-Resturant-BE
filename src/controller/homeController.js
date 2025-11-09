"use strict";

import CRUDService from "../services/CRUDService.js";

// hàm getHomePage
let getHomePage = async (req, res) => {
  try {
    let data = await CRUDService.getAllUsers();
    return res.render("homepage.ejs", {
      data: JSON.stringify(data),
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send("Server error");
  }
};

// hàm getAboutPage
let getAboutPage = (req, res) => {
  return res.render("test/about.ejs");
};

// hàm CRUD
let getCRUD = (req, res) => {
  return res.render("crud.ejs");
};

// hàm findAll CRUD
let getFindAllCrud = async (req, res) => {
  let data = await CRUDService.getAllUsers();
  return res.render("users/findAllUser.ejs", {
    datalist: data,
  });
};

// hàm post CRUD
let postCRUD = async (req, res) => {
  let message = await CRUDService.createNewUser(req.body);
  // console.log(req.body);
  console.log(message);
  return res.send("Post crud to server");
};

// hàm lấy dữ liệu để edit
let getEditCRUD = async (req, res) => {
  let userId = req.query.id;
  if (userId) {
    let userData = await CRUDService.getUserInfoById(userId);
    return res.render("users/editUser.ejs", {
      data: userData,
    });
  } else {
    return res.send("không lấy được id");
  }
};

let putCRUD = async (req, res) => {
  let data = req.body;
  let data1 = await CRUDService.updateUserData(data);
  // let data1 = await CRUDService.getAllUsers();
  return res.render("users/findAllUser.ejs", {
    datalist: data1,
  });
  // return res.send('update thành công');
};

let deleteCRUD = async (req, res) => {
  let id = req.query.id;
  if (id) {
    await CRUDService.deleteUserById(id);
    return res.send("Deleted!!!!!!!!!!!");
  } else {
    return res.send("Not find user");
  }
};

// export ra object
export default {
  getHomePage: getHomePage,
  getAboutPage: getAboutPage,
  getCRUD: getCRUD,
  postCRUD: postCRUD,
  getFindAllCrud: getFindAllCrud,
  getEditCRUD: getEditCRUD,
  putCRUD: putCRUD,
  deleteCRUD: deleteCRUD,
};
