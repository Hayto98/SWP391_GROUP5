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
    // Pass null (not an Error) to avoid aborting body parsing —
    // the file is silently rejected; service can check req.files.length if needed.
    cb(null, false)
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
        return next(new ApiError(400, `File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB per file.`))
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ApiError(400, `Unexpected field name. Received invalid file field name.`))
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Too many files. Maximum 5 files allowed.'))
      }
      // Generic multer or fileFilter error
      return next(new ApiError(400, err.message || 'File upload error'))
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
