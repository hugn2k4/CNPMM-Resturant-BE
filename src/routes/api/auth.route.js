import { Router } from "express";
import { googleLogin, googleCallback, googleIdTokenLogin, me } from "../../controller/auth.controller.js";
import { jwtGuard } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/ping", (_req, res) => res.send("auth ok"));
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.post("/google", googleIdTokenLogin); // Endpoint mới cho frontend GIS
router.get("/me", jwtGuard, me);

export default router;