"use strict";

import asyncHandler from "../middlewares/asyncHandler.js";
import summaryService from "../services/summary.service.js";

class SummaryController {
  getRevenue = asyncHandler(async (req, res) => {
    const { from, to, interval } = req.query;
    const data = await summaryService.getRevenue({ from, to, interval });
    res.status(200).json({ success: true, data });
  });

  getDeliveredOrders = asyncHandler(async (req, res) => {
    const { page, limit, from, to } = req.query;
    const data = await summaryService.getDeliveredOrders({ page, limit, from, to });
    res.status(200).json({ success: true, data });
  });

  getCashflow = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const data = await summaryService.getCashflow({ from, to });
    res.status(200).json({ success: true, data });
  });

  getNewCustomers = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const data = await summaryService.getNewCustomersCount({ from, to });
    res.status(200).json({ success: true, data });
  });

  getTopProducts = asyncHandler(async (req, res) => {
    const { from, to, limit } = req.query;
    const data = await summaryService.getTopProducts({ from, to, limit });
    res.status(200).json({ success: true, data });
  });
}

export default new SummaryController();
