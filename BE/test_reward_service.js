/**
 * Test script for rewardService.processReward()
 *
 * Usage:
 *   node test_reward_service.js
 *
 * Prerequisites:
 *   1. Run migration: migrations/004_add_reward_violation_columns.sql
 *   2. Ensure DB has at least one citizen + wastereport + rewardconfig row
 *
 * This script tests the reward logic DIRECTLY without HTTP,
 * using real DB transactions that are ROLLED BACK after each test.
 */

const db = require('./src/config/database')
const rewardService = require('./src/services/rewardService')

// ═══════════════════════════════════════════════════════════════════
// Helper: run a single test case
// ═══════════════════════════════════════════════════════════════════
async function runTest(testName, testFn) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`▶ TEST: ${testName}`)
    console.log('═'.repeat(60))

    await testFn(connection)

    console.log(`✅ PASSED: ${testName}`)
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`)
    console.log(`   Error: ${error.message}`)
    if (error.status) console.log(`   HTTP Status: ${error.status}`)
  } finally {
    // Always rollback — tests are read-only
    await connection.rollback()
    connection.release()
  }
}

// ═══════════════════════════════════════════════════════════════════
// Helper: get test data from DB
// ═══════════════════════════════════════════════════════════════════
async function getTestData() {
  // Find a citizen
  const [citizens] = await db.execute(
    `SELECT c.citizen_id, c.user_account_id, c.total_points
     FROM citizen c LIMIT 1`
  )
  if (citizens.length === 0) throw new Error('No citizen found in DB')

  // Find a waste report for this citizen
  const [reports] = await db.execute(
    `SELECT wr.waste_report_id, wr.waste_type_id, wr.weight, wr.citizen_id
     FROM wastereport wr
     WHERE wr.citizen_id = ?
     LIMIT 1`,
    [citizens[0].citizen_id]
  )

  // Find a rewardconfig
  const [configs] = await db.execute(
    `SELECT rc.waste_type_id, rc.points_per_unit, rc.allowed_variance_percent,
            rc.penalty_percent, rc.min_kg_required, rc.max_kg_required
     FROM rewardconfig rc WHERE rc.is_active = 1 LIMIT 1`
  )

  return {
    citizen: citizens[0],
    report: reports[0] || null,
    config: configs[0] || null
  }
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════
async function main() {
  console.log('🔧 Reward Service Test Suite')
  console.log('============================\n')

  let testData
  try {
    testData = await getTestData()
    console.log('📋 Test Data:')
    console.log(`   Citizen ID      : ${testData.citizen.citizen_id}`)
    console.log(`   User Account ID : ${testData.citizen.user_account_id}`)
    console.log(`   Report ID       : ${testData.report?.waste_report_id || '(none)'}`)
    console.log(`   Waste Type ID   : ${testData.report?.waste_type_id || testData.config?.waste_type_id || '(none)'}`)
    console.log(`   Points/Unit     : ${testData.config?.points_per_unit || '(no config)'}`)
    console.log(`   Allowed Variance: ${testData.config?.allowed_variance_percent || '(no config)'}%`)
    console.log(`   Penalty %       : ${testData.config?.penalty_percent || '(no config)'}%`)
    console.log(`   Min KG          : ${testData.config?.min_kg_required || '(no config)'}`)
    console.log(`   Max KG          : ${testData.config?.max_kg_required || '(no config)'}`)
  } catch (err) {
    console.error('❌ Could not fetch test data:', err.message)
    process.exit(1)
  }

  const { citizen, report, config } = testData
  const wasteTypeId = report?.waste_type_id || config?.waste_type_id
  const wasteReportId = report?.waste_report_id || 'test-report-id'

  if (!wasteTypeId) {
    console.error('❌ No waste_type_id found. Ensure DB has some data.')
    process.exit(1)
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 1: Valid report — citizen reports 5 kg, collector confirms 5 kg
  // Expected: full points, isFake = false
  // ─────────────────────────────────────────────────────────────────
  await runTest('Valid report (5 kg match)', async (conn) => {
    const result = await rewardService.processReward(conn, {
      citizenId: citizen.citizen_id,
      userAccountId: citizen.user_account_id,
      wasteReportId,
      citizenReportKg: 5,
      collectorActualKg: 5,
      currentTime: new Date(),
      wasteTypeId
    })
    console.log('   Result:', JSON.stringify(result, null, 2))
    assert(result.isFake === false, 'Should NOT be fake')
    assert(result.penaltyApplied === false, 'Should NOT have penalty')
    assert(result.finalPoints > 0, 'Should earn points')
  })

  // ─────────────────────────────────────────────────────────────────
  // TEST 2: Below minimum weight
  // Expected: 0 points, not fake
  // ─────────────────────────────────────────────────────────────────
  await runTest('Below minimum weight (0.1 kg)', async (conn) => {
    const result = await rewardService.processReward(conn, {
      citizenId: citizen.citizen_id,
      userAccountId: citizen.user_account_id,
      wasteReportId,
      citizenReportKg: 0.1,
      collectorActualKg: 0.1,
      currentTime: new Date(),
      wasteTypeId
    })
    console.log('   Result:', JSON.stringify(result, null, 2))
    assert(result.finalPoints === 0, 'Should get 0 points')
    assert(result.isFake === false, 'Should NOT be fake')
  })

  // ─────────────────────────────────────────────────────────────────
  // TEST 3: Fake report — citizen reports 10 kg, collector finds 2 kg
  // Expected: penalized, isFake = true
  // ─────────────────────────────────────────────────────────────────
  await runTest('Fake report (citizen: 10 kg, collector: 2 kg)', async (conn) => {
    const result = await rewardService.processReward(conn, {
      citizenId: citizen.citizen_id,
      userAccountId: citizen.user_account_id,
      wasteReportId,
      citizenReportKg: 10,
      collectorActualKg: 2,
      currentTime: new Date(),
      wasteTypeId
    })
    console.log('   Result:', JSON.stringify(result, null, 2))
    assert(result.isFake === true, 'Should be FAKE')
    assert(result.penaltyApplied === true, 'Should have penalty applied')
    assert(result.variancePercent > 0, 'Variance should be > 0')
  })

  // ─────────────────────────────────────────────────────────────────
  // TEST 4: Collector actual = 0 (always fake)
  // Expected: isFake = true, variance = 100%
  // ─────────────────────────────────────────────────────────────────
  await runTest('Collector records 0 kg', async (conn) => {
    // Since actualKg < minKgRequired, this will hit STEP 1 first
    const result = await rewardService.processReward(conn, {
      citizenId: citizen.citizen_id,
      userAccountId: citizen.user_account_id,
      wasteReportId,
      citizenReportKg: 5,
      collectorActualKg: 0,
      currentTime: new Date(),
      wasteTypeId
    })
    console.log('   Result:', JSON.stringify(result, null, 2))
    assert(result.finalPoints === 0, 'Should get 0 points')
  })

  // ─────────────────────────────────────────────────────────────────
  // TEST 5: getViolationLevel() unit test
  // ─────────────────────────────────────────────────────────────────
  await runTest('getViolationLevel() boundaries', async () => {
    const { getViolationLevel } = rewardService
    assert(getViolationLevel(0) === 0, 'total=0 → level 0')
    assert(getViolationLevel(1) === 0, 'total=1 → level 0')
    assert(getViolationLevel(2) === 1, 'total=2 → level 1')
    assert(getViolationLevel(3) === 1, 'total=3 → level 1')
    assert(getViolationLevel(4) === 2, 'total=4 → level 2')
    assert(getViolationLevel(5) === 2, 'total=5 → level 2')
    assert(getViolationLevel(6) === 3, 'total=6 → level 3')
    assert(getViolationLevel(7) === 3, 'total=7 → level 3')
    assert(getViolationLevel(8) === 4, 'total=8 → level 4')
    assert(getViolationLevel(100) === 4, 'total=100 → level 4')
    console.log('   All getViolationLevel() checks passed ✓')
  })

  // ─────────────────────────────────────────────────────────────────
  // TEST 6: Cooldown block
  // Expected: throws 403 error
  // ─────────────────────────────────────────────────────────────────
  await runTest('Cooldown block (report_blocked_until in future)', async (conn) => {
    // Set report_blocked_until to 1 hour from now
    const futureTime = new Date(Date.now() + 3600000)
    await conn.execute(
      `UPDATE citizen SET report_blocked_until = ? WHERE citizen_id = ?`,
      [futureTime, citizen.citizen_id]
    )

    try {
      await rewardService.processReward(conn, {
        citizenId: citizen.citizen_id,
        userAccountId: citizen.user_account_id,
        wasteReportId,
        citizenReportKg: 5,
        collectorActualKg: 5,
        currentTime: new Date(),
        wasteTypeId
      })
      assert(false, 'Should have thrown an error')
    } catch (err) {
      assert(err.status === 403, `Expected 403, got ${err.status}`)
      console.log(`   Correctly blocked: "${err.message}"`)
    }
  })

  console.log('\n' + '═'.repeat(60))
  console.log('🏁 All tests complete!')
  console.log('═'.repeat(60))

  process.exit(0)
}

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
