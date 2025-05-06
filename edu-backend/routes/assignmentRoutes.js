/** @format */

const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignmentController");
const { protect, restrictTo } = require("../middleware/auth");

// Assignment CRUD routes
router.route("/")
  .get(protect, assignmentController.getAllAssignments) // Handles all filtering via query params
  .post(
    protect,
    restrictTo("faculty", "hod", "admin"),
    assignmentController.createAssignment
  );

router.route("/:id")
  .get(protect, assignmentController.getAssignmentById)
  .put(
    protect,
    restrictTo("faculty", "hod", "admin"),
    assignmentController.updateAssignment
  )
  .delete(
    protect,
    restrictTo("faculty", "hod", "admin"),
    assignmentController.deleteAssignment
  );

// Submission routes
router.route("/:id/submit")
  .post(protect, restrictTo("student"), assignmentController.submitAssignment);

// Grading routes
router.route("/:id/grade/:submissionId")
  .put(
    protect,
    restrictTo("faculty", "hod", "admin"),
    assignmentController.gradeAssignment
  );

module.exports = router;