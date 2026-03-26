const multer = require('multer')
const ApiError = require('../errors/ApiError')

// Store files in memory as Buffer — we stream directly to Cloudinary
const storage = multer.memoryStorage()

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(400, 'Chỉ chấp nhận file ảnh định dạng (jpeg, jpg, png, webp, gif).'))
  }
}

const limits = { fileSize: MAX_FILE_SIZE_BYTES }

const _multerSingle = multer({ storage, fileFilter, limits }).single('file')
const _multerMultiple = multer({ storage, fileFilter, limits }).any()

/**
 * Wraps a multer middleware so multer-specific errors become ApiErrors
 * with human-readable messages (MB instead of bytes).
 */
function wrapMulter(multerFn) {
  return function (req, res, next) {
    multerFn(req, res, (err) => {
      if (!err) return next()

      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `Kích thước file quá lớn. Tối đa cho phép là ${MAX_FILE_SIZE_MB} MB mỗi file.`))
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ApiError(400, `Tên trường upload không hợp lệ hoặc vượt quá số lượng file cho phép.`))
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Vượt quá số lượng file cho phép. Tối đa 5 file.'))
      }
      // Generic multer or fileFilter error
      return next(new ApiError(400, err.message || 'Lỗi upload file.'))
    })
  }
}

/**
 * Single image upload — used for POST /api/reports
 * Expects field name: "file"
 */
const uploadSingle = wrapMulter(_multerSingle)

/**
 * Multiple image upload — used for POST /collector/reports/:id/complete
 * Parses all files into req.files and body fields into req.body
 */
const uploadMultiple = wrapMulter(_multerMultiple)

module.exports = { uploadSingle, uploadMultiple }
