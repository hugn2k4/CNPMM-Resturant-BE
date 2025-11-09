import express from "express";
import homeController from "../controller/homeController.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

const initWebRoutes = (app) => {
  router.get("/", (req, res) => {
    return res.send("Lê Công Hùng");
  });

  // wrap async handlers so errors are forwarded to error middleware
  router.get("/home", asyncHandler(homeController.getHomePage));
  router.get("/about", homeController.getAboutPage);
  router.get("/crud", homeController.getCRUD);
  router.post("/post-crud", asyncHandler(homeController.postCRUD));
  router.get("/get-crud", asyncHandler(homeController.getFindAllCrud));
  router.get("/edit-crud", asyncHandler(homeController.getEditCRUD));
  router.post("/put-crud", asyncHandler(homeController.putCRUD));
  router.get("/delete-crud", asyncHandler(homeController.deleteCRUD));

  return app.use("/", router);
};

export default initWebRoutes;
