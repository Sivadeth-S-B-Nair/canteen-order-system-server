const refundService = require("../services/refund.service");

const cancelOrder = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const { order, refundRequest } = await refundService.cancelOrder(
      req.user.userId,
      parseInt(req.params.id, 10),
      cancellationReason || null,
    );

    res.status(200).json({
      success: true,
      message: refundRequest
        ? "Order cancelled. A refund request has been submitted for admin review."
        : "Order cancelled. No payment was collected.",
      data: { order, refundRequest },
    });
  } catch (err) {
    next(err);
  }
};

const getUserRefundRequests = async (req, res, next) => {
  try {
    const requests = await refundService.getUserRefundRequests(req.user.userId);
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

const getRefundRequestByOrder = async (req, res, next) => {
  try {
    const refundRequest = await refundService.getRefundRequestByOrder(
      parseInt(req.params.orderId, 10),
      req.user.userId,
    );
    res.status(200).json({ success: true, data: refundRequest });
  } catch (err) {
    next(err);
  }
};

const listRefundRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await refundService.listRefundRequests({
      restaurantId: req.user.restaurantId,
      status: status || null,
      page,
      limit,
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const reviewRefundRequest = async (req, res, next) => {
  try {
    const { decision, adminNotes } = req.body;

    if (!decision) {
      const err = new Error("decision is required (APPROVED or REJECTED)");
      err.status = 400;
      throw err;
    }

    const refundRequest = await refundService.reviewRefundRequest({
      refundRequestId: parseInt(req.params.id, 10),
      restaurantId: req.user.restaurantId,
      adminUserId: req.user.userId,
      decision,
      adminNotes: adminNotes || null,
    });

    res.status(200).json({
      success: true,
      message: `Refund request ${decision === "APPROVED" ? "approved" : "rejected"} successfully.`,
      data: refundRequest,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  cancelOrder,
  getUserRefundRequests,
  getRefundRequestByOrder,
  listRefundRequests,
  reviewRefundRequest,
};
