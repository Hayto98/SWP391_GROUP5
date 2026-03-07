    const express = require('express')
    const enterpriseController = require('../controllers/Enterprise/enterpriseController')
    const enterpriseReportController = require('../controllers/Enterprise/enterpriseReportController')
    const { verifyToken } = require('../middlewares/authMiddleware')
    const { requireRole } = require('../middlewares/roleMiddleware')
    const { ROLES } = require('../utils/constants')

    const router = express.Router()

    // ==================== MIDDLEWARE ====================
    // Apply authentication to ALL enterprise routes
    router.use(verifyToken)

    // Apply ENTERPRISE role check to ALL enterprise routes
    // Only authenticated users with role ENTERPRISE can access /api/enterprise/*
    router.use(requireRole(ROLES.ENTERPRISE))

    // ==================== WASTE TYPE ROUTES ====================

    /**
     * BE-5: POST /enterprise/waste-types - Tạo WasteType mới
     * Request body: { wasteTypeName, unitType }
     */
    router.post('/waste-types', enterpriseController.createWasteType)

    /**
     * GET /enterprise/waste-types - Lấy danh sách WasteType
     * Query params: isActive, page, limit
     */
    router.get('/waste-types', enterpriseController.getAllWasteTypes)

    /**
     * GET /enterprise/waste-types/:wasteTypeId - Lấy WasteType theo ID
     */
    router.get('/waste-types/:wasteTypeId', enterpriseController.getWasteTypeById)

    /**
     * BE-7: PUT /enterprise/waste-types/:wasteTypeId - Cập nhật WasteType
     * Request body: { wasteTypeName, unitType }
     */
    router.put('/waste-types/:wasteTypeId', enterpriseController.updateWasteType)

    /**
     * BE-8: PATCH /enterprise/waste-types/:wasteTypeId/status - Toggle WasteType Active Status
     * Request body: { isActive: true/false }
     */
    router.patch('/waste-types/:wasteTypeId/status', enterpriseController.toggleWasteTypeStatus)
    
    /**
     * BE-12: DELETE /enterprise/waste-types/:wasteTypeId - Soft delete WasteType
     */
    router.delete('/waste-types/:wasteTypeId', enterpriseController.deleteWasteType)

    // ==================== REWARD CONFIG ROUTES ====================

    /**
     * BE-6: POST /enterprise/reward-config - Tạo RewardConfig
     * Request body: { wasteTypeId, pointsPerUnit, description }
     */
    router.post('/reward-config', enterpriseController.createRewardConfig)

    /**
     * GET /enterprise/reward-config - Lấy danh sách RewardConfig
     * Query params: isActive, page, limit
     */
    router.get('/reward-config', enterpriseController.getAllRewardConfigs)

    /**
     * GET /enterprise/reward-config/waste-type/:wasteTypeId - Lấy RewardConfig theo WasteType ID
     */
    router.get('/reward-config/waste-type/:wasteTypeId', enterpriseController.getRewardConfigByWasteTypeId)

    /**
     * GET /enterprise/reward-config/:rewardConfigId - Lấy RewardConfig theo ID
     */
    router.get('/reward-config/:rewardConfigId', enterpriseController.getRewardConfigById)

    /**
     * BE-9: PUT /enterprise/reward-config/:rewardConfigId - Cập nhật RewardConfig
     * Request body: { pointsPerUnit, description }
     */
    router.put('/reward-config/:rewardConfigId', enterpriseController.updateRewardConfig)

    // ==================== REPORT ROUTES ====================

    /**
     * GET /enterprise/reports - Lấy tất cả báo cáo rác thải
     * Query params: status, fromDate, toDate, page, limit
     */
    router.get('/reports', enterpriseReportController.getAllReports)

    /**
     * BE-2: POST /enterprise/reports/:reportId/accept - Chấp nhận báo cáo
     */
    router.post('/reports/:reportId/accept', enterpriseReportController.acceptReport)

    /**
     * BE-3: POST /enterprise/reports/:reportId/reject - Từ chối báo cáo
     * Request body: { reason }
     */
    router.post('/reports/:reportId/reject', enterpriseReportController.rejectReport)

    /**
     * BE-4: POST /enterprise/reports/:reportId/assign - Assign báo cáo cho Collector
     * Request body: { collectorUserAccountId }
     */
    router.post('/reports/:reportId/assign', enterpriseReportController.assignReport)

    module.exports = router
