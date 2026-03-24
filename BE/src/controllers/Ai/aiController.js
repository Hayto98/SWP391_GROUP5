const aiService = require('../../services/aiService')
const ApiError = require('../../errors/ApiError')

class AiController {
  /**
   * POST /api/v1/ai/predict-waste
   * Upload ảnh rác và nhờ AI nhận diện
   */
  async predictWaste(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError(400, 'Vui lòng cung cấp một hình ảnh')
      }

      const { buffer, mimetype } = req.file

      // Chỉ chấp nhận một số định dạng ảnh
      if (!mimetype.startsWith('image/')) {
        throw new ApiError(400, 'Định dạng file không hợp lệ. Vui lòng upload ảnh')
      }

      const predictionResult = await aiService.predictWasteFromImage(buffer, mimetype)

      res.status(200).json({
        success: true,
        message: 'AI đã phân tích ảnh thành công',
        data: predictionResult
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AiController()
