import express from "express";
import voucherController from "../../controller/voucher.controller.js";
import { authenticateUser, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/code/:code", voucherController.getVoucherByCode);

// Protected routes (authenticated users)
router.use(authenticateUser);

// User routes - Phải đặt TRƯỚC các route có params
router.get("/available", voucherController.getAvailableVouchers);
router.get("/saved", voucherController.getSavedVouchers);
router.post("/validate", voucherController.validateVoucher);

// Admin routes - Đặt TRƯỚC các route có /:id
router.post("/", authenticateUser, requireRole("ADMIN"), voucherController.createVoucher);
router.get("/admin/all", authenticateUser, requireRole("ADMIN"), voucherController.getAllVouchers);

// Routes với params - Phải đặt CUỐI CÙNG
router.get("/:id", voucherController.getVoucherById);
router.post("/:id/save", voucherController.toggleSaveVoucher);
router.patch("/:id", authenticateUser, requireRole("ADMIN"), voucherController.updateVoucher);
router.delete("/:id", authenticateUser, requireRole("ADMIN"), voucherController.deleteVoucher);

export default router;
