const VisitorCount = require('../models/Visitor');
const dayjs = require('dayjs');

exports.trackVisit = async (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');

  try {
    await VisitorCount.findOneAndUpdate(
      { date: today },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


exports.getVisitStats = async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD');

    // Get today's visit
    const todayData = await VisitorCount.findOne({ date: today });
    const daily = todayData ? todayData.count : 0;

    // Get all visits this month
    const monthlyData = await VisitorCount.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const monthly = monthlyData.reduce((sum, v) => sum + v.count, 0);

    res.status(200).json({ daily, monthly });
  } catch (error) {
    console.error('Error getting visit stats:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};


exports.getTotalVisitorCount = async (req, res) => {
  try {
    const result = await VisitorCount.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" }
        }
      }
    ]);

    const totalCount = result.length > 0 ? result[0].totalCount : 0;

    res.status(200).json({
      success: true,
      totalVisitorCount: totalCount
    });
  } catch (error) {
    console.error("Error fetching total visitor count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve total visitor count",
      error: error.message
    });
  }
};



