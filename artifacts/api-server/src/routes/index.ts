import { Router, type IRouter } from "express";
import shopDataRouter from "./shop-data.js";

const router: IRouter = Router();

router.use(shopDataRouter);

export default router;
