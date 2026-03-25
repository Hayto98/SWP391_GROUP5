const { GoogleGenerativeAI } = require('@google/generative-ai')
const ApiError = require('../errors/ApiError')
const wasteTypeRepository = require('../repositories/wasteTypeRepository')

/**
 * Service xử lý AI phân tích rác thải bằng Gemini Vision
 */
class AiService {
  constructor() {
    // Khởi tạo Gemini AI khi service được gọi
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }

  /**
   * Gọi Gemini Vision nhận diện rác thải từ hình ảnh
   * @param {Buffer} imageBuffer - Buffer ảnh
   * @param {string} mimeType - mimeType của ảnh (vd: image/jpeg)
   * @returns {Object} - Danh sách rác gợi ý và ID tương ứng trong database
   */
  async predictWasteFromImage(imageBuffer, mimeType) {
    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError(500, 'GEMINI_API_KEY chưa được cấu hình trên server')
    }

    const dbWasteTypes = await wasteTypeRepository.findActiveWithReward()
    const wasteTypeNames = dbWasteTypes.map((wt) => wt.wasteTypeName).join(', ')

    // Prompt yêu cầu AI nhận diện rác và ưu tiên ghép với danh mục hiện có
    const prompt = `Bạn là một chuyên gia phân loại rác thải. Hãy phân tích hình ảnh này.
YÊU CẦU QUAN TRỌNG: Nếu trong hình ảnh KHÔNG CÓ BẤT KỲ LOẠI RÁC NÀO (ví dụ: hình người, phong cảnh, văn bản, chữ ký, động vật...), hãy trả về MỘT MẢNG RỖNG: [].
Nếu CÓ RÁC, hãy phân loại và liệt kê tên các loại rác có trong hình ảnh. ĐẶC BIỆT LƯU Ý, nếu rác trong hình thuộc một trong các danh mục sau: [${wasteTypeNames}], hãy trả về chính xác tên danh mục đó (ví dụ nếu thấy vỏ chai nước thì trả về "Nhựa" nếu có trong danh mục). Nếu có loại rác khác, hãy ghi tên ngắn gọn bằng tiếng Việt.
Chỉ trả về DUY NHẤT một mảng JSON chứa các chuỗi tiếng Việt (ví dụ: ["Nhựa", "Bìa carton"]). 
Tuyệt đối KHÔNG trả về markdown, KHÔNG dùng dấu backtick (\\\`).`

    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType
        }
      }
    ]

    let responseText = ''
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent([prompt, ...imageParts])
      responseText = result.response.text()
    } catch (err1) {
      if ((err1.message && err1.message.includes('404 Not Found')) || err1.status === 404) {
        console.warn('gemini-2.5-flash not found. Falling back to gemini-2.0-flash...')
        try {
          const fallbackModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
          const fallbackResult = await fallbackModel.generateContent([prompt, ...imageParts])
          responseText = fallbackResult.response.text()
        } catch (err2) {
          if (err2.status === 503) {
            throw new ApiError(503, 'Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau giây lát.')
          }
          throw new ApiError(500, 'Lỗi kết nối AI: ' + err2.message)
        }
      } else if (err1.status === 503 || (err1.message && err1.message.includes('503'))) {
        throw new ApiError(503, 'Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau giây lát.')
      } else {
        throw new ApiError(500, 'Xảy ra lỗi khi kết nối với AI: ' + err1.message)
      }
    }

    try {
      // Clear mọi markdown backtick
      const cleanedText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      let aiPredictions = []
      try {
        aiPredictions = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error('Lỗi parse JSON từ AI:', cleanedText)
        aiPredictions = []
      }

      const mappedResults = []

      for (const prediction of aiPredictions) {
        let matchedId = null
        let matchedName = null

        if (dbWasteTypes.length > 0) {
          for (const dbWt of dbWasteTypes) {
            const dbName = dbWt.wasteTypeName.toLowerCase()
            // Tách từ để map tốt hơn một chút (ví dụ "chai nhựa" map với "nhựa")
            const aiName = prediction.toLowerCase()

            if (aiName.includes(dbName) || dbName.includes(aiName)) {
              matchedId = dbWt.wasteTypeId
              matchedName = dbWt.wasteTypeName
              break
            }
          }
        }

        mappedResults.push({
          originalName: prediction,
          isSupported: matchedId !== null,
          matchedWasteTypeId: matchedId,
          matchedWasteTypeName: matchedName
        })
      }

      return {
        aiPredictions,
        analysis: mappedResults
      }
    } catch (error) {
      console.error('Lỗi xử lý Data từ AI:', error)
      throw new ApiError(500, 'Xử lý danh sách từ AI thất bại.')
    }
  }
}

module.exports = new AiService()
