import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { loginUser, registerUser , logoutUser } from "../controllers/user.controller.js";


const router = Router()

router.route("/sign-up").post( registerUser);
router.route("/sign-in").post(loginUser);
// protected route

router.route("/logout").post(verifyJwt , logoutUser);




export default router